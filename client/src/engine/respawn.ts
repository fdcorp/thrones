// Respawn logic
import type { BoardState, Unit, HexCoord, GameState } from './types';
import { UnitType, Player } from './types';
import { getNeighbors, hexEquals, isOnBoard } from './hex';
import { getUnitAt, isSpecialHex } from './board';
import { getActiveTowers } from './tower';

// Returns the tower hex itself if free (respawn happens on the tower hex)
export function getLegalRespawnHexes(board: BoardState, player: Player): HexCoord[] {
  const activeTowers = getActiveTowers(board, player);
  const hexes: HexCoord[] = [];

  for (const tower of activeTowers) {
    if (getUnitAt(board, tower.hex) === null) {
      hexes.push(tower.hex);
    }
  }
  return hexes;
}

// Returns captured units eligible for respawn (alive=false, owner=player, not Hook)
export function getEligibleRespawnUnits(gameState: GameState, player: Player): Unit[] {
  return gameState.capturedUnits
    .filter(cu => cu.unit.owner === player && cu.unit.type !== UnitType.HOOK)
    .map(cu => cu.unit);
}

// Place a captured unit back onto the board
export function resolveRespawn(board: BoardState, unit: Unit, targetHex: HexCoord): BoardState {
  const respawnedUnit: Unit = { ...unit, hex: targetHex, alive: true, stunned: false };
  const newUnits = [...board.units.filter(u => u.id !== unit.id), respawnedUnit];
  return { ...board, units: newUnits };
}
