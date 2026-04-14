// Hard AI — iterative deepening + alpha-beta + transposition table + quiescence search
import type { GameState, TurnAction } from '../types';
import { GamePhase, UnitType, Player } from '../types';
import { getLegalActions, applyAction } from '../gameState';
import { evaluateBoard } from './evaluate';
import { getEnemyPlayer, getUnitAt } from '../board';
import { hexDistance } from '../hex';
import { serializePosition } from '../victory';

const TIME_LIMIT_MS    = 1500; // hard mode budget
const MAX_DEPTH        = 14;   // iterative deepening ceiling
const QUIESCENCE_DEPTH = 4;    // extends search on captures/grapples beyond horizon
const MAX_TT_SIZE      = 600_000;

// ── Transposition table ─────────────────────────────────────────────────────
interface TTEntry {
  score: number;
  depth: number;
  flag: 'exact' | 'lower' | 'upper';
  bestAction?: TurnAction;
}

function getTTKey(state: GameState): string {
  const pos      = serializePosition(state);
  const captured = state.capturedUnits.map(cu => cu.unit.id).sort().join(',');
  return captured ? `${pos}||${captured}` : pos;
}

// ── Move ordering ───────────────────────────────────────────────────────────
function getPriority(action: TurnAction, state: GameState): number {
  const enemy      = getEnemyPlayer(state.currentPlayer);
  const enemyThrone = state.board.thrones.find(t => t.owner === enemy && t.alive);
  const myThrone    = state.board.thrones.find(t => t.owner === state.currentPlayer && t.alive);

  if (action.type === 'ATTACK') {
    if (enemyThrone &&
        action.targetHex.q === enemyThrone.hex.q &&
        action.targetHex.r === enemyThrone.hex.r) {
      return 2000; // instant win
    }
    const target = getUnitAt(state.board, action.targetHex);
    if (target) {
      // MVV-LVA: most valuable victim first
      const v: Record<UnitType, number> = {
        [UnitType.HOOK]:    800,
        [UnitType.WARRIOR]: 600,
        [UnitType.RAM]:     400,
        [UnitType.SHIELD]:  300,
      };
      return v[target.type];
    }
    return 100;
  }

  if (action.type === 'GRAPPLE') {
    const target = state.board.units.find(u => u.id === action.targetUnitId);
    if (target?.type === UnitType.WARRIOR) {
      // Emergency: grapple a Warrior threatening our Throne
      if (myThrone && !target.stunned && hexDistance(target.hex, myThrone.hex) <= 2) {
        return 500;
      }
      return 200;
    }
    if (target?.type === UnitType.HOOK)    return 150;
    if (target?.type === UnitType.RAM)     return 100;
    return 80;
  }

  if (action.type === 'RESPAWN') {
    const unit = state.capturedUnits.find(cu => cu.unit.id === action.unitId)?.unit;
    if (unit?.type === UnitType.WARRIOR) return 120;
    if (unit?.type === UnitType.HOOK)    return 100;
    if (unit?.type === UnitType.RAM)     return 80;
    return 60;
  }

  if (action.type === 'MOVE') {
    const unit = state.board.units.find(u => u.id === action.unitId);
    if (unit?.type === UnitType.WARRIOR && enemyThrone) {
      const gain = hexDistance(unit.hex, enemyThrone.hex) - hexDistance(action.to, enemyThrone.hex);
      if (gain > 0) return 40 + gain * 15;
    }
    return 0;
  }

  return 0;
}

function actionsEqual(a: TurnAction, b: TurnAction): boolean {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case 'MOVE':
      return b.type === 'MOVE'
        && a.unitId === b.unitId
        && a.to.q === b.to.q && a.to.r === b.to.r;
    case 'ATTACK':
      return b.type === 'ATTACK'
        && a.unitId === b.unitId
        && a.targetHex.q === b.targetHex.q && a.targetHex.r === b.targetHex.r;
    case 'GRAPPLE':
      return b.type === 'GRAPPLE'
        && a.hookId === b.hookId
        && a.targetUnitId === b.targetUnitId;
    case 'RESPAWN':
      return b.type === 'RESPAWN'
        && a.unitId === b.unitId
        && a.targetHex.q === b.targetHex.q && a.targetHex.r === b.targetHex.r;
  }
}

function orderActions(
  actions: TurnAction[],
  state: GameState,
  ttBest?: TurnAction,
): TurnAction[] {
  const sorted = [...actions].sort((a, b) => getPriority(b, state) - getPriority(a, state));

  // TT best action goes first — it's the best from the previous depth iteration
  if (ttBest) {
    const idx = sorted.findIndex(a => actionsEqual(a, ttBest));
    if (idx > 0) {
      sorted.splice(idx, 1);
      sorted.unshift(ttBest);
    }
  }

  return sorted;
}

// ── Quiescence search ───────────────────────────────────────────────────────
// Extends the search past the horizon for noisy positions (captures + grapples)
// to avoid the horizon effect where the AI misses an obvious capture just beyond depth 0.
function quiescence(
  state: GameState,
  alpha: number,
  beta: number,
  originalPlayer: Player,
  qdepth: number,
  startTime: number,
): number {
  if (state.phase === GamePhase.ENDED) return evaluateBoard(state, originalPlayer);

  const isMax    = state.currentPlayer === originalPlayer;
  const standPat = evaluateBoard(state, originalPlayer);

  // Stand-pat: the active player can always "do nothing" (not capture).
  // If standing pat already beats the cutoff, prune.
  if (isMax) {
    if (standPat >= beta) return standPat;
    alpha = Math.max(alpha, standPat);
  } else {
    if (standPat <= alpha) return standPat;
    beta = Math.min(beta, standPat);
  }

  if (qdepth <= 0 || Date.now() - startTime > TIME_LIMIT_MS) return standPat;

  const allActions   = getLegalActions(state, state.currentPlayer);
  const noisyActions = allActions.filter(a => a.type === 'ATTACK' || a.type === 'GRAPPLE');
  if (noisyActions.length === 0) return standPat;

  const ordered = [...noisyActions].sort((a, b) => getPriority(b, state) - getPriority(a, state));
  let best = standPat;

  for (const action of ordered) {
    if (Date.now() - startTime > TIME_LIMIT_MS) break;

    const next  = applyAction(state, action);
    const score = quiescence(next, alpha, beta, originalPlayer, qdepth - 1, startTime);

    if (isMax) {
      best  = Math.max(best, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
  }

  return best;
}

// ── Alpha-beta with transposition table ────────────────────────────────────
function alphaBeta(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  originalPlayer: Player,
  startTime: number,
  tt: Map<string, TTEntry>,
): number {
  if (state.phase === GamePhase.ENDED) return evaluateBoard(state, originalPlayer);
  if (Date.now() - startTime > TIME_LIMIT_MS) return evaluateBoard(state, originalPlayer);

  // At the horizon: quiescence search instead of raw static eval
  if (depth === 0) {
    return quiescence(state, alpha, beta, originalPlayer, QUIESCENCE_DEPTH, startTime);
  }

  // Transposition table lookup
  const key     = getTTKey(state);
  const ttEntry = tt.get(key);
  let ttBest: TurnAction | undefined;

  if (ttEntry && ttEntry.depth >= depth) {
    const { score, flag } = ttEntry;
    if (flag === 'exact') return score;
    if (flag === 'lower') alpha = Math.max(alpha, score);
    if (flag === 'upper') beta  = Math.min(beta,  score);
    if (beta <= alpha) return score;
  }
  if (ttEntry) ttBest = ttEntry.bestAction;

  const allActions = getLegalActions(state, state.currentPlayer);
  if (allActions.length === 0) return evaluateBoard(state, originalPlayer);

  const actions = orderActions(allActions, state, ttBest);
  const isMax   = state.currentPlayer === originalPlayer;

  const origAlpha = alpha;
  const origBeta  = beta;
  let bestScore   = isMax ? -Infinity : Infinity;
  let bestAction: TurnAction | undefined;

  for (const action of actions) {
    if (Date.now() - startTime > TIME_LIMIT_MS) break;

    const next  = applyAction(state, action);
    const score = alphaBeta(next, depth - 1, alpha, beta, originalPlayer, startTime, tt);

    if (isMax) {
      if (score > bestScore) { bestScore = score; bestAction = action; }
      alpha = Math.max(alpha, score);
    } else {
      if (score < bestScore) { bestScore = score; bestAction = action; }
      beta = Math.min(beta, score);
    }

    if (beta <= alpha) break; // prune
  }

  // Store in transposition table
  if (bestAction && tt.size < MAX_TT_SIZE) {
    let flag: 'exact' | 'lower' | 'upper';
    if      (bestScore <= origAlpha) flag = 'upper';
    else if (bestScore >= origBeta)  flag = 'lower';
    else                             flag = 'exact';
    tt.set(key, { score: bestScore, depth, flag, bestAction });
  }

  return bestScore;
}

// ── Iterative deepening — main entry point ──────────────────────────────────
// Searches depth 1, 2, 3… until time runs out, always keeping the best result
// from the last fully completed depth. This means every millisecond of the
// budget is spent productively, and effective depth scales with position complexity.
export function minimaxMove(gameState: GameState): TurnAction | null {
  const startTime = Date.now();
  const player    = gameState.currentPlayer;
  const tt        = new Map<string, TTEntry>();

  const allActions = getLegalActions(gameState, player);
  if (allActions.length === 0) return null;
  if (allActions.length === 1) return allActions[0]; // only one legal move

  // Seed: best action from depth-1 ordering (instant)
  let bestAction: TurnAction = orderActions(allActions, gameState)[0];

  for (let depth = 1; depth <= MAX_DEPTH; depth++) {
    // Don't start a new depth if < 20% of budget remains
    if (Date.now() - startTime > TIME_LIMIT_MS * 0.8) break;

    const actions = orderActions(allActions, gameState, bestAction);
    let iterBest      = -Infinity;
    let iterBestAction: TurnAction = actions[0];
    let completed     = true;

    for (const action of actions) {
      if (Date.now() - startTime > TIME_LIMIT_MS) { completed = false; break; }

      const next  = applyAction(gameState, action);
      const score = alphaBeta(next, depth - 1, -Infinity, Infinity, player, startTime, tt);

      if (score > iterBest) {
        iterBest       = score;
        iterBestAction = action;
      }
    }

    // Only promote if we searched all actions at this depth
    if (completed) bestAction = iterBestAction;

    // Winning move found — no need to search deeper
    if (iterBest >= 1e9) break;
  }

  return bestAction;
}
