// Hard AI — minimax with alpha-beta pruning + move ordering
import type { GameState, TurnAction } from '../types';
import { GamePhase, UnitType } from '../types';
import { getLegalActions, applyAction } from '../gameState';
import { evaluateBoard } from './evaluate';
import { getEnemyPlayer, getUnitAt } from '../board';
import { hexDistance } from '../hex';

const DEFAULT_DEPTH  = 4;
const TIME_LIMIT_MS  = 2500;

// Order actions from best to worst — dramatically improves alpha-beta pruning efficiency
function orderActions(actions: TurnAction[], gameState: GameState): TurnAction[] {
  const enemy = getEnemyPlayer(gameState.currentPlayer);
  const enemyThrone = gameState.board.thrones.find(t => t.owner === enemy && t.alive);

  function priority(action: TurnAction): number {
    if (action.type === 'ATTACK') {
      // Throne kill — instant win
      if (enemyThrone &&
          action.targetHex.q === enemyThrone.hex.q &&
          action.targetHex.r === enemyThrone.hex.r) {
        return 1000;
      }
      // Capture priority by unit value (Hook > Warrior > Ram > Shield)
      const target = getUnitAt(gameState.board, action.targetHex);
      if (target) {
        const values: Record<UnitType, number> = {
          [UnitType.HOOK]:    100,
          [UnitType.WARRIOR]:  60,
          [UnitType.RAM]:      40,
          [UnitType.SHIELD]:   30,
        };
        return values[target.type];
      }
      return 20;
    }
    if (action.type === 'GRAPPLE') {
      const target = gameState.board.units.find(u => u.id === action.targetUnitId);
      if (target?.type === UnitType.WARRIOR) return 15;
      return 10;
    }
    if (action.type === 'RESPAWN') {
      return 5;
    }
    if (action.type === 'MOVE') {
      // Warriors moving toward the enemy Throne get higher priority
      const unit = gameState.board.units.find(u => u.id === action.unitId);
      if (unit?.type === UnitType.WARRIOR && enemyThrone) {
        const dist = hexDistance(action.to, enemyThrone.hex);
        return Math.max(0, 6 - dist);
      }
      return 0;
    }
    return 0;
  }

  return [...actions].sort((a, b) => priority(b) - priority(a));
}

export function minimaxMove(gameState: GameState, depth: number = DEFAULT_DEPTH): TurnAction | null {
  const player  = gameState.currentPlayer;
  const actions = orderActions(getLegalActions(gameState, player), gameState);
  if (actions.length === 0) return null;

  const startTime = Date.now();
  let bestScore  = -Infinity;
  let bestAction: TurnAction = actions[0];

  for (const action of actions) {
    if (Date.now() - startTime > TIME_LIMIT_MS) break;

    const nextState = applyAction(gameState, action);
    const score = minimax(nextState, depth - 1, -Infinity, Infinity, false, player, startTime);

    if (score > bestScore) {
      bestScore  = score;
      bestAction = action;
    }
  }

  return bestAction;
}

function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  originalPlayer: typeof state.currentPlayer,
  startTime: number,
): number {
  if (depth === 0 || state.phase === GamePhase.ENDED || Date.now() - startTime > TIME_LIMIT_MS) {
    return evaluateBoard(state, originalPlayer);
  }

  const actions = orderActions(getLegalActions(state, state.currentPlayer), state);
  if (actions.length === 0) return evaluateBoard(state, originalPlayer);

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const action of actions) {
      const nextState = applyAction(state, action);
      const score = minimax(nextState, depth - 1, alpha, beta, false, originalPlayer, startTime);
      maxScore = Math.max(maxScore, score);
      alpha    = Math.max(alpha, score);
      if (beta <= alpha) break; // prune
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const action of actions) {
      const nextState = applyAction(state, action);
      const score = minimax(nextState, depth - 1, alpha, beta, true, originalPlayer, startTime);
      minScore = Math.min(minScore, score);
      beta     = Math.min(beta, score);
      if (beta <= alpha) break; // prune
    }
    return minScore;
  }
}
