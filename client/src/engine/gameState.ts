// Central game state machine — orchestrates all actions
import type {
  GameState, TurnAction, BoardState, Unit, HexCoord,
  MoveAction, AttackAction, RespawnAction, GrappleAction,
  LogEntry, GameMode, AILevel,
} from './types';
import { GamePhase, Player, UnitType } from './types';
import { createInitialBoard, getUnitAt, getPlayerUnits, getEnemyPlayer } from './board';
import { getLegalMoves } from './moves';
import { getLegalAttacks, resolveAttack } from './combat';
import { updateTowerStates } from './tower';
import { getLegalRespawnHexes, getEligibleRespawnUnits, resolveRespawn } from './respawn';
import { getLegalGrappleTargets, getLegalGrappleDestinations, resolveGrapple } from './hook';
import { checkVictory, serializePosition, recordPosition } from './victory';
import { hexDistance, hexEquals } from './hex';

export function initGame(mode: GameMode, aiLevel?: AILevel, humanPlayer?: Player): GameState {
  const board = createInitialBoard();
  const boardWithTowers = { ...board, towers: updateTowerStates(board) };

  const initial: GameState = {
    board: boardWithTowers,
    currentPlayer: Player.P1,
    turnNumber: 1,
    phase: GamePhase.PLAYING,
    winner: null,
    isDraw: false,
    drawReason: null,
    positionHistory: [],
    capturedUnits: [],
    log: [],
    mode,
    aiLevel: aiLevel ?? null,
    aiPlayer: mode === 'ai' ? (humanPlayer === Player.P2 ? Player.P1 : Player.P2) : null,
    turnsSinceLastCapture: 0,
    minWarriorDistanceP1: 999,
    minWarriorDistanceP2: 999,
    lastAction: null,
  };

  return recordPosition(initial);
}

// Pure function: applies an action and returns a new GameState
export function applyAction(gameState: GameState, action: TurnAction): GameState {
  if (gameState.phase !== GamePhase.PLAYING) return gameState;

  let newState: GameState;

  switch (action.type) {
    case 'MOVE':    newState = applyMove(gameState, action);    break;
    case 'ATTACK':  newState = applyAttack(gameState, action);  break;
    case 'RESPAWN': newState = applyRespawn(gameState, action); break;
    case 'GRAPPLE': newState = applyGrapple(gameState, action); break;
    default: return gameState;
  }

  return newState;
}

function applyMove(gameState: GameState, action: MoveAction): GameState {
  const unit = gameState.board.units.find(u => u.id === action.unitId);
  if (!unit || !unit.alive) return gameState;

  const legalMoves = getLegalMoves(gameState.board, unit, gameState);
  const isLegal = legalMoves.some(h => hexEquals(h, action.to));
  if (!isLegal) return gameState;

  const newUnits = gameState.board.units.map(u =>
    u.id === action.unitId ? { ...u, hex: action.to } : u
  );
  const newBoard = finalizeBoardState({ ...gameState.board, units: newUnits });
  const progress = updateWarriorProgress(gameState, newBoard, false);

  const logEntry: LogEntry = {
    turn: gameState.turnNumber,
    player: gameState.currentPlayer,
    key: 'move',
    unitType: unit.type,
    unitOwner: unit.owner,
    q: action.to.q,
    r: action.to.r,
  };

  return advanceTurn({
    ...gameState,
    board: newBoard,
    log: [...gameState.log, logEntry],
    lastAction: action,
    ...progress,
  }, false);
}

function applyAttack(gameState: GameState, action: AttackAction): GameState {
  const unit = gameState.board.units.find(u => u.id === action.unitId);
  if (!unit || !unit.alive) return gameState;

  const legalAttacks = getLegalAttacks(gameState.board, unit, gameState);
  const isLegal = legalAttacks.some(h => hexEquals(h, action.targetHex));
  if (!isLegal) return gameState;

  const result = resolveAttack(gameState.board, unit, action.targetHex);
  const newBoard = finalizeBoardState(result.newBoard);

  let newCaptured = [...gameState.capturedUnits];
  let captured = false;
  if (result.captured) {
    newCaptured = [...newCaptured, { unit: result.captured, capturedBy: gameState.currentPlayer }];
    captured = true;
  }

  const logEntry: LogEntry = result.throneDestroyed
    ? {
        turn: gameState.turnNumber,
        player: gameState.currentPlayer,
        key: 'throne_kill',
        unitType: unit.type,
        unitOwner: unit.owner,
      }
    : {
        turn: gameState.turnNumber,
        player: gameState.currentPlayer,
        key: 'capture',
        unitType: unit.type,
        unitOwner: unit.owner,
        targetType: result.captured?.type,
        targetOwner: result.captured?.owner,
      };

  const progress = updateWarriorProgress(gameState, newBoard, captured);
  let newState: GameState = {
    ...gameState,
    board: newBoard,
    capturedUnits: newCaptured,
    log: [...gameState.log, logEntry],
    lastAction: action,
    ...progress,
  };

  // Check victory
  const victoryResult = checkVictory({ ...newState, board: newBoard });
  if (victoryResult.winner || victoryResult.draw) {
    return {
      ...newState,
      phase: GamePhase.ENDED,
      winner: victoryResult.winner,
      isDraw: victoryResult.draw,
      drawReason: victoryResult.reason,
    };
  }

  return advanceTurn(newState, captured);
}

function applyRespawn(gameState: GameState, action: RespawnAction): GameState {
  const eligibleUnits = getEligibleRespawnUnits(gameState, gameState.currentPlayer);
  const unitToRespawn = eligibleUnits.find(u => u.id === action.unitId);
  if (!unitToRespawn) return gameState;

  const legalHexes = getLegalRespawnHexes(gameState.board, gameState.currentPlayer);
  const isLegal = legalHexes.some(h => hexEquals(h, action.targetHex));
  if (!isLegal) return gameState;

  const newBoard = finalizeBoardState(resolveRespawn(gameState.board, unitToRespawn, action.targetHex));
  const newCaptured = gameState.capturedUnits.filter(cu => cu.unit.id !== unitToRespawn.id);

  const logEntry: LogEntry = {
    turn: gameState.turnNumber,
    player: gameState.currentPlayer,
    key: 'respawn',
    unitType: unitToRespawn.type,
    unitOwner: unitToRespawn.owner,
    q: action.targetHex.q,
    r: action.targetHex.r,
  };

  return advanceTurn({
    ...gameState,
    board: newBoard,
    capturedUnits: newCaptured,
    log: [...gameState.log, logEntry],
    lastAction: action,
    turnsSinceLastCapture: gameState.turnsSinceLastCapture + 1,
  }, false);
}

function applyGrapple(gameState: GameState, action: GrappleAction): GameState {
  const hook = gameState.board.units.find(u => u.id === action.hookId);
  if (!hook || !hook.alive || hook.type !== UnitType.HOOK) return gameState;

  const legalTargets = getLegalGrappleTargets(gameState.board, hook);
  const isLegalTarget = legalTargets.some(h => {
    const u = getUnitAt(gameState.board, h);
    return u?.id === action.targetUnitId;
  });
  if (!isLegalTarget) return gameState;

  const targetUnit = gameState.board.units.find(u => u.id === action.targetUnitId);
  if (!targetUnit) return gameState;

  const legalDests = getLegalGrappleDestinations(gameState.board, hook, targetUnit.hex);
  const isLegalDest = legalDests.some(h => hexEquals(h, action.destinationHex));
  if (!isLegalDest) return gameState;

  const result = resolveGrapple(gameState.board, hook, targetUnit.hex, action.destinationHex);
  const newBoard = finalizeBoardState(result.newBoard);

  const logEntry: LogEntry = {
    turn: gameState.turnNumber,
    player: gameState.currentPlayer,
    key: result.stunnedUnit ? 'grapple_stun' : 'grapple_ally',
    unitType: hook.type,
    unitOwner: hook.owner,
    targetType: targetUnit.type,
    targetOwner: targetUnit.owner,
  };

  return advanceTurn({
    ...gameState,
    board: newBoard,
    log: [...gameState.log, logEntry],
    lastAction: action,
    turnsSinceLastCapture: gameState.turnsSinceLastCapture + 1,
  }, false);
}

// Helper: compute new min Warrior→Throne distances and decide whether to reset stagnation counter.
// Called after every action. Resets counter if a capture occurred OR a Warrior set a new proximity record.
function updateWarriorProgress(
  gameState: GameState,
  board: BoardState,
  captureOccurred: boolean,
): { turnsSinceLastCapture: number; minWarriorDistanceP1: number; minWarriorDistanceP2: number } {
  const p2Throne = board.thrones.find(t => t.owner === Player.P2 && t.alive);
  const p1Throne = board.thrones.find(t => t.owner === Player.P1 && t.alive);

  const p1Warriors = board.units.filter(u => u.alive && u.owner === Player.P1 && u.type === UnitType.WARRIOR);
  const p2Warriors = board.units.filter(u => u.alive && u.owner === Player.P2 && u.type === UnitType.WARRIOR);

  const newMinP1 = p2Throne && p1Warriors.length > 0
    ? Math.min(...p1Warriors.map(w => hexDistance(w.hex, p2Throne.hex)))
    : gameState.minWarriorDistanceP1;

  const newMinP2 = p1Throne && p2Warriors.length > 0
    ? Math.min(...p2Warriors.map(w => hexDistance(w.hex, p1Throne.hex)))
    : gameState.minWarriorDistanceP2;

  const warriorProgressed =
    newMinP1 < gameState.minWarriorDistanceP1 ||
    newMinP2 < gameState.minWarriorDistanceP2;

  const reset = captureOccurred || warriorProgressed;

  return {
    turnsSinceLastCapture: reset ? 0 : gameState.turnsSinceLastCapture + 1,
    minWarriorDistanceP1: Math.min(newMinP1, gameState.minWarriorDistanceP1),
    minWarriorDistanceP2: Math.min(newMinP2, gameState.minWarriorDistanceP2),
  };
}

// After any action: update tower states, remove stuns that expired, advance turn
function advanceTurn(state: GameState, _captured: boolean): GameState {
  const nextPlayer = getEnemyPlayer(state.currentPlayer);

  // Remove stun from units whose owner just FINISHED their stunned turn.
  // Stun lasts exactly 1 turn: applied during opponent's action → skip own turn → cleared.
  // At this point state.currentPlayer has just played (or was skipped), so clear their stun now.
  const newUnits = state.board.units.map(u => {
    if (u.stunned && u.owner === state.currentPlayer) {
      return { ...u, stunned: false };
    }
    return u;
  });

  const newBoard = finalizeBoardState({ ...state.board, units: newUnits });

  const newState: GameState = {
    ...state,
    board: newBoard,
    currentPlayer: nextPlayer,
    turnNumber: state.turnNumber + 1,
    turnsSinceLastCapture: state.turnsSinceLastCapture,
  };

  // Check victory/draw after turn advance
  const victoryResult = checkVictory(newState);
  if (victoryResult.winner || victoryResult.draw) {
    return {
      ...newState,
      phase: GamePhase.ENDED,
      winner: victoryResult.winner,
      isDraw: victoryResult.draw,
      drawReason: victoryResult.reason,
    };
  }

  return recordPosition(newState);
}

function finalizeBoardState(board: BoardState): BoardState {
  return { ...board, towers: updateTowerStates(board) };
}

// Returns all legal actions for the current player (used by AI)
export function getLegalActions(gameState: GameState, player: Player): TurnAction[] {
  if (gameState.phase !== GamePhase.PLAYING) return [];

  const actions: TurnAction[] = [];
  const myUnits = getPlayerUnits(gameState.board, player);

  for (const unit of myUnits) {
    if (unit.stunned) continue;

    if (unit.type === UnitType.HOOK) {
      // Can move OR grapple (not both)
      // Move options
      const moves = getLegalMoves(gameState.board, unit, gameState);
      for (const to of moves) {
        actions.push({ type: 'MOVE', unitId: unit.id, from: unit.hex, to });
      }
      // Grapple options
      const targets = getLegalGrappleTargets(gameState.board, unit);
      for (const targetHex of targets) {
        const targetUnit = getUnitAt(gameState.board, targetHex);
        if (!targetUnit) continue;
        const dests = getLegalGrappleDestinations(gameState.board, unit, targetHex);
        for (const dest of dests) {
          actions.push({ type: 'GRAPPLE', hookId: unit.id, targetUnitId: targetUnit.id, destinationHex: dest });
        }
      }
    } else {
      // Move options
      const moves = getLegalMoves(gameState.board, unit, gameState);
      for (const to of moves) {
        actions.push({ type: 'MOVE', unitId: unit.id, from: unit.hex, to });
      }
      // Attack options
      const attacks = getLegalAttacks(gameState.board, unit, gameState);
      for (const targetHex of attacks) {
        actions.push({ type: 'ATTACK', unitId: unit.id, from: unit.hex, targetHex });
      }
    }
  }

  // Respawn options
  const eligibleRespawns = getEligibleRespawnUnits(gameState, player);
  const respawnHexes = getLegalRespawnHexes(gameState.board, player);
  if (eligibleRespawns.length > 0 && respawnHexes.length > 0) {
    for (const unit of eligibleRespawns) {
      for (const hex of respawnHexes) {
        actions.push({ type: 'RESPAWN', unitId: unit.id, targetHex: hex });
      }
    }
  }

  return actions;
}
