// Victory and draw condition detection
import type { GameState } from './types';
import { Player, UnitType } from './types';
import type { DrawReason } from './types';
import { hexDistance } from './hex';
import { getEnemyPlayer } from './board';

export interface VictoryResult {
  winner: Player | null;
  draw: boolean;
  reason: DrawReason | null;
}

export function checkVictory(gameState: GameState): VictoryResult {
  // Check throne destruction
  for (const throne of gameState.board.thrones) {
    if (!throne.alive) {
      const winner = getEnemyPlayer(throne.owner);
      return { winner, draw: false, reason: null };
    }
  }

  // Check annihilation: a player with no alive units loses
  for (const p of [Player.P1, Player.P2] as Player[]) {
    const aliveUnits = gameState.board.units.filter(u => u.alive && u.owner === p);
    if (aliveUnits.length === 0) {
      return { winner: getEnemyPlayer(p), draw: false, reason: null };
    }
  }

  // Check repetition draw (same position ×3)
  if (hasRepetitionDraw(gameState)) {
    return { winner: null, draw: true, reason: 'repetition' };
  }

  // Check stagnation draw rule (40 turns without capture or Warrior progression)
  if (hasStagnationDraw(gameState)) {
    return { winner: null, draw: true, reason: 'stagnation' };
  }

  return { winner: null, draw: false, reason: null };
}

function hasRepetitionDraw(gameState: GameState): boolean {
  const current = serializePosition(gameState);
  let count = 0;
  for (const pos of gameState.positionHistory) {
    if (pos === current) count++;
  }
  return count >= 3;
}

// Stagnation draw: 40 turns without any capture OR Warrior advancing closer to enemy Throne.
// The Warrior progression tracking is updated in gameState.ts (minWarriorDistanceP1/P2)
// and resets turnsSinceLastCapture whenever a Warrior beats its closest-approach record.
function hasStagnationDraw(gameState: GameState): boolean {
  return gameState.turnsSinceLastCapture >= 40;
}

// Deterministic serialization of board position for repetition detection
export function serializePosition(gameState: GameState): string {
  const units = gameState.board.units
    .filter(u => u.alive)
    .map(u => `${u.id}:${u.hex.q},${u.hex.r},${u.hex.s}:${u.stunned}`)
    .sort()
    .join('|');
  return `${gameState.currentPlayer}::${units}`;
}

export function recordPosition(gameState: GameState): GameState {
  const pos = serializePosition(gameState);
  return {
    ...gameState,
    positionHistory: [...gameState.positionHistory, pos],
  };
}

// Compute minimum distance of player's Warriors to enemy Throne
export function computeMinWarriorDistance(gameState: GameState, player: Player): number {
  const enemy = getEnemyPlayer(player);
  const enemyThrone = gameState.board.thrones.find(t => t.owner === enemy && t.alive);
  if (!enemyThrone) return 0;

  const warriorUnits = gameState.board.units.filter(u =>
    u.alive && u.owner === player && u.type === UnitType.WARRIOR
  );
  if (warriorUnits.length === 0) return 999;
  return Math.min(...warriorUnits.map(w => hexDistance(w.hex, enemyThrone.hex)));
}
