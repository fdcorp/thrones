import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useUIStore } from '@/store/uiStore';
import { getAIMove } from '@/engine/ai/index';
import { Player, GamePhase } from '@/engine/types';

// Watches game state and triggers AI move when it's the AI's turn
export function useAI() {
  const gameState   = useGameStore(s => s.gameState);
  const dispatch    = useGameStore(s => s.dispatch);
  const aiThinking  = useGameStore(s => s.aiThinking);
  const isUndoing   = useGameStore(s => s.isUndoing);
  const setThinking = useGameStore(s => s.setAiThinking);
  const clearSel    = useUIStore(s => s.clearSelection);

  useEffect(() => {
    if (!gameState) return;
    if (gameState.phase !== GamePhase.PLAYING) return;
    if (gameState.mode !== 'ai') return;
    const aiPlayer = gameState.aiPlayer ?? Player.P2;
    if (gameState.currentPlayer !== aiPlayer) return;
    if (aiThinking) return;
    if (isUndoing) return;

    setThinking(true);
    clearSel();

    getAIMove(gameState, gameState.aiLevel ?? 'easy').then(action => {
      if (action) dispatch(action);
      setThinking(false);
    });
  }, [gameState?.turnNumber, gameState?.currentPlayer, gameState?.phase, isUndoing]);
}
