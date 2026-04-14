import { useRef, useEffect, useCallback } from 'react';
import type { ClientMessage, ServerMessage } from '../../../shared/types';
import { Player } from '../../../shared/types';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001';

type SocketEventMap = {
  onRoomJoined:          (roomCode: string, slot: Player, opponentUsername?: string) => void;
  onOpponentJoined:      (opponentUsername: string) => void;
  onGameState:           (state: unknown) => void;
  onGameOver:            (winner: Player | null, isDraw: boolean, eloChangeMe: number, newEloMe: number) => void;
  onPlayerDisconnected:  () => void;
  onError:               (message: string) => void;
};

export function useSocket(handlers: Partial<SocketEventMap>) {
  const wsRef       = useRef<WebSocket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const token = useAuthStore(s => s.token);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const connect = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) { resolve(); return; }

      const ws = new WebSocket(`${WS_URL}?token=${token ?? ''}`);
      wsRef.current = ws;

      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error('WebSocket connection failed'));

      ws.onclose = (e) => {
        if (e.code === 4001) {
          handlersRef.current.onError?.('You must be signed in to play online');
        }
      };

      ws.onmessage = (evt) => {
        let msg: ServerMessage;
        try { msg = JSON.parse(evt.data as string) as ServerMessage; }
        catch { return; }

        switch (msg.type) {
          case 'ROOM_JOINED':
            handlersRef.current.onRoomJoined?.(msg.roomCode, msg.playerSlot, msg.opponentUsername);
            break;
          case 'OPPONENT_JOINED':
            handlersRef.current.onOpponentJoined?.(msg.opponentUsername);
            break;
          case 'GAME_STATE':
            handlersRef.current.onGameState?.(msg.state);
            break;
          case 'GAME_OVER':
            handlersRef.current.onGameOver?.(msg.winner, msg.isDraw, msg.eloChangeMe, msg.newEloMe);
            break;
          case 'PLAYER_DISCONNECTED':
            handlersRef.current.onPlayerDisconnected?.();
            break;
          case 'ERROR':
            handlersRef.current.onError?.(msg.message);
            break;
        }
      };
    });
  }, [token]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const createRoom = useCallback(async () => {
    await connect();
    send({ type: 'CREATE_ROOM' });
  }, [connect, send]);

  const joinRoom = useCallback(async (roomCode: string) => {
    await connect();
    send({ type: 'JOIN_ROOM', roomCode });
  }, [connect, send]);

  const sendAction = useCallback((action: unknown) => {
    send({ type: 'ACTION', action });
  }, [send]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { wsRef.current?.close(); };
  }, []);

  return { createRoom, joinRoom, sendAction, disconnect };
}

// Singleton store for online state (separate from game store to keep concerns clean)
import { create } from 'zustand';

interface OnlineState {
  roomCode:         string | null;
  mySlot:           Player | null;
  opponentUsername: string | null;
  status:           'idle' | 'creating' | 'waiting' | 'playing' | 'disconnected';
  eloChange:        number | null;
  newElo:           number | null;
  error:            string | null;
}

interface OnlineActions {
  setRoom(code: string, slot: Player): void;
  setOpponent(username: string): void;
  setStatus(s: OnlineState['status']): void;
  setGameOver(eloChange: number, newElo: number): void;
  setError(msg: string): void;
  reset(): void;
}

export const useOnlineStore = create<OnlineState & OnlineActions>()((set) => ({
  roomCode:         null,
  mySlot:           null,
  opponentUsername: null,
  status:           'idle',
  eloChange:        null,
  newElo:           null,
  error:            null,

  setRoom:     (code, slot) => set({ roomCode: code, mySlot: slot }),
  setOpponent: (username)   => set({ opponentUsername: username, status: 'playing' }),
  setStatus:   (status)     => set({ status }),
  setGameOver: (eloChange, newElo) => set({ eloChange, newElo }),
  setError:    (error)      => set({ error }),
  reset:       ()           => set({ roomCode: null, mySlot: null, opponentUsername: null, status: 'idle', eloChange: null, newElo: null, error: null }),
}));

// Re-export Player for convenience
export { Player };
