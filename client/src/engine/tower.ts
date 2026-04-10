// Tower state management
import type { BoardState, Tower } from './types';
import { Player, TowerState } from './types';
import { getNeighbors, hexEquals } from './hex';

export function updateTowerStates(board: BoardState): Tower[] {
  return board.towers.map(tower => {
    const neighbors = getNeighbors(tower.hex);
    const adjacentUnits = board.units.filter(u =>
      u.alive && neighbors.some(n => hexEquals(n, u.hex))
    );

    const hasAlly  = adjacentUnits.some(u => u.owner === tower.owner);
    const hasEnemy = adjacentUnits.some(u => u.owner !== tower.owner);

    let state: TowerState;
    if (hasEnemy) {
      state = TowerState.BLOCKED;
    } else if (hasAlly) {
      state = TowerState.ACTIVE;
    } else {
      state = TowerState.INACTIVE;
    }

    return { ...tower, state };
  });
}

export function getActiveTowers(board: BoardState, player: Player): Tower[] {
  return board.towers.filter(t => t.owner === player && t.state === TowerState.ACTIVE);
}
