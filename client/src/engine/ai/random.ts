// Easy AI — random valid move
import type { GameState, TurnAction } from '../types';
import { getLegalActions } from '../gameState';

export function randomMove(gameState: GameState): TurnAction | null {
  const actions = getLegalActions(gameState, gameState.currentPlayer);
  if (actions.length === 0) return null;
  return actions[Math.floor(Math.random() * actions.length)];
}
