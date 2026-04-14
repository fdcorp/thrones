// Unified AI interface
import type { GameState, TurnAction } from '../types';
import type { AILevel } from '../types';
import { randomMove } from './random';
import { heuristicMove } from './heuristic';
import { minimaxMove } from './minimax';
import { expertMove } from './expert';

// Artificial delay before computation.
// For Easy/Medium: the delay IS the wait (computation is instant).
// For Hard/Expert: computation already takes 1.5–2.5s; keep delay minimal.
const DELAY_MS: Record<AILevel, [number, number]> = {
  easy:   [250, 450],
  medium: [200, 350],
  hard:   [80,  150],
  expert: [80,  150],
};

export async function getAIMove(gameState: GameState, level: AILevel): Promise<TurnAction | null> {
  const [min, max] = DELAY_MS[level];
  const delay = min + Math.random() * (max - min);
  await new Promise(resolve => setTimeout(resolve, delay));

  switch (level) {
    case 'easy':   return randomMove(gameState);
    case 'medium': return heuristicMove(gameState);
    case 'hard':   return minimaxMove(gameState);
    case 'expert': return expertMove(gameState);
  }
}
