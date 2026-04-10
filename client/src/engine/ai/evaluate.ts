// Board evaluation function for AI
import type { GameState } from '../types';
import { Player, UnitType, GamePhase, TowerState } from '../types';
import { hexDistance, getNeighbors, getDirections, isOnBoard } from '../hex';
import { getUnitAt, getEnemyPlayer, isSpecialHex } from '../board';
import { getLegalGrappleTargets } from '../hook';
import { getZocHexes } from '../zoc';
import { warriorCanReach } from '../moves';

const UNIT_VALUES: Record<UnitType, number> = {
  [UnitType.SHIELD]:  4,  // slightly more valuable: only 2 per player now
  [UnitType.RAM]:     4,
  [UnitType.WARRIOR]: 6,
  [UnitType.HOOK]:    8,  // slightly less fragile: Warrior can no longer kill it
};

export function evaluateBoard(gameState: GameState, player: Player): number {
  // Terminal state
  if (gameState.phase === GamePhase.ENDED) {
    if (gameState.winner === player) return  Infinity;
    if (gameState.winner !== null)   return -Infinity;
    if (gameState.isDraw)            return 0;
  }

  const enemy = getEnemyPlayer(player);
  const board  = gameState.board;
  let score = 0;

  const myUnits    = board.units.filter(u => u.alive && u.owner === player);
  const enemyUnits = board.units.filter(u => u.alive && u.owner === enemy);

  // ── 1. Material advantage (living units) ─────────────────────────────
  for (const u of myUnits)    score += UNIT_VALUES[u.type];
  for (const u of enemyUnits) score -= UNIT_VALUES[u.type];

  // ── 2. Captured unit penalty ──────────────────────────────────────────
  // Hook: permanent loss (100%). Others: 50% (can be respawned).
  const myLost    = gameState.capturedUnits.filter(cu => cu.unit.owner === player);
  const enemyLost = gameState.capturedUnits.filter(cu => cu.unit.owner === enemy);
  for (const cu of myLost) {
    const penalty = cu.unit.type === UnitType.HOOK ? 1.0 : 0.5;
    score -= UNIT_VALUES[cu.unit.type] * penalty;
  }
  for (const cu of enemyLost) {
    const bonus = cu.unit.type === UnitType.HOOK ? 1.0 : 0.5;
    score += UNIT_VALUES[cu.unit.type] * bonus;
  }

  // ── 3. Warrior threat — distance + immediate kill detection ──────────
  const enemyThrone = board.thrones.find(t => t.owner === enemy && t.alive);
  const myThrone    = board.thrones.find(t => t.owner === player && t.alive);
  const myWarriors  = myUnits.filter(u => u.type === UnitType.WARRIOR);

  if (enemyThrone) {
    for (const w of myWarriors) {
      // Proximity bonus: closer Warriors are more threatening
      score += Math.max(0, 6 - hexDistance(w.hex, enemyThrone.hex));
      // Warrior can attack the Throne THIS turn (dist ≤ 2, clear path) = near-win
      if (!w.stunned && warriorCanReach(board, w, enemyThrone.hex)) {
        score += 80;
      }
    }
  }

  if (myThrone) {
    const enemyWarriors = enemyUnits.filter(u => u.type === UnitType.WARRIOR);
    for (const w of enemyWarriors) {
      // Proximity penalty: enemy Warriors close to our Throne are dangerous
      score -= Math.max(0, 6 - hexDistance(w.hex, myThrone.hex));
      // Enemy Warrior can attack our Throne THIS turn = near-loss
      if (!w.stunned && warriorCanReach(board, w, myThrone.hex)) {
        score -= 80;
      }
    }
  }

  // ── 4. Tower states (heavily weighted — respawn capability) ──────────
  for (const tower of board.towers) {
    if (tower.owner === player) {
      if (tower.state === TowerState.ACTIVE)   score += 5;  // can respawn = big advantage
      if (tower.state === TowerState.BLOCKED)  score -= 4;  // cannot respawn = danger
    } else {
      if (tower.state === TowerState.ACTIVE)   score -= 2;  // enemy can respawn
      if (tower.state === TowerState.BLOCKED)  score += 3;  // enemy cannot respawn
    }
  }

  // ── 5. ZoC dominance — enemy units locked by my Shields ──────────────
  // getZocHexes(board, enemy) returns hexes adjacent to MY Shields (constraining enemy)
  const hexesUnderMyZoc = getZocHexes(board, enemy);
  for (const eu of enemyUnits) {
    if (hexesUnderMyZoc.some(h => h.q === eu.hex.q && h.r === eu.hex.r)) {
      score += 1.5; // enemy locked = cannot attack this turn
    }
  }

  // ── 6. Attack opportunities ───────────────────────────────────────────
  // Using direct game-mechanic checks (not getLegalActions — too expensive for evaluation)

  // My Shields adjacent to enemy Warriors or Hooks (can capture this turn)
  // (Shield still kills both Warrior AND Hook)
  const myShields    = myUnits.filter(u => u.type === UnitType.SHIELD && !u.stunned);
  const enemyShields = enemyUnits.filter(u => u.type === UnitType.SHIELD && !u.stunned);

  for (const s of myShields) {
    for (const n of getNeighbors(s.hex)) {
      const t = getUnitAt(board, n);
      if (t && t.owner === enemy && (t.type === UnitType.WARRIOR || t.type === UnitType.HOOK)) {
        score += 3;
      }
    }
  }
  for (const s of enemyShields) {
    for (const n of getNeighbors(s.hex)) {
      const t = getUnitAt(board, n);
      if (t && t.owner === player && (t.type === UnitType.WARRIOR || t.type === UnitType.HOOK)) {
        score -= 3; // my valuable unit is threatened
      }
    }
  }

  // My Rams in straight-line charge range of enemy Shields or Hooks
  const myRams    = myUnits.filter(u => u.type === UnitType.RAM && !u.stunned);
  const enemyRams = enemyUnits.filter(u => u.type === UnitType.RAM && !u.stunned);

  for (const ram of myRams) {
    for (const dir of getDirections()) {
      for (let dist = 1; dist <= 3; dist++) {
        const hex = { q: ram.hex.q + dir.q * dist, r: ram.hex.r + dir.r * dist, s: ram.hex.s + dir.s * dist };
        if (!isOnBoard(hex)) break;
        const t = getUnitAt(board, hex);
        if (t !== null) {
          if (t.owner === enemy && (t.type === UnitType.SHIELD || t.type === UnitType.HOOK)) {
            score += 3;
          }
          break;
        }
        if (isSpecialHex(board, hex)) break;
      }
    }
  }
  for (const ram of enemyRams) {
    for (const dir of getDirections()) {
      for (let dist = 1; dist <= 3; dist++) {
        const hex = { q: ram.hex.q + dir.q * dist, r: ram.hex.r + dir.r * dist, s: ram.hex.s + dir.s * dist };
        if (!isOnBoard(hex)) break;
        const t = getUnitAt(board, hex);
        if (t !== null) {
          if (t.owner === player && (t.type === UnitType.SHIELD || t.type === UnitType.HOOK)) {
            score -= 3;
          }
          break;
        }
        if (isSpecialHex(board, hex)) break;
      }
    }
  }

  // My Warriors in range to capture enemy Rams (not Hook — Warrior can no longer target Hook)
  for (const w of myWarriors) {
    if (w.stunned) continue;
    for (const t of enemyRams) {
      if (warriorCanReach(board, w, t.hex)) score += 3;
    }
  }
  // Enemy Warriors threatening my Rams (Hook no longer threatened by Warriors)
  const enemyWarriors2 = enemyUnits.filter(u => u.type === UnitType.WARRIOR && !u.stunned);
  for (const w of enemyWarriors2) {
    for (const t of myRams) {
      if (warriorCanReach(board, w, t.hex)) score -= 3;
    }
  }

  // ── 7. Hook grapple threat (weighted by value of grappleable targets) ─
  const myHook = myUnits.find(u => u.type === UnitType.HOOK);
  if (myHook && !myHook.stunned) {
    const targets = getLegalGrappleTargets(board, myHook);
    for (const targetHex of targets) {
      const t = getUnitAt(board, targetHex);
      if (t) score += UNIT_VALUES[t.type] * 0.3;
    }
  }

  // ── 8. Stun effects ───────────────────────────────────────────────────
  for (const u of enemyUnits) {
    if (u.stunned) score += 2;
  }
  for (const u of myUnits) {
    if (u.stunned) score -= 2;
  }

  return score;
}
