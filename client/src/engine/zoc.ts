// Zone of Control (ZoC) — Shield mechanic
import type { BoardState, HexCoord } from './types';
import { UnitType, Player } from './types';
import { getNeighbors, hexEquals } from './hex';

// Returns all hexes under ZoC of the enemy (shields of the enemy player adjacent to these hexes)
export function getZocHexes(board: BoardState, forPlayer: Player): HexCoord[] {
  const enemyPlayer = forPlayer === Player.P1 ? Player.P2 : Player.P1;
  const enemyShields = board.units.filter(u =>
    u.alive && u.owner === enemyPlayer && u.type === UnitType.SHIELD
  );
  const zocSet = new Set<string>();
  const zocHexes: HexCoord[] = [];

  for (const shield of enemyShields) {
    for (const neighbor of getNeighbors(shield.hex)) {
      const key = `${neighbor.q},${neighbor.r},${neighbor.s}`;
      if (!zocSet.has(key)) {
        zocSet.add(key);
        zocHexes.push(neighbor);
      }
    }
  }
  return zocHexes;
}

// Is the unit currently standing on a hex under enemy ZoC?
export function isUnderZoc(board: BoardState, unit: { hex: HexCoord; owner: Player }): boolean {
  const zocHexes = getZocHexes(board, unit.owner);
  return zocHexes.some(h => hexEquals(h, unit.hex));
}

// If a unit is under ZoC, it can only move (not attack or use ability)
export function canOnlyEscape(board: BoardState, unit: { hex: HexCoord; owner: Player }): boolean {
  return isUnderZoc(board, unit);
}
