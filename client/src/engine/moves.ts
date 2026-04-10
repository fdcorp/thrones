// Legal movement calculation per unit type
import type { BoardState, Unit, HexCoord, GameState } from './types';
import { UnitType } from './types';
import { getNeighbors, hexEquals, hexDistance, isOnBoard, getDirections } from './hex';
import { getUnitAt, isSpecialHex } from './board';

// Can a unit land on this hex?
function isLandable(board: BoardState, hex: HexCoord, unit: Unit): boolean {
  if (!isOnBoard(hex)) return false;
  // Cannot land on Throne hexes (towers are walkable)
  if (isSpecialHex(board, hex)) return false;
  // Cannot land on an occupied hex (move only — attacks are handled separately)
  if (getUnitAt(board, hex) !== null) return false;
  return true;
}

// Shield: moves 1 hex in any direction to an empty, non-special hex
function getShieldMoves(board: BoardState, unit: Unit): HexCoord[] {
  return getNeighbors(unit.hex).filter(h => isLandable(board, h, unit));
}

// Ram: up to 2 hexes in a straight line, can jump over units (but not structures)
function getRamMoves(board: BoardState, unit: Unit): HexCoord[] {
  const moves: HexCoord[] = [];
  for (const dir of getDirections()) {
    for (let dist = 1; dist <= 2; dist++) {
      const hex = {
        q: unit.hex.q + dir.q * dist,
        r: unit.hex.r + dir.r * dist,
        s: unit.hex.s + dir.s * dist,
      };
      if (!isOnBoard(hex)) break;
      if (isSpecialHex(board, hex)) break; // cannot land on or pass through Throne
      if (getUnitAt(board, hex) !== null) continue; // can jump over units, but not land on them
      moves.push(hex);
    }
  }
  return moves;
}

// Warrior: 1 hex in any direction OR exactly 2 hexes in L-shape (no straight 2-step)
function getWarriorMoves(board: BoardState, unit: Unit): HexCoord[] {
  const moves: HexCoord[] = [];
  const neighbors = getNeighbors(unit.hex);

  // 1-step moves: any adjacent free non-throne hex
  for (const n of neighbors) {
    if (isLandable(board, n, unit)) {
      moves.push(n);
    }
  }

  // 2-step L-shape moves: intermediate must be free, destination must change direction
  for (const n of neighbors) {
    if (!isOnBoard(n)) continue;
    if (getUnitAt(board, n) !== null) continue; // intermediate must be free
    if (isSpecialHex(board, n)) continue;

    for (const n2 of getNeighbors(n)) {
      if (!isOnBoard(n2)) continue;
      if (hexEquals(n2, unit.hex)) continue; // can't return to origin
      if (getUnitAt(board, n2) !== null) continue;
      if (isSpecialHex(board, n2)) continue;
      // Exclude straight-line: n2 = 2*n - unit.hex means same direction as first step
      if (n2.q === 2 * n.q - unit.hex.q && n2.r === 2 * n.r - unit.hex.r) continue;
      moves.push(n2);
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return moves.filter(h => {
    const k = `${h.q},${h.r},${h.s}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// Hook: 1 hex in any direction to empty non-special hex
function getHookMoves(board: BoardState, unit: Unit): HexCoord[] {
  return getNeighbors(unit.hex).filter(h => isLandable(board, h, unit));
}

export function getLegalMoves(board: BoardState, unit: Unit, _gameState?: GameState): HexCoord[] {
  if (!unit.alive || unit.stunned) return [];

  switch (unit.type) {
    case UnitType.SHIELD:  return getShieldMoves(board, unit);
    case UnitType.RAM:     return getRamMoves(board, unit);
    case UnitType.WARRIOR: return getWarriorMoves(board, unit);
    case UnitType.HOOK:    return getHookMoves(board, unit);
  }
}

// Check if warrior can reach a target hex for ATTACKING (1-step adjacent OR L-shape 2 steps).
// For movement, getWarriorMoves uses isLandable directly — this function is exclusively for attack reach.
// dist=1: any adjacent on-board hex is reachable (caller already ensures target is a valid enemy unit).
export function warriorCanReach(board: BoardState, warrior: Unit, targetHex: HexCoord): boolean {
  const dist = hexDistance(warrior.hex, targetHex);

  // 1-step: adjacent — geometrically reachable with no intermediate to block
  if (dist === 1) {
    return isOnBoard(targetHex);
  }

  // 2-step L-shape
  if (dist === 2) {
    for (const n of getNeighbors(warrior.hex)) {
      if (!isOnBoard(n)) continue;
      if (getUnitAt(board, n) !== null) continue; // intermediate must be free
      if (isSpecialHex(board, n)) continue;
      if (!getNeighbors(n).some(nn => hexEquals(nn, targetHex))) continue;
      // Exclude straight-line path (same direction both steps)
      if (targetHex.q === 2 * n.q - warrior.hex.q && targetHex.r === 2 * n.r - warrior.hex.r) continue;
      return true; // valid L-shape path found
    }
  }

  return false;
}
