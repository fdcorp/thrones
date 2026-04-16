import { create } from 'zustand';
import type { GameState, TurnAction } from '@/engine/types';
import { GamePhase, Player } from '@/engine/types';
import { initGame, applyAction } from '@/engine/gameState';
import type { AILevel, GameMode } from '@/engine/types';

interface GameStore {
  gameState: GameState | null;
  history: GameState[];          // full undo stack
  previousState: GameState | null; // kept for compatibility (= history[last])
  aiThinking: boolean;
  isUndoing: boolean;
  // Online-specific: when set, dispatch is intercepted by the socket hook
  onlineDispatch: ((action: TurnAction) => void) | null;
  onlineSurrender: (() => void) | null;

  startGame: (mode: GameMode, aiLevel?: AILevel, humanPlayer?: Player) => void;
  dispatch: (action: TurnAction) => void;
  setOnlineState: (state: GameState) => void;
  surrender: () => void;
  undoLastMove: () => void;
  resetGame: () => void;
  setAiThinking: (thinking: boolean) => void;
  setOnlineDispatch: (fn: ((action: TurnAction) => void) | null) => void;
  setOnlineSurrender: (fn: (() => void) | null) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  history: [],
  previousState: null,
  aiThinking: false,
  isUndoing: false,
  onlineDispatch: null,
  onlineSurrender: null,

  startGame: (mode, aiLevel, humanPlayer) => {
    const gameState = initGame(mode, aiLevel, humanPlayer);
    set({ gameState, history: [], previousState: null });
  },

  dispatch: (action) => {
    const { gameState, history, onlineDispatch } = get();
    if (!gameState) return;
    // In online mode, forward to socket — server will broadcast the new state
    if (onlineDispatch) { onlineDispatch(action); return; }
    const newState = applyAction(gameState, action);
    const newHistory = [...history, gameState];
    set({ previousState: gameState, history: newHistory, gameState: newState });
  },

  setOnlineState: (state) => {
    set({ gameState: state });
  },

  surrender: () => {
    const { gameState, onlineSurrender } = get();
    if (!gameState || gameState.phase !== GamePhase.PLAYING) return;
    // In online mode, let the server handle it and broadcast to both players
    if (onlineSurrender) { onlineSurrender(); return; }
    const winner = gameState.currentPlayer === Player.P1 ? Player.P2 : Player.P1;
    set({
      gameState: {
        ...gameState,
        phase: GamePhase.ENDED,
        winner,
        isDraw: false,
        drawReason: null,
      },
    });
  },

  undoLastMove: () => {
    const { history, gameState } = get();
    if (history.length === 0) return;

    // In AI mode, skip 2 states (AI move + human move) to land back on human's turn.
    // Also works when only 1 state exists (first move of the game).
    const isAIMode = gameState?.mode === 'ai';
    const steps = isAIMode && history.length >= 2 ? 2 : 1;

    const newHistory = history.slice(0, -steps);
    const previous = history[history.length - steps];
    set({
      gameState: previous,
      history: newHistory,
      previousState: newHistory.length > 0 ? newHistory[newHistory.length - 1] : null,
      aiThinking: false,
      isUndoing: true,
    });
    // Reset isUndoing after the current render cycle so useAI skips this update
    setTimeout(() => set({ isUndoing: false }), 0);
  },

  resetGame: () => {
    // Do NOT clear onlineDispatch/onlineSurrender here — the useEffect in Game.tsx
    // manages those. Clearing them here causes the 2nd online game to dispatch
    // actions locally instead of sending them to the server (rematch bug).
    set({ gameState: null, history: [], previousState: null, aiThinking: false });
  },

  setAiThinking: (thinking) => set({ aiThinking: thinking }),
  setOnlineDispatch: (fn) => set({ onlineDispatch: fn }),
  setOnlineSurrender: (fn) => set({ onlineSurrender: fn }),
}));
