// Unified AI interface
import type { GameState, TurnAction } from '../types';
import type { AILevel } from '../types';
import { randomMove } from './random';
import { heuristicMove } from './heuristic';
import { minimaxMove } from './minimax';

export async function getAIMove(gameState: GameState, level: AILevel): Promise<TurnAction | null> {
  // Artificial delay for better UX (300-600ms)
  const delay = 300 + Math.random() * 300;
  await new Promise(resolve => setTimeout(resolve, delay));

  switch (level) {
    case 'easy':   return randomMove(gameState);
    case 'medium': return heuristicMove(gameState);
    case 'hard':   return minimaxMove(gameState);
  }
}
