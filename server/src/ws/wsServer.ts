import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Server } from 'http';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import {
  createRoom, joinRoom, getRoomByUserId, getRoomByWs,
  removePlayerFromRoomByWs, getRoom,
  CLOCK_INITIAL, CLOCK_INCREMENT,
  type RoomPlayer, type Room,
} from './roomManager';
import { broadcast, sendTo, handleGameOver } from './gameSession';
import { Player } from '../../../shared/types';
import type { ClientMessage } from '../../../shared/types';
import { getUserById } from '../db/queries';

// The engine is pure TS with zero browser deps — safe to import server-side
import { applyAction, initGame } from '../../../client/src/engine/gameState';

// ── Chess clock helpers ──────────────────────────────────────────────────────

function getActiveSlot(room: Room): 0 | 1 {
  const gs = room.gameState as { currentPlayer: string } | null;
  return gs?.currentPlayer === Player.P2 ? 1 : 0;
}

function startClock(room: Room) {
  if (!room.timerEnabled) return;
  room.clocks = [CLOCK_INITIAL, CLOCK_INITIAL];
  room.lastActionTime = Date.now();
  room.clockTick = setInterval(() => tickClock(room), 1000);
}

function stopClock(room: Room) {
  if (room.clockTick) {
    clearInterval(room.clockTick);
    room.clockTick = undefined;
  }
}

function tickClock(room: Room) {
  if (!room.timerEnabled || room.status !== 'playing') { stopClock(room); return; }
  const gs = room.gameState as { currentPlayer: string; phase: string; turnNumber: number } | null;
  if (!gs || gs.phase === 'ENDED') { stopClock(room); return; }

  const slot = getActiveSlot(room);
  const elapsed = Date.now() - room.lastActionTime;
  const remaining = room.clocks[slot] - elapsed;

  if (remaining <= 0) {
    stopClock(room);
    const winnerSlot = slot === 0 ? Player.P2 : Player.P1;
    const newState = { ...(gs as object), phase: 'ENDED', winner: winnerSlot, isDraw: false, drawReason: null };
    room.gameState = newState;
    room.status = 'finished';
    broadcast(room, { type: 'GAME_STATE', state: newState });
    handleGameOver(room, winnerSlot, false, gs.turnNumber, room.ranked ? 'online_ranked' : room.isMatchmaking ? 'online_casual' : 'online_custom');
    return;
  }

  const clocksNow: [number, number] = [
    slot === 0 ? remaining : room.clocks[0],
    slot === 1 ? remaining : room.clocks[1],
  ];
  broadcast(room, { type: 'CLOCK_UPDATE', clocks: clocksNow, activeSlot: slot });
}

function updateClockOnAction(room: Room) {
  if (!room.timerEnabled) return;
  const slot = getActiveSlot(room);
  const elapsed = Date.now() - room.lastActionTime;
  room.clocks[slot] = Math.max(0, room.clocks[slot] - elapsed + CLOCK_INCREMENT);
  room.lastActionTime = Date.now();
}

// Matchmaking queues — separate ranked and casual to avoid cross-mode matches
const rankedQueue:  RoomPlayer[] = [];
const casualQueue:  RoomPlayer[] = [];

function removeFromQueue(ws: WebSocket) {
  for (const queue of [rankedQueue, casualQueue]) {
    const idx = queue.findIndex(p => p.ws === ws);
    if (idx !== -1) { queue.splice(idx, 1); return; }
  }
}

export function setupWsServer(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    // Authenticate via token in query string: ws://host?token=xxx
    const url   = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    let userId = 0;
    let username = '';

    try {
      if (!token) throw new Error('No token');
      const payload = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
      userId   = payload.id;
      username = payload.username;
    } catch {
      ws.close(4001, 'Unauthorized');
      return;
    }

    // Remove any stale queue/room entry tied to THIS ws connection (not by userId,
    // so that a second tab from the same account doesn't evict the first tab)
    removeFromQueue(ws);
    removePlayerFromRoomByWs(ws);

    ws.on('message', (raw) => {
      let msg: ClientMessage;
      try { msg = JSON.parse(raw.toString()) as ClientMessage; }
      catch { return; }

      switch (msg.type) {

        case 'CREATE_ROOM': {
          const hostSlot = msg.preferredSlot === Player.P2 ? Player.P2
            : msg.preferredSlot === Player.P1 ? Player.P1
            : (Math.random() < 0.5 ? Player.P1 : Player.P2);
          const player: RoomPlayer = { ws, userId, username, slot: hostSlot };
          const room = createRoom(player, false, false, msg.timerEnabled ?? false);
          sendTo(player, { type: 'ROOM_JOINED', roomCode: room.code, playerSlot: hostSlot });
          break;
        }

        case 'JOIN_ROOM': {
          const room = getRoom(msg.roomCode);
          if (!room) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found' }));
            return;
          }
          if (room.players.some(p => p.ws === ws)) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Already in this room' }));
            return;
          }
          // Guest gets the opposite slot of the host
          const hostSlot = room.players[0]?.slot ?? Player.P1;
          const guestSlot = hostSlot === Player.P1 ? Player.P2 : Player.P1;
          const player: RoomPlayer = { ws, userId, username, slot: guestSlot };
          const joined = joinRoom(msg.roomCode, player);
          if (!joined) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Room is full or unavailable' }));
            return;
          }

          const [host, guest] = joined.players;
          const hostUser  = getUserById(host.userId);
          const guestUser = getUserById(guest.userId);

          // Notify both with full ROOM_JOINED so each client has slot + opponent info before GAME_STATE
          sendTo(host,  { type: 'ROOM_JOINED', roomCode: joined.code, playerSlot: host.slot, opponentUsername: guest.username, opponentElo: guestUser?.elo, opponentInPlacement: (guestUser?.provisional_games_left ?? 0) > 0 });
          sendTo(guest, { type: 'ROOM_JOINED', roomCode: joined.code, playerSlot: guest.slot, opponentUsername: host.username, opponentElo: hostUser?.elo, opponentInPlacement: (hostUser?.provisional_games_left ?? 0) > 0 });

          // Start game — host is always P1
          const gameState = initGame('online');
          joined.gameState = gameState;
          broadcast(joined, { type: 'GAME_STATE', state: gameState });
          startClock(joined);
          break;
        }

        case 'ACTION': {
          const room = getRoomByWs(ws);
          if (!room || room.status !== 'playing' || !room.gameState) return;

          const player = room.players.find(p => p.ws === ws);
          if (!player) return;

          const gs = room.gameState as { currentPlayer: string; phase: string; winner: string | null; turnNumber: number };
          if (gs.phase === 'ENDED') return;

          // Surrender is valid regardless of whose turn it is
          if ((msg.action as { type: string }).type === 'SURRENDER') {
            const opponent = room.players.find(p => p.ws !== ws);
            const winnerSlot = opponent?.slot ?? null;
            const newState = { ...(room.gameState as object), phase: 'ENDED', winner: winnerSlot, isDraw: false, drawReason: null };
            room.gameState = newState;
            broadcast(room, { type: 'GAME_STATE', state: newState });
            handleGameOver(room, winnerSlot, false, gs.turnNumber, room.ranked ? 'online_ranked' : room.isMatchmaking ? 'online_casual' : 'online_custom');
            break;
          }

          // Validate it's this player's turn for regular actions
          if (gs.currentPlayer !== player.slot) return;

          try {
            updateClockOnAction(room);
            const newState = applyAction(room.gameState as Parameters<typeof applyAction>[0], msg.action as Parameters<typeof applyAction>[1]);
            room.gameState = newState;
            broadcast(room, { type: 'GAME_STATE', state: newState });

            const ns = newState as { phase: string; winner: string | null; isDraw: boolean; turnNumber: number };
            if (ns.phase === 'ENDED') {
              stopClock(room);
              const winnerSlot = ns.winner as Player | null;
              handleGameOver(room, winnerSlot, ns.isDraw, ns.turnNumber, room.ranked ? 'online_ranked' : room.isMatchmaking ? 'online_casual' : 'online_custom');
            }
          } catch {
            sendTo(player, { type: 'ERROR', message: 'Invalid action' });
          }
          break;
        }

        case 'SURRENDER': {
          const room = getRoomByWs(ws);
          if (!room || room.status !== 'playing' || !room.gameState) break;

          const gs = room.gameState as { phase: string; turnNumber: number };
          if (gs.phase === 'ENDED') break;

          stopClock(room);
          const opponent = room.players.find(p => p.ws !== ws);
          const winnerSlot = opponent?.slot ?? null;

          const newState = {
            ...(room.gameState as object),
            phase: 'ENDED',
            winner: winnerSlot,
            isDraw: false,
            drawReason: null,
          };
          room.gameState = newState;
          broadcast(room, { type: 'GAME_STATE', state: newState });
          handleGameOver(room, winnerSlot, false, gs.turnNumber, room.ranked ? 'online_ranked' : room.isMatchmaking ? 'online_casual' : 'online_custom');
          break;
        }

        case 'MATCHMAKING_JOIN': {
          // Remove any stale queue entry from same userId (old ws after page reload)
          for (const queue of [rankedQueue, casualQueue]) {
            const staleIdx = queue.findIndex(p => p.userId === userId && p.ws !== ws);
            if (staleIdx !== -1) queue.splice(staleIdx, 1);
          }
          // Ignore if already in queue on this ws
          if (rankedQueue.some(p => p.ws === ws) || casualQueue.some(p => p.ws === ws)) break;
          // Ignore if still in an active (non-finished) room
          const activeRoom = getRoomByWs(ws);
          if (activeRoom && activeRoom.status !== 'finished') break;
          // Remove from finished room so it doesn't block future lookups
          if (activeRoom) removePlayerFromRoomByWs(ws);

          const isRanked = msg.ranked ?? false;
          console.log(`[MATCHMAKING_JOIN] user=${username} ranked=${isRanked} | casualQ=${casualQueue.length} rankedQ=${rankedQueue.length}`);
          const seeker: RoomPlayer = { ws, userId, username, slot: Player.P1, ranked: isRanked };
          const queue = isRanked ? rankedQueue : casualQueue;

          if (queue.length === 0) {
            // First in this queue — wait
            queue.push(seeker);
            console.log(`[MATCHMAKING] ${username} waiting in ${isRanked ? 'RANKED' : 'CASUAL'} queue`);
          } else {
            // Match found — pair with the first waiter in the same queue
            const host = queue.shift()!;
            const guest: RoomPlayer = { ...seeker, slot: Player.P2 };

            const room = createRoom(host, isRanked, true);
            console.log(`[MATCHMAKING] Match found! host=${host.username} guest=${guest.username} ranked=${isRanked} → room.ranked=${room.ranked}`);
            const joined = joinRoom(room.code, guest);
            if (!joined) break;

            const gameState = initGame('online');
            joined.gameState = gameState;
            joined.timerEnabled = true; // matchmaking always has timer

            // Notify both with ROOM_JOINED so each client knows their slot and room code
            const hostUser2  = getUserById(host.userId);
            const guestUser2 = getUserById(guest.userId);
            sendTo(host,  { type: 'ROOM_JOINED', roomCode: joined.code, playerSlot: Player.P1, opponentUsername: guest.username, opponentElo: guestUser2?.elo, opponentInPlacement: (guestUser2?.provisional_games_left ?? 0) > 0, ranked: isRanked });
            sendTo(guest, { type: 'ROOM_JOINED', roomCode: joined.code, playerSlot: Player.P2, opponentUsername: host.username,  opponentElo: hostUser2?.elo, opponentInPlacement: (hostUser2?.provisional_games_left  ?? 0) > 0, ranked: isRanked });
            broadcast(joined, { type: 'GAME_STATE', state: gameState });
            startClock(joined);
          }
          break;
        }

        case 'MATCHMAKING_LEAVE': {
          removeFromQueue(ws);
          break;
        }

        case 'CHAT_MESSAGE': {
          if (!msg.text || typeof msg.text !== 'string') break;
          const clean = msg.text.trim().slice(0, 200);
          const URL_RE = /https?:\/\/\S+|www\.\S+|\S+\.\S{2,}\/\S*/i;
          if (!clean || URL_RE.test(clean)) break;

          const room = getRoomByWs(ws);
          if (!room || room.status !== 'playing') break;

          const other = room.players.find(p => p.ws !== ws);
          if (other) {
            sendTo(other, { type: 'CHAT_MESSAGE', username, text: clean, timestamp: Date.now() });
          }
          break;
        }

        case 'PING':
          ws.send(JSON.stringify({ type: 'PONG' }));
          break;
      }
    });

    ws.on('close', () => {
      removeFromQueue(ws);

      // Get room before removing the player (needed for ELO/game-over logic)
      const room = getRoomByWs(ws);
      if (!room) return;

      const gs = room.gameState as { phase: string; turnNumber: number } | null;

      if (room.status === 'playing' && gs?.phase === 'PLAYING') {
        stopClock(room);
        // Game in progress — remaining player wins by forfeit
        const winner = room.players.find(p => p.ws !== ws);
        if (winner) {
          const newState = {
            ...(gs as object),
            phase: 'ENDED',
            winner: winner.slot,
            isDraw: false,
            drawReason: null,
          };
          room.gameState = newState;
          // Notify remaining player with new game state
          sendTo(winner, { type: 'GAME_STATE', state: newState });
          // Record game over (ELO etc.) — both players still in room at this point
          handleGameOver(room, winner.slot, false, gs.turnNumber, room.ranked ? 'online_ranked' : room.isMatchmaking ? 'online_casual' : 'online_custom');
        }
        room.status = 'finished';
      } else {
        // Game already finished (surrender, throne kill, draw) — just clean up.
        // Do NOT send PLAYER_DISCONNECTED: the opponent is already on the EndScreen
        // and a spurious disconnect notification would be confusing.
        const alreadyFinished = room.status === 'finished';
        removePlayerFromRoomByWs(ws);
        if (!alreadyFinished && room.players.length > 0) {
          broadcast(room, { type: 'PLAYER_DISCONNECTED' });
        }
      }
    });
  });

  return wss;
}
