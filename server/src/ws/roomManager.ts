import type WebSocket from 'ws';
import { Player } from '../../../shared/types';

export interface RoomPlayer {
  ws: WebSocket;
  userId: number;
  username: string;
  slot: Player;
  ranked?: boolean;
}

export interface Room {
  code: string;
  players: RoomPlayer[];
  gameState: unknown | null;
  status: 'waiting' | 'playing' | 'finished';
  ranked: boolean;
  isMatchmaking: boolean;
  createdAt: Date;
  timerEnabled: boolean;
  clocks: [number, number];
  lastActionTime: number;
  clockTick?: ReturnType<typeof setInterval>;
}

const rooms = new Map<string, Room>();

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const CLOCK_INITIAL = 10 * 60 * 1000; // 10 minutes in ms
export const CLOCK_INCREMENT = 10 * 1000;    // +10 seconds per move

export function createRoom(player: RoomPlayer, ranked = false, isMatchmaking = false, timerEnabled = false): Room {
  let code: string;
  do { code = generateCode(); } while (rooms.has(code));

  const room: Room = {
    code,
    players: [player],
    gameState: null,
    status: 'waiting',
    ranked,
    isMatchmaking,
    createdAt: new Date(),
    timerEnabled,
    clocks: [CLOCK_INITIAL, CLOCK_INITIAL],
    lastActionTime: 0,
  };
  rooms.set(code, room);
  return room;
}

export function joinRoom(code: string, player: RoomPlayer): Room | null {
  const room = rooms.get(code);
  if (!room || room.status !== 'waiting' || room.players.length >= 2) return null;

  // slot is already set by the caller
  room.players.push(player);
  room.status = 'playing';
  return room;
}

export function getRoomByUserId(userId: number): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.userId === userId)) return room;
  }
  return undefined;
}

export function getRoomByWs(ws: WebSocket): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.ws === ws)) return room;
  }
  return undefined;
}

export function removePlayerFromRoom(userId: number) {
  for (const [code, room] of rooms.entries()) {
    const idx = room.players.findIndex(p => p.userId === userId);
    if (idx !== -1) {
      room.players.splice(idx, 1);
      if (room.players.length === 0) {
        rooms.delete(code);
      } else {
        room.status = 'finished';
      }
      return room;
    }
  }
  return undefined;
}

export function removePlayerFromRoomByWs(ws: WebSocket) {
  for (const [code, room] of rooms.entries()) {
    const idx = room.players.findIndex(p => p.ws === ws);
    if (idx !== -1) {
      room.players.splice(idx, 1);
      if (room.players.length === 0) {
        rooms.delete(code);
      } else {
        room.status = 'finished';
      }
      return room;
    }
  }
  return undefined;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

export function closeRoom(code: string) {
  rooms.delete(code);
}

// Clean up stale rooms older than 2 hours
setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [code, room] of rooms.entries()) {
    if (room.createdAt.getTime() < cutoff) {
      rooms.delete(code);
    }
  }
}, 30 * 60 * 1000);
