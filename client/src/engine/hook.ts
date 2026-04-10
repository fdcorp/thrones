// Hook (Grappin) unit logic
import type { BoardState, Unit, HexCoord } from './types';
import { Player, UnitType } from './types';
import { getNeighbors, hexEquals, isOnBoard, getDirections } from './hex';
import { getUnitAt, isSpecialHex } from './board';

// Compute the single grapple destination: the hex 1 step from hook toward target
function grappleDestination(hook: Unit, targetHex: HexCoord): HexCoord {
  const dq = targetHex.q - hook.hex.q;
  const dr = targetHex.r - hook.hex.r;
  const ds = targetHex.s - hook.hex.s;
  const dist = Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds));
  return { q: hook.hex.q + dq / dist, r: hook.hex.r + dr / dist, s: hook.hex.s + ds / dist };
}

// Enemy units in a straight line (2 to 7 hexes — cannot grab adjacent), landing hex must be free
export function getLegalGrappleTargets(board: BoardState, hook: Unit): HexCoord[] {
  const targets: HexCoord[] = [];
  for (const dir of getDirections()) {
    for (let dist = 1; dist <= 7; dist++) {
      const hex = {
        q: hook.hex.q + dir.q * dist,
        r: hook.hex.r + dir.r * dist,
        s: hook.hex.s + dir.s * dist,
      };
      if (!isOnBoard(hex)) break;
      const unit = getUnitAt(board, hex);
      if (unit !== null) {
        // Valid target: enemy, not another Hook, and at minimum distance 2 (cannot grab adjacent)
        if (dist >= 2 && unit.owner !== hook.owner && unit.type !== UnitType.HOOK) {
          const dest = grappleDestination(hook, hex);
          if (isOnBoard(dest) && !isSpecialHex(board, dest) && getUnitAt(board, dest) === null) {
            targets.push(hex);
          }
        }
        break; // line of sight blocked by any unit (friend or foe)
      }
    }
  }
  return targets;
}

// The destination is always the hex 1 step from hook in the direction of the target
export function getLegalGrappleDestinations(board: BoardState, hook: Unit, targetHex: HexCoord): HexCoord[] {
  const dest = grappleDestination(hook, targetHex);
  if (!isOnBoard(dest)) return [];
  if (isSpecialHex(board, dest)) return [];
  if (getUnitAt(board, dest) !== null) return [];
  return [dest];
}

export interface GrappleResult {
  newBoard: BoardState;
  stunnedUnit: Unit | null;
  pulledUnit: Unit;
}

// Resolve a grapple action
export function resolveGrapple(
  board: BoardState,
  hook: Unit,
  targetHex: HexCoord,
  destinationHex: HexCoord
): GrappleResult {
  const target = getUnitAt(board, targetHex);
  if (!target) throw new Error('No unit at target hex');

  const isEnemy = target.owner !== hook.owner;
  const stunnedUnit = isEnemy ? { ...target, stunned: true } : null;

  const newUnits = board.units.map(u => {
    if (u.id === target.id) {
      return { ...u, hex: destinationHex, stunned: isEnemy };
    }
    return u;
  });

  return {
    newBoard: { ...board, units: newUnits },
    stunnedUnit,
    pulledUnit: { ...target, hex: destinationHex },
  };
}
