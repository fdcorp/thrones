// All TypeScript types for the Thrones game engine

export interface HexCoord {
  q: number;
  r: number;
  s: number;
}

export enum UnitType {
  SHIELD   = 'SHIELD',
  RAM      = 'RAM',
  WARRIOR  = 'WARRIOR',
  HOOK     = 'HOOK',
}

export enum Player {
  P1 = 'P1',
  P2 = 'P2',
}

export interface Unit {
  id: string;
  type: UnitType;
  owner: Player;
  hex: HexCoord;
  stunned: boolean;
  alive: boolean;
}

export enum TowerState {
  ACTIVE   = 'ACTIVE',
  BLOCKED  = 'BLOCKED',
  INACTIVE = 'INACTIVE',
}

export interface Tower {
  id: string;
  owner: Player;
  hex: HexCoord;
  state: TowerState;
}

export interface Throne {
  id: string;
  owner: Player;
  hex: HexCoord;
  alive: boolean;
}

export interface BoardState {
  units: Unit[];
  towers: Tower[];
  thrones: Throne[];
}

export enum GamePhase {
  SETUP   = 'SETUP',
  PLAYING = 'PLAYING',
  ENDED   = 'ENDED',
}

export type GameMode = 'local' | 'ai' | 'online';
export type AILevel  = 'easy' | 'medium' | 'hard' | 'expert';

// Turn actions
export interface MoveAction {
  type: 'MOVE';
  unitId: string;
  from: HexCoord;
  to: HexCoord;
}

export interface AttackAction {
  type: 'ATTACK';
  unitId: string;
  from: HexCoord;
  targetHex: HexCoord;
}

export interface RespawnAction {
  type: 'RESPAWN';
  unitId: string;      // id of captured unit to respawn
  targetHex: HexCoord; // adjacent to an Active Tower
}

export interface GrappleAction {
  type: 'GRAPPLE';
  hookId: string;
  targetUnitId: string;
  destinationHex: HexCoord;
}

export type TurnAction = MoveAction | AttackAction | RespawnAction | GrappleAction;

export interface CapturedUnit {
  unit: Unit;
  capturedBy: Player;
}

export type LogKey = 'move' | 'capture' | 'throne_kill' | 'respawn' | 'grapple_stun' | 'grapple_ally';
export type DrawReason = 'repetition' | 'stagnation';

export interface LogEntry {
  turn: number;
  player: Player;
  key: LogKey;
  unitType: UnitType;
  unitOwner: Player;
  targetType?: UnitType;
  targetOwner?: Player;
  q?: number;
  r?: number;
}

export interface GameState {
  board: BoardState;
  currentPlayer: Player;
  turnNumber: number;
  phase: GamePhase;
  winner: Player | null;
  isDraw: boolean;
  drawReason: DrawReason | null;
  positionHistory: string[];
  capturedUnits: CapturedUnit[];
  log: LogEntry[];
  mode: GameMode;
  aiLevel: AILevel | null;
  aiPlayer: Player | null;  // which player the AI controls (null in local mode)
  // For 80-turn draw rule tracking
  turnsSinceLastCapture: number;
  minWarriorDistanceP1: number; // min distance P1 Warrior has ever been to P2 Throne
  minWarriorDistanceP2: number; // min distance P2 Warrior has ever been to P1 Throne
  lastAction: TurnAction | null;
}

export interface MoveResult {
  newState: GameState;
  captured?: Unit;
  stunned?: Unit;
  winner?: Player;
}
