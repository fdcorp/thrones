import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Server } from 'http';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import {
  createRoom, joinRoom, getRoomByUserId, removePlayerFromRoom, getRoom,
  type RoomPlayer,
} from './roomManager';
import { broadcast, sendTo, handleGameOver } from './gameSession';
import { Player } from '../../../shared/types';
import type { ClientMessage } from '../../../shared/types';

// The engine is pure TS with zero browser deps — safe to import server-side
import { applyAction, initGame } from '../../../client/src/engine/gameState';

// Matchmaking queue — players waiting for an opponent
const matchmakingQueue: RoomPlayer[] = [];

function removeFromQueue(userId: number) {
  const idx = matchmakingQueue.findIndex(p => p.userId === userId);
  if (idx !== -1) matchmakingQueue.splice(idx, 1);
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

    // Remove any stale room the user may have from a previous connection
    removePlayerFromRoom(userId);

    ws.on('message', (raw) => {
      let msg: ClientMessage;
      try { msg = JSON.parse(raw.toString()) as ClientMessage; }
      catch { return; }

      switch (msg.type) {

        case 'CREATE_ROOM': {
          const player: RoomPlayer = { ws, userId, username, slot: Player.P1 };
          const room = createRoom(player);
          sendTo(player, { type: 'ROOM_JOINED', roomCode: room.code, playerSlot: Player.P1 });
          break;
        }

        case 'JOIN_ROOM': {
          const room = getRoom(msg.roomCode);
          if (!room) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found' }));
            return;
          }
          if (room.players.some(p => p.userId === userId)) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Already in this room' }));
            return;
          }
          const player: RoomPlayer = { ws, userId, username, slot: Player.P2 };
          const joined = joinRoom(msg.roomCode, player);
          if (!joined) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Room is full or unavailable' }));
            return;
          }

          const [host, guest] = joined.players;

          // Notify both
          sendTo(host,  { type: 'OPPONENT_JOINED', opponentUsername: guest.username });
          sendTo(guest, { type: 'ROOM_JOINED', roomCode: joined.code, playerSlot: Player.P2, opponentUsername: host.username });

          // Start game — host is always P1
          const gameState = initGame('online');
          joined.gameState = gameState;
          broadcast(joined, { type: 'GAME_STATE', state: gameState });
          break;
        }

        case 'ACTION': {
          const room = getRoomByUserId(userId);
          if (!room || room.status !== 'playing' || !room.gameState) return;

          const player = room.players.find(p => p.userId === userId);
          if (!player) return;

          // Validate it's this player's turn
          const gs = room.gameState as { currentPlayer: string; phase: string; winner: string | null };
          if (gs.currentPlayer !== player.slot) return;
          if (gs.phase === 'ENDED') return;

          try {
            const newState = applyAction(room.gameState as Parameters<typeof applyAction>[0], msg.action as Parameters<typeof applyAction>[1]);
            room.gameState = newState;
            broadcast(room, { type: 'GAME_STATE', state: newState });

            // Check victory
            const ns = newState as { phase: string; winner: string | null; isDraw: boolean; turnNumber: number };
            if (ns.phase === 'ENDED') {
              const winnerSlot = ns.winner as Player | null;
              handleGameOver(room, winnerSlot, ns.isDraw, ns.turnNumber);
            }
          } catch {
            sendTo(player, { type: 'ERROR', message: 'Invalid action' });
          }
          break;
        }

        case 'MATCHMAKING_JOIN': {
          // Ignore if already in queue or in a room
          if (matchmakingQueue.some(p => p.userId === userId)) break;
          if (getRoomByUserId(userId)) break;

          const seeker: RoomPlayer = { ws, userId, username, slot: Player.P1 };

          if (matchmakingQueue.length === 0) {
            // First in queue — wait
            matchmakingQueue.push(seeker);
          } else {
            // Match found — pair with the first waiter
            const host = matchmakingQueue.shift()!;
            const guest: RoomPlayer = { ...seeker, slot: Player.P2 };

            const room = createRoom(host);
            const joined = joinRoom(room.code, guest);
            if (!joined) break;

            const gameState = initGame('online');
            joined.gameState = gameState;

            // Notify both: host gets OPPONENT_JOINED, guest gets ROOM_JOINED
            sendTo(host,  { type: 'OPPONENT_JOINED', opponentUsername: guest.username });
            sendTo(guest, { type: 'ROOM_JOINED', roomCode: joined.code, playerSlot: Player.P2, opponentUsername: host.username });
            broadcast(joined, { type: 'GAME_STATE', state: gameState });
          }
          break;
        }

        case 'MATCHMAKING_LEAVE': {
          removeFromQueue(userId);
          break;
        }

        case 'PING':
          ws.send(JSON.stringify({ type: 'PONG' }));
          break;
      }
    });

    ws.on('close', () => {
      removeFromQueue(userId);
      const room = removePlayerFromRoom(userId);
      if (room && room.players.length > 0) {
        broadcast(room, { type: 'PLAYER_DISCONNECTED' });
      }
    });
  });

  return wss;
}
