// Combat resolution — captures, attacks, throne kills
import type { BoardState, Unit, HexCoord, GameState } from './types';
import { UnitType, Player } from './types';
import { getNeighbors, hexEquals, isOnBoard, getDirections } from './hex';
import { getUnitAt, isSpecialHex, getThroneAt, getEnemyPlayer } from './board';
import { warriorCanReach } from './moves';

// Returns hexes the unit can legally attack (NOT move to — attack targets)
export function getLegalAttacks(board: BoardState, unit: Unit, gameState: GameState): HexCoord[] {
  if (!unit.alive || unit.stunned) return [];

  switch (unit.type) {
    case UnitType.SHIELD:  return getShieldAttacks(board, unit);
    case UnitType.RAM:     return getRamChargeTargets(board, unit);
    case UnitType.WARRIOR: return getWarriorAttacks(board, unit, gameState);
    case UnitType.HOOK:    return []; // Hook uses grapple, not attack
  }
}

// Shield attacks adjacent Warriors and Hooks
function getShieldAttacks(board: BoardState, unit: Unit): HexCoord[] {
  const enemy = getEnemyPlayer(unit.owner);
  return getNeighbors(unit.hex).filter(h => {
    const target = getUnitAt(board, h);
    return target !== null && target.owner === enemy &&
      (target.type === UnitType.WARRIOR || target.type === UnitType.HOOK);
  });
}

// Ram charges: straight line 1-2 hexes to a Shield or Hook, no unit in between
function getRamChargeTargets(board: BoardState, unit: Unit): HexCoord[] {
  const enemy = getEnemyPlayer(unit.owner);
  const targets: HexCoord[] = [];

  for (const dir of getDirections()) {
    for (let dist = 1; dist <= 2; dist++) {
      const hex = { q: unit.hex.q + dir.q * dist, r: unit.hex.r + dir.r * dist, s: unit.hex.s + dir.s * dist };
      if (!isOnBoard(hex)) break;

      if (isSpecialHex(board, hex)) break; // cannot pass through Tower/Throne

      const occupant = getUnitAt(board, hex);
      if (occupant !== null) {
        if (occupant.owner === enemy && (occupant.type === UnitType.SHIELD || occupant.type === UnitType.HOOK)) {
          targets.push(hex); // valid target — charge stops here
          break;
        }
        // Non-target unit (friendly, enemy Warrior/Ram): jump over it
      }
    }
  }
  return targets;
}

// Warrior attacks: Rams at 1-2 hex range (adjacent OR L-shape, clear path), or enemy Throne.
// Warriors can NO LONGER capture the Hook — only Shields and Rams can.
function getWarriorAttacks(board: BoardState, unit: Unit, _gameState: GameState): HexCoord[] {
  const enemy = getEnemyPlayer(unit.owner);
  const targets: HexCoord[] = [];

  // Find enemy Rams within reach (Hook removed — Warrior cannot capture Hook)
  const enemyTargets = board.units.filter(u =>
    u.alive && u.owner === enemy && u.type === UnitType.RAM
  );
  for (const t of enemyTargets) {
    if (warriorCanReach(board, unit, t.hex)) {
      targets.push(t.hex);
    }
  }

  // Find enemy Throne within reach (only Warrior can attack Throne)
  const enemyThrone = board.thrones.find(t => t.owner === enemy && t.alive);
  if (enemyThrone && warriorCanReach(board, unit, enemyThrone.hex)) {
    targets.push(enemyThrone.hex);
  }

  return targets;
}

// Resolve an attack — returns new board state
export interface AttackResult {
  newBoard: BoardState;
  captured: Unit | null;
  throneDestroyed: boolean;
  attackerNewHex: HexCoord; // where attacker ends up
}

export function resolveAttack(board: BoardState, attacker: Unit, targetHex: HexCoord): AttackResult {
  const target = getUnitAt(board, targetHex);
  const targetThrone = getThroneAt(board, targetHex);

  let newUnits = board.units.map(u => ({ ...u }));
  let newTowers = board.towers.map(t => ({ ...t }));
  let newThrones = board.thrones.map(t => ({ ...t }));
  let captured: Unit | null = null;
  let throneDestroyed = false;
  let attackerNewHex = targetHex; // attacker moves to target's hex by default

  if (targetThrone && !target) {
    // Warrior kills Throne — Warrior STAYS in place
    newThrones = newThrones.map(t =>
      hexEquals(t.hex, targetHex) ? { ...t, alive: false } : t
    );
    throneDestroyed = true;
    attackerNewHex = attacker.hex; // Warrior does not move
  } else if (target) {
    // Capture the target
    captured = { ...target };
    newUnits = newUnits.map(u => {
      if (u.id === target.id) return { ...u, alive: false };
      if (u.id === attacker.id) return { ...u, hex: targetHex };
      return u;
    });
    attackerNewHex = targetHex;
  }

  return {
    newBoard: { units: newUnits, towers: newTowers, thrones: newThrones },
    captured,
    throneDestroyed,
    attackerNewHex,
  };
}
