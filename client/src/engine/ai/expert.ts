// Expert AI — aspiration windows + NMP + LMR + killer moves + history heuristic + enhanced eval
// Designed to be near-unbeatable: equivalent to Deep Blue level for Thrones.
import type { GameState, TurnAction } from '../types';
import { GamePhase, UnitType, Player, TowerState } from '../types';
import { getLegalActions, applyAction } from '../gameState';
import { evaluateBoard } from './evaluate';
import { getEnemyPlayer, getUnitAt, isSpecialHex } from '../board';
import { hexDistance, getNeighbors, getDirections, isOnBoard } from '../hex';
import { serializePosition } from '../victory';
import { warriorCanReach } from '../moves';

// ── Search constants ──────────────────────────────────────────────────────────
const TIME_LIMIT_MS    = 2500;  // expert budget — deeper than Hard via NMP+LMR, not just more time
const MAX_DEPTH        = 22;    // iterative deepening ceiling
const QUIESCENCE_DEPTH = 6;     // 50% deeper than Hard
const NULL_MOVE_R      = 2;     // null move reduction (R)
const LMR_MIN_DEPTH    = 3;     // minimum depth for LMR to kick in
const LMR_QUIET_START  = 3;     // start reducing after this many searched moves
const ASPIRATION_DELTA = 30;    // initial aspiration window half-width
const MAX_TT_SIZE      = 1_200_000; // 2× Hard's TT
const MAX_KILLERS_PLY  = 32;

// ── Transposition table ───────────────────────────────────────────────────────
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

// ── Move equality ──────────────────────────────────────────────────────────────
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

// ── Killer moves (2 per ply) ──────────────────────────────────────────────────
type KillerTable = Array<[TurnAction | null, TurnAction | null]>;

function createKillers(): KillerTable {
  return Array.from({ length: MAX_KILLERS_PLY }, () => [null, null]);
}

function isKillerMove(action: TurnAction, killers: KillerTable, ply: number): boolean {
  if (ply >= killers.length) return false;
  const [k1, k2] = killers[ply];
  return (k1 !== null && actionsEqual(action, k1)) ||
         (k2 !== null && actionsEqual(action, k2));
}

function storeKiller(killers: KillerTable, ply: number, action: TurnAction): void {
  if (ply >= killers.length) return;
  const [k1] = killers[ply];
  if (k1 && actionsEqual(action, k1)) return; // already stored
  killers[ply] = [action, k1]; // shift: new killer becomes first
}

// ── History heuristic ─────────────────────────────────────────────────────────
type HistoryTable = Map<string, number>;

function historyKey(action: TurnAction): string {
  switch (action.type) {
    case 'MOVE':    return `M:${action.unitId}:${action.to.q},${action.to.r}`;
    case 'ATTACK':  return `A:${action.unitId}:${action.targetHex.q},${action.targetHex.r}`;
    case 'GRAPPLE': return `G:${action.hookId}:${action.targetUnitId}`;
    case 'RESPAWN': return `R:${action.unitId}`;
  }
}

function updateHistory(history: HistoryTable, action: TurnAction, depth: number): void {
  const key = historyKey(action);
  history.set(key, (history.get(key) ?? 0) + depth * depth);
}

// ── Null move (pass turn — for NMP) ──────────────────────────────────────────
function makeNullMove(state: GameState): GameState {
  return {
    ...state,
    currentPlayer: state.currentPlayer === Player.P1 ? Player.P2 : Player.P1,
  };
}

// ── Enhanced evaluation (Expert-specific refinements) ────────────────────────
// Extends the base evaluateBoard with deeper strategic understanding.
function evaluateBoardExpert(gameState: GameState, player: Player): number {
  if (gameState.phase === GamePhase.ENDED) {
    if (gameState.winner === player) return  Infinity;
    if (gameState.winner !== null)   return -Infinity;
    if (gameState.isDraw)            return 0;
  }

  // Start from the standard evaluation
  let score = evaluateBoard(gameState, player);

  const enemy      = getEnemyPlayer(player);
  const board      = gameState.board;
  const myUnits    = board.units.filter(u => u.alive && u.owner === player);
  const enemyUnits = board.units.filter(u => u.alive && u.owner === enemy);
  const myThrone    = board.thrones.find(t => t.owner === player && t.alive);
  const enemyThrone = board.thrones.find(t => t.owner === enemy && t.alive);
  const myWarriors  = myUnits.filter(u => u.type === UnitType.WARRIOR && !u.stunned);
  const myShields   = myUnits.filter(u => u.type === UnitType.SHIELD && !u.stunned);
  const myRams      = myUnits.filter(u => u.type === UnitType.RAM && !u.stunned);
  const enemyShields = enemyUnits.filter(u => u.type === UnitType.SHIELD && !u.stunned);

  // Endgame factor: grows toward 1 as pieces leave the board
  const totalUnits    = myUnits.length + enemyUnits.length;
  const endgameFactor = Math.max(0, (16 - totalUnits) / 16);

  // ── A. Endgame amplification ─────────────────────────────────────────────
  // Warriors become exponentially more dangerous as the board empties.
  if (enemyThrone) {
    for (const w of myWarriors) {
      score += endgameFactor * Math.max(0, 8 - hexDistance(w.hex, enemyThrone.hex)) * 2;
    }
  }

  // ── B. Fork detection (Warrior threatening Throne + another piece) ───────
  // A fork forces the opponent to choose what to defend — extremely powerful.
  if (enemyThrone) {
    for (const w of myWarriors) {
      const threatsThrone = warriorCanReach(board, w, enemyThrone.hex);
      const threatsOthers = enemyUnits.filter(
        eu => eu.type !== UnitType.SHIELD && !eu.stunned && warriorCanReach(board, w, eu.hex)
      ).length;
      if (threatsThrone && threatsOthers >= 1) score += 20; // double-threat on Throne + piece
      else if (threatsOthers >= 2)             score +=  8; // threatens 2 non-Throne pieces
    }
  }

  // ── C. Shield phalanx (adjacent Shields amplify ZoC coverage) ────────────
  for (let i = 0; i < myShields.length; i++) {
    for (let j = i + 1; j < myShields.length; j++) {
      if (hexDistance(myShields[i].hex, myShields[j].hex) <= 2) {
        score += 2.0; // overlapping ZoC — enemy units doubly constrained
      }
    }
  }

  // ── D. Ram charge lane control ────────────────────────────────────────────
  // A Ram with a clear straight line to a Warrior is a potent positional threat.
  for (const ram of myRams) {
    for (const dir of getDirections()) {
      for (let dist = 1; dist <= 4; dist++) {
        const hex = {
          q: ram.hex.q + dir.q * dist,
          r: ram.hex.r + dir.r * dist,
          s: ram.hex.s + dir.s * dist,
        };
        if (!isOnBoard(hex)) break;
        const t = getUnitAt(board, hex);
        if (t !== null) {
          if (t.owner === enemy && t.type === UnitType.WARRIOR) score += 4;
          break; // line is blocked beyond this hex
        }
        if (isSpecialHex(board, hex)) break; // Tower/Throne blocks the lane
      }
    }
  }

  // ── E. Tower control: both enemy towers blocked = complete respawn shutdown ─
  const enemyTowers = board.towers.filter(t => t.owner === enemy);
  if (enemyTowers.length === 2 && enemyTowers.every(t => t.state === TowerState.BLOCKED)) {
    score += 16; // opponent has zero respawn capability — critical strategic advantage
  }
  const myTowers = board.towers.filter(t => t.owner === player);
  if (myTowers.length === 2 && myTowers.every(t => t.state === TowerState.ACTIVE)) {
    score += 8; // full respawn availability
  }

  // ── F. Warrior safety: penalize Warriors in the shadow of enemy Shields ───
  // A Warrior adjacent to an enemy Shield is one move from capture.
  // The base eval already has this but we amplify it for expert precision.
  if (enemyThrone) {
    for (const w of myWarriors) {
      const nearEnemyShields = enemyShields.filter(
        s => hexDistance(s.hex, w.hex) <= 2
      ).length;
      // Warrior in approach zone with no nearby enemy Shields = very dangerous for opponent
      if (nearEnemyShields === 0 && hexDistance(w.hex, enemyThrone.hex) <= 4) {
        score += 6; // clear approach lane
      }
    }
  }

  return score;
}

// ── Move priority (used for ordering) ────────────────────────────────────────
function getPriority(
  action: TurnAction,
  state: GameState,
  killers: KillerTable,
  history: HistoryTable,
  ply: number,
): number {
  const enemy      = getEnemyPlayer(state.currentPlayer);
  const enemyThrone = state.board.thrones.find(t => t.owner === enemy && t.alive);
  const myThrone    = state.board.thrones.find(t => t.owner === state.currentPlayer && t.alive);

  if (action.type === 'ATTACK') {
    // Throne kill = instant win — always search first
    if (enemyThrone &&
        action.targetHex.q === enemyThrone.hex.q &&
        action.targetHex.r === enemyThrone.hex.r) {
      return 100_000;
    }
    // MVV-LVA: Most Valuable Victim / Least Valuable Attacker
    const target = getUnitAt(state.board, action.targetHex);
    if (target) {
      const victimValue: Record<string, number> = {
        HOOK:    8_000,
        WARRIOR: 6_000,
        RAM:     4_000,
        SHIELD:  3_000,
      };
      return victimValue[target.type] ?? 500;
    }
    return 500;
  }

  if (action.type === 'GRAPPLE') {
    const target = state.board.units.find(u => u.id === action.targetUnitId);
    // Emergency: grapple a Warrior threatening our Throne RIGHT NOW
    if (myThrone && target?.type === UnitType.WARRIOR && !target.stunned &&
        hexDistance(target.hex, myThrone.hex) <= 2) {
      return 5_000;
    }
    if (target?.type === UnitType.WARRIOR) return 2_000;
    if (target?.type === UnitType.HOOK)    return 1_500;
    if (target?.type === UnitType.RAM)     return 1_000;
    return 800;
  }

  if (action.type === 'RESPAWN') {
    const unit = state.capturedUnits.find(cu => cu.unit.id === action.unitId)?.unit;
    if (unit?.type === UnitType.WARRIOR) return 1_200;
    if (unit?.type === UnitType.HOOK)    return 1_000;
    if (unit?.type === UnitType.RAM)     return  800;
    return 600;
  }

  if (action.type === 'MOVE') {
    // Killer heuristic: quiet move that caused a cutoff at this ply before
    if (isKillerMove(action, killers, ply)) return 700;

    // History heuristic: moves with a strong track record
    const hist = history.get(historyKey(action)) ?? 0;
    if (hist > 0) return Math.min(650, 200 + Math.floor(hist / 100));

    // Positional: Warrior advancing toward enemy Throne
    const unit = state.board.units.find(u => u.id === action.unitId);
    if (unit?.type === UnitType.WARRIOR && enemyThrone) {
      const gain = hexDistance(unit.hex, enemyThrone.hex) - hexDistance(action.to, enemyThrone.hex);
      if (gain > 0) return 40 + gain * 15;
    }
    return 0;
  }

  return 0;
}

function orderActions(
  actions: TurnAction[],
  state: GameState,
  killers: KillerTable,
  history: HistoryTable,
  ply: number,
  ttBest?: TurnAction,
): TurnAction[] {
  const sorted = [...actions].sort(
    (a, b) =>
      getPriority(b, state, killers, history, ply) -
      getPriority(a, state, killers, history, ply)
  );
  // TT best move goes first — proven best from the previous depth
  if (ttBest) {
    const idx = sorted.findIndex(a => actionsEqual(a, ttBest));
    if (idx > 0) { sorted.splice(idx, 1); sorted.unshift(ttBest); }
  }
  return sorted;
}

// ── Quiescence search ─────────────────────────────────────────────────────────
function quiescence(
  state: GameState,
  alpha: number,
  beta: number,
  originalPlayer: Player,
  qdepth: number,
  startTime: number,
  killers: KillerTable,
  history: HistoryTable,
): number {
  if (state.phase === GamePhase.ENDED) return evaluateBoardExpert(state, originalPlayer);

  const isMax    = state.currentPlayer === originalPlayer;
  const standPat = evaluateBoardExpert(state, originalPlayer);

  // Stand-pat pruning: can always decline to capture
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

  const ordered = [...noisyActions].sort(
    (a, b) =>
      getPriority(b, state, killers, history, 0) -
      getPriority(a, state, killers, history, 0)
  );
  let best = standPat;

  for (const action of ordered) {
    if (Date.now() - startTime > TIME_LIMIT_MS) break;
    const next  = applyAction(state, action);
    const score = quiescence(next, alpha, beta, originalPlayer, qdepth - 1, startTime, killers, history);

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

// ── Alpha-beta with NMP + LMR ─────────────────────────────────────────────────
function alphaBeta(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  originalPlayer: Player,
  ply: number,
  startTime: number,
  tt: Map<string, TTEntry>,
  killers: KillerTable,
  history: HistoryTable,
  nullMoveAllowed: boolean,
): number {
  if (state.phase === GamePhase.ENDED) return evaluateBoardExpert(state, originalPlayer);
  if (Date.now() - startTime > TIME_LIMIT_MS) return evaluateBoardExpert(state, originalPlayer);

  if (depth === 0) {
    return quiescence(state, alpha, beta, originalPlayer, QUIESCENCE_DEPTH, startTime, killers, history);
  }

  // ── Transposition table lookup ────────────────────────────────────────────
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

  const isMax = state.currentPlayer === originalPlayer;

  // ── Null Move Pruning (NMP) ───────────────────────────────────────────────
  // Idea: if skipping our move still leaves the opponent in a bad position,
  // the real position must be even better — safe to prune.
  // Guard: skip if depth is too shallow, if endgame (zugzwang risk), or if last was NMP.
  if (nullMoveAllowed && isMax && depth >= NULL_MOVE_R + 2) {
    const myAlive    = state.board.units.filter(u => u.alive && u.owner === state.currentPlayer).length;
    const enemyAlive = state.board.units.filter(u => u.alive && u.owner !== state.currentPlayer).length;
    if (myAlive >= 3 && enemyAlive >= 3) {
      const staticEval = evaluateBoardExpert(state, originalPlayer);
      // Only prune if we're comfortably above beta even without moving
      if (staticEval >= beta) {
        const nullState = makeNullMove(state);
        const nullScore = alphaBeta(
          nullState, depth - NULL_MOVE_R - 1,
          beta - 1, beta, // narrow window just above beta
          originalPlayer, ply + 1,
          startTime, tt, killers, history,
          false, // no chained null moves
        );
        if (nullScore >= beta) return beta; // null move cutoff
      }
    }
  }

  const allActions = getLegalActions(state, state.currentPlayer);
  if (allActions.length === 0) return evaluateBoardExpert(state, originalPlayer);

  const actions = orderActions(allActions, state, killers, history, ply, ttBest);
  const origAlpha = alpha;
  const origBeta  = beta;
  let bestScore   = isMax ? -Infinity : Infinity;
  let bestAction: TurnAction | undefined;

  for (let i = 0; i < actions.length; i++) {
    if (Date.now() - startTime > TIME_LIMIT_MS) break;
    const action     = actions[i];
    const isTactical = action.type === 'ATTACK' || action.type === 'GRAPPLE';

    // ── Late Move Reductions (LMR) ─────────────────────────────────────────
    // Quiet moves searched late are likely inferior — reduce their search depth.
    // If they turn out to be good, re-search at full depth.
    let reduction = 0;
    if (isMax && depth >= LMR_MIN_DEPTH && i >= LMR_QUIET_START && !isTactical) {
      // Progressive reduction: +1 depth for every 4 additional moves
      reduction = 1 + Math.floor((i - LMR_QUIET_START) / 4);
      reduction = Math.min(reduction, depth - 2); // never reduce to depth 0 or negative
    }

    const next = applyAction(state, action);
    let score: number;

    if (reduction > 0) {
      // Reduced-depth search first
      score = alphaBeta(next, depth - 1 - reduction, alpha, beta,
        originalPlayer, ply + 1, startTime, tt, killers, history, true);
      // If this move looks promising (beats alpha), re-search at full depth
      if (score > alpha && score < beta) {
        score = alphaBeta(next, depth - 1, alpha, beta,
          originalPlayer, ply + 1, startTime, tt, killers, history, true);
      }
    } else {
      score = alphaBeta(next, depth - 1, alpha, beta,
        originalPlayer, ply + 1, startTime, tt, killers, history, true);
    }

    if (isMax) {
      if (score > bestScore) { bestScore = score; bestAction = action; }
      alpha = Math.max(alpha, score);
    } else {
      if (score < bestScore) { bestScore = score; bestAction = action; }
      beta = Math.min(beta, score);
    }

    if (beta <= alpha) {
      // Beta cutoff: store killer + update history for quiet moves
      if (!isTactical) {
        storeKiller(killers, ply, action);
        updateHistory(history, action, depth);
      }
      break;
    }
  }

  // ── Transposition table store ─────────────────────────────────────────────
  if (bestAction && tt.size < MAX_TT_SIZE) {
    let flag: 'exact' | 'lower' | 'upper';
    if      (bestScore <= origAlpha) flag = 'upper';
    else if (bestScore >= origBeta)  flag = 'lower';
    else                             flag = 'exact';
    tt.set(key, { score: bestScore, depth, flag, bestAction });
  }

  return bestScore;
}

// ── Root search (iterative deepening + aspiration windows) ────────────────────
export function expertMove(gameState: GameState): TurnAction | null {
  const startTime = Date.now();
  const player    = gameState.currentPlayer;
  const tt        = new Map<string, TTEntry>();
  const killers   = createKillers();
  const history   = new Map<string, number>() as HistoryTable;

  const allActions = getLegalActions(gameState, player);
  if (allActions.length === 0) return null;
  if (allActions.length === 1) return allActions[0]; // forced move

  // Seed: pick the move that looks best from pure ordering (instant)
  let bestAction: TurnAction = orderActions(allActions, gameState, killers, history, 0)[0];
  let previousScore = evaluateBoardExpert(gameState, player);

  for (let depth = 1; depth <= MAX_DEPTH; depth++) {
    // Stop starting new iterations if we've used 80% of the budget
    if (Date.now() - startTime > TIME_LIMIT_MS * 0.8) break;

    // ── Aspiration windows ──────────────────────────────────────────────────
    // Start with a narrow window around the previous score;
    // widen exponentially if the search fails outside the window.
    let alpha = depth >= 4 ? previousScore - ASPIRATION_DELTA : -Infinity;
    let beta  = depth >= 4 ? previousScore + ASPIRATION_DELTA :  Infinity;

    let depthBest       = -Infinity;
    let depthBestAction = orderActions(allActions, gameState, killers, history, 0, bestAction)[0];
    let depthCompleted  = false;

    // Retry loop for aspiration failures
    for (let aspireTry = 0; aspireTry < 4; aspireTry++) {
      let iterBest       = -Infinity;
      let iterBestAction = depthBestAction;
      let completed      = true;

      const ordered = orderActions(allActions, gameState, killers, history, 0, bestAction);
      for (const action of ordered) {
        if (Date.now() - startTime > TIME_LIMIT_MS) { completed = false; break; }

        const next  = applyAction(gameState, action);
        const score = alphaBeta(
          next, depth - 1, alpha, beta, player, 1,
          startTime, tt, killers, history, true,
        );

        if (score > iterBest) {
          iterBest       = score;
          iterBestAction = action;
        }
      }

      if (!completed) break;

      if (iterBest <= alpha) {
        // Fail low: widen lower bound
        alpha = alpha === -Infinity ? -Infinity : Math.max(-Infinity, alpha - ASPIRATION_DELTA * (1 << aspireTry));
        continue;
      }
      if (iterBest >= beta) {
        // Fail high: widen upper bound
        beta = beta === Infinity ? Infinity : Math.min(Infinity, beta + ASPIRATION_DELTA * (1 << aspireTry));
        continue;
      }

      // Fit within window — accept
      depthBest       = iterBest;
      depthBestAction = iterBestAction;
      depthCompleted  = true;
      break;
    }

    if (depthCompleted) {
      bestAction    = depthBestAction;
      previousScore = depthBest;
    }

    // Winning move found — no need to search deeper
    if (depthBest >= 1e9) break;
  }

  return bestAction;
}
