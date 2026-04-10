// Medium AI — depth-1 heuristic scoring with strategic priorities
import type { GameState, TurnAction } from '../types';
import { UnitType } from '../types';
import { getLegalActions, applyAction } from '../gameState';
import { evaluateBoard } from './evaluate';
import { getEnemyPlayer, getUnitAt } from '../board';
import { warriorCanReach } from '../moves';
import { hexDistance } from '../hex';

export function heuristicMove(gameState: GameState): TurnAction | null {
  const player = gameState.currentPlayer;
  const enemy  = getEnemyPlayer(player);
  const actions = getLegalActions(gameState, player);
  if (actions.length === 0) return null;

  // ── Pre-compute: is our Throne under immediate threat? ───────────────
  const myThrone    = gameState.board.thrones.find(t => t.owner === player && t.alive);
  const enemyThrone = gameState.board.thrones.find(t => t.owner === enemy  && t.alive);
  const enemyWarriors = gameState.board.units.filter(
    u => u.alive && u.owner === enemy && u.type === UnitType.WARRIOR && !u.stunned
  );
  const throneUnderThreat = myThrone !== undefined && enemyWarriors.some(
    w => warriorCanReach(gameState.board, w, myThrone.hex) // warriorCanReach now includes dist=1
  );

  let bestScore = -Infinity;
  let bestAction: TurnAction = actions[0];

  for (const action of actions) {
    const nextState = applyAction(gameState, action);
    let score = evaluateBoard(nextState, player);

    // ── ATTACK priorities ─────────────────────────────────────────────
    if (action.type === 'ATTACK') {
      if (enemyThrone &&
          action.targetHex.q === enemyThrone.hex.q &&
          action.targetHex.r === enemyThrone.hex.r) {
        // Throne kill — game-winning move
        score += 1000;
      } else {
        const target = getUnitAt(gameState.board, action.targetHex);
        // Hook can only be captured by Shield or Ram (Warrior can no longer target Hook)
        if (target?.type === UnitType.HOOK)         score += 20; // permanent kill (Shield/Ram)
        else if (target?.type === UnitType.WARRIOR) score += 10; // high-value
        else score += 5; // any capture is positive
      }
    }

    // ── GRAPPLE priorities ────────────────────────────────────────────
    if (action.type === 'GRAPPLE') {
      const target = gameState.board.units.find(u => u.id === action.targetUnitId);
      if (target) {
        if (target.type === UnitType.WARRIOR && throneUnderThreat) {
          // Pulling a Warrior that threatens our Throne = emergency defense
          score += 15;
        } else if (target.type === UnitType.WARRIOR) {
          score += 8; // stunning a Warrior is always valuable
        } else {
          score += 3; // Ram or Shield grapple — minor utility
        }
      }
    }

    // ── MOVE priorities ───────────────────────────────────────────────
    if (action.type === 'MOVE') {
      const unit = gameState.board.units.find(u => u.id === action.unitId);
      if (unit) {
        // Warrior advancing toward the enemy Throne
        if (unit.type === UnitType.WARRIOR && enemyThrone) {
          const distBefore = hexDistance(unit.hex, enemyThrone.hex);
          const distAfter  = hexDistance(action.to,  enemyThrone.hex);
          if (distAfter < distBefore) score += 4 * (distBefore - distAfter);
        }

        // Moving a unit adjacent to an enemy tower (blocking their respawn)
        const enemyTowers = gameState.board.towers.filter(t => t.owner === enemy);
        for (const tower of enemyTowers) {
          if (hexDistance(action.to, tower.hex) === 1) score += 4;
        }

        // Shield activating our own tower (enabling our respawn)
        if (unit.type === UnitType.SHIELD) {
          const myTowers = gameState.board.towers.filter(t => t.owner === player);
          for (const tower of myTowers) {
            if (hexDistance(action.to, tower.hex) === 1) score += 3;
          }
        }
      }
    }

    // ── RESPAWN priorities ────────────────────────────────────────────
    if (action.type === 'RESPAWN') {
      const unit = gameState.board.units.find(u => u.id === action.unitId);
      if (unit?.type === UnitType.WARRIOR) score += 5; // bring back our most valuable attacker
      else if (unit?.type === UnitType.RAM) score += 3;
    }

    // ── Emergency defense: neutralizing an immediate Throne threat ────
    // If our Throne was under threat before this action, check if it's safe now.
    if (throneUnderThreat && myThrone) {
      const myThroneAfter = nextState.board.thrones.find(t => t.owner === player && t.alive);
      if (myThroneAfter) {
        const enemyWarriorsAfter = nextState.board.units.filter(
          u => u.alive && u.owner === enemy && u.type === UnitType.WARRIOR && !u.stunned
        );
        const stillThreatened = enemyWarriorsAfter.some(
          w => warriorCanReach(nextState.board, w, myThroneAfter.hex) // includes adjacent (dist=1) threat
        );
        if (!stillThreatened) score += 200; // threat fully neutralized
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestAction = action;
    }
  }

  return bestAction;
}
