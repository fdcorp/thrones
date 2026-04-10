// Board initialization and access helpers
import type { BoardState, Unit, Tower, Throne, HexCoord } from './types';
import { UnitType, Player, TowerState } from './types';
import { hexEquals } from './hex';

// Initial placement — flat-top orientation, cube coordinates (q+r+s=0)
// P1 (or/gold) at bottom, P2 (argent/silver) at top. Board radius = 3 (37 hexes).
//
// Horizontal rows share the same (q + 2r) value.
//
// P1 layout (bottom = high r), reading bottom to top:
//   q+2r=6 : (0, 3,-3)                               → Trône
//   q+2r=5 : (-1,3,-2)  (1,2,-3)                     → Bélier · Bélier
//   q+2r=4 : (-2,3,-1)  (0,2,-2)  (2,1,-3)           → Bouclier · Grappin · Bouclier
//   q+2r=3 : (-3,3,0)  (-1,2,-1)  (1,1,-2)  (3,0,-3) → Tour · Guerrier · Guerrier · Tour
//   q+2r=2 : (0,1,-1)                                 → Bouclier (avant-centre)
//
// P2 is the exact mirror: (q,r,s) → (-q,-r,-s)

export function createInitialBoard(): BoardState {
  const units: Unit[] = [
    // ── P1 (gold, bottom) ──────────────────────────────────────
    // q+2r=5 : Béliers
    { id: 'p1-ram-1',     type: UnitType.RAM,     owner: Player.P1, hex: { q:-1, r: 3, s:-2 }, stunned: false, alive: true },
    { id: 'p1-ram-2',     type: UnitType.RAM,     owner: Player.P1, hex: { q: 1, r: 2, s:-3 }, stunned: false, alive: true },
    // q+2r=4 : Bouclier · Grappin · Bouclier
    { id: 'p1-shield-1',  type: UnitType.SHIELD,  owner: Player.P1, hex: { q:-2, r: 3, s:-1 }, stunned: false, alive: true },
    { id: 'p1-hook',      type: UnitType.HOOK,    owner: Player.P1, hex: { q: 0, r: 2, s:-2 }, stunned: false, alive: true },
    { id: 'p1-shield-2',  type: UnitType.SHIELD,  owner: Player.P1, hex: { q: 2, r: 1, s:-3 }, stunned: false, alive: true },
    // q+2r=3 : Guerrier · Guerrier (entre les Tours)
    { id: 'p1-warrior-1', type: UnitType.WARRIOR, owner: Player.P1, hex: { q:-1, r: 2, s:-1 }, stunned: false, alive: true },
    { id: 'p1-warrior-2', type: UnitType.WARRIOR, owner: Player.P1, hex: { q: 1, r: 1, s:-2 }, stunned: false, alive: true },
    // q+2r=2 : (Bouclier avant-centre supprimé — densité réduite, centre libre dès T1)

    // ── P2 (silver, top) — mirror: (q,r,s)→(-q,-r,-s) ─────────
    // q+2r=-5 : Béliers
    { id: 'p2-ram-1',     type: UnitType.RAM,     owner: Player.P2, hex: { q: 1, r:-3, s: 2 }, stunned: false, alive: true },
    { id: 'p2-ram-2',     type: UnitType.RAM,     owner: Player.P2, hex: { q:-1, r:-2, s: 3 }, stunned: false, alive: true },
    // q+2r=-4 : Bouclier · Grappin · Bouclier
    { id: 'p2-shield-1',  type: UnitType.SHIELD,  owner: Player.P2, hex: { q: 2, r:-3, s: 1 }, stunned: false, alive: true },
    { id: 'p2-hook',      type: UnitType.HOOK,    owner: Player.P2, hex: { q: 0, r:-2, s: 2 }, stunned: false, alive: true },
    { id: 'p2-shield-2',  type: UnitType.SHIELD,  owner: Player.P2, hex: { q:-2, r:-1, s: 3 }, stunned: false, alive: true },
    // q+2r=-3 : Guerrier · Guerrier (entre les Tours)
    { id: 'p2-warrior-1', type: UnitType.WARRIOR, owner: Player.P2, hex: { q: 1, r:-2, s: 1 }, stunned: false, alive: true },
    { id: 'p2-warrior-2', type: UnitType.WARRIOR, owner: Player.P2, hex: { q:-1, r:-1, s: 2 }, stunned: false, alive: true },
    // q+2r=-2 : (Bouclier avant-centre supprimé — densité réduite, centre libre dès T1)
  ];

  const towers: Tower[] = [
    // P1 : coins bas-gauche et bas-droite (rayon 3)
    { id: 'p1-tower-1', owner: Player.P1, hex: { q:-3, r: 3, s: 0 }, state: TowerState.INACTIVE },
    { id: 'p1-tower-2', owner: Player.P1, hex: { q: 3, r: 0, s:-3 }, state: TowerState.INACTIVE },
    // P2 : coins haut-droite et haut-gauche (miroir)
    { id: 'p2-tower-1', owner: Player.P2, hex: { q: 3, r:-3, s: 0 }, state: TowerState.INACTIVE },
    { id: 'p2-tower-2', owner: Player.P2, hex: { q:-3, r: 0, s: 3 }, state: TowerState.INACTIVE },
  ];

  const thrones: Throne[] = [
    { id: 'p1-throne', owner: Player.P1, hex: { q: 0, r: 3, s:-3 }, alive: true },
    { id: 'p2-throne', owner: Player.P2, hex: { q: 0, r:-3, s: 3 }, alive: true },
  ];

  return { units, towers, thrones };
}

export function getUnitAt(board: BoardState, hex: HexCoord): Unit | null {
  return board.units.find(u => u.alive && hexEquals(u.hex, hex)) ?? null;
}

export function getTowerAt(board: BoardState, hex: HexCoord): Tower | null {
  return board.towers.find(t => hexEquals(t.hex, hex)) ?? null;
}

export function getThroneAt(board: BoardState, hex: HexCoord): Throne | null {
  return board.thrones.find(t => hexEquals(t.hex, hex)) ?? null;
}

export function isHexOccupied(board: BoardState, hex: HexCoord): boolean {
  return board.units.some(u => u.alive && hexEquals(u.hex, hex));
}

export function isSpecialHex(board: BoardState, hex: HexCoord): boolean {
  return board.thrones.some(t => hexEquals(t.hex, hex));
}

export function getPlayerUnits(board: BoardState, player: Player): Unit[] {
  return board.units.filter(u => u.owner === player && u.alive);
}

export function getEnemyPlayer(player: Player): Player {
  return player === Player.P1 ? Player.P2 : Player.P1;
}
