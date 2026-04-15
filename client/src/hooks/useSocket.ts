import { useRef, useEffect, useCallback } from 'react';
import type { ClientMessage, ServerMessage } from '../../../shared/types';
import { Player } from '../../../shared/types';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001';

type SocketEventMap = {
  onRoomJoined:          (roomCode: string, slot: Player, opponentUsername?: string, opponentElo?: number, opponentInPlacement?: boolean, ranked?: boolean) => void;
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
        } else if (e.code !== 1000 && e.code !== 1001) {
          // Unexpected close (server unreachable, network issue, etc.)
          const s = useOnlineStore.getState().status;
          if (s !== 'playing' && s !== 'idle') {
            handlersRef.current.onError?.('Connection lost — please try again');
          }
        }
      };

      ws.onmessage = (evt) => {
        let msg: ServerMessage;
        try { msg = JSON.parse(evt.data as string) as ServerMessage; }
        catch { return; }

        switch (msg.type) {
          case 'ROOM_JOINED':
            handlersRef.current.onRoomJoined?.(msg.roomCode, msg.playerSlot, msg.opponentUsername, msg.opponentElo, msg.opponentInPlacement, msg.ranked);
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

  const createRoom = useCallback(async (preferredSlot?: Player) => {
    await connect();
    send({ type: 'CREATE_ROOM', preferredSlot });
  }, [connect, send]);

  const joinRoom = useCallback(async (roomCode: string) => {
    await connect();
    send({ type: 'JOIN_ROOM', roomCode });
  }, [connect, send]);

  const joinQueue = useCallback(async (ranked: boolean) => {
    await connect();
    send({ type: 'MATCHMAKING_JOIN', ranked });
  }, [connect, send]);

  const leaveQueue = useCallback(() => {
    send({ type: 'MATCHMAKING_LEAVE' });
  }, [send]);

  const sendAction = useCallback((action: unknown) => {
    send({ type: 'ACTION', action });
  }, [send]);

  const sendSurrender = useCallback(() => {
    send({ type: 'SURRENDER' });
  }, [send]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { wsRef.current?.close(); };
  }, []);

  return { createRoom, joinRoom, joinQueue, leaveQueue, sendAction, sendSurrender, disconnect };
}

// Singleton store for online state (separate from game store to keep concerns clean)
import { create } from 'zustand';

interface OnlineState {
  roomCode:         string | null;
  mySlot:           Player | null;
  opponentUsername: string | null;
  opponentElo:          number | null;
  opponentInPlacement:  boolean;
  status:           'idle' | 'creating' | 'waiting' | 'searching' | 'playing' | 'disconnected';
  eloChange:        number | null;
  newElo:           number | null;
  error:            string | null;
  showIntro:        boolean;
  isRanked:         boolean;
}

interface OnlineActions {
  setRoom(code: string, slot: Player): void;
  setOpponent(username: string, elo?: number, inPlacement?: boolean): void;
  setStatus(s: OnlineState['status']): void;
  setGameOver(eloChange: number, newElo: number): void;
  setError(msg: string): void;
  setShowIntro(v: boolean): void;
  setIsRanked(v: boolean): void;
  reset(): void;
}

export const useOnlineStore = create<OnlineState & OnlineActions>()((set) => ({
  roomCode:         null,
  mySlot:           null,
  opponentUsername: null,
  opponentElo:          null,
  opponentInPlacement:  false,
  status:           'idle',
  eloChange:        null,
  newElo:           null,
  error:            null,
  showIntro:        false,
  isRanked:         false,

  setRoom:        (code, slot) => set({ roomCode: code, mySlot: slot }),
  setOpponent:    (username, elo, inPlacement) => set({ opponentUsername: username, opponentElo: elo ?? null, opponentInPlacement: inPlacement ?? false, status: 'playing' }),
  setStatus:      (status)     => set({ status }),
  setGameOver:    (eloChange, newElo) => set({ eloChange, newElo }),
  setError:       (error)      => set({ error }),
  setShowIntro:   (v)          => set({ showIntro: v }),
  setIsRanked:    (v)          => set({ isRanked: v }),
  reset:          ()           => set({ roomCode: null, mySlot: null, opponentUsername: null, opponentElo: null, opponentInPlacement: false, status: 'idle', eloChange: null, newElo: null, error: null, showIntro: false, isRanked: false }),
}));

// Re-export Player for convenience
export { Player };
