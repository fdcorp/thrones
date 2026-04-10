// Hexagonal grid geometry — cube coordinates (q + r + s = 0)
import type { HexCoord } from './types';

// The 6 cube directions for pointy-top hexagons
const DIRECTIONS: HexCoord[] = [
  { q:  1, r: -1, s:  0 },
  { q:  1, r:  0, s: -1 },
  { q:  0, r:  1, s: -1 },
  { q: -1, r:  1, s:  0 },
  { q: -1, r:  0, s:  1 },
  { q:  0, r: -1, s:  1 },
];

export function hexEquals(a: HexCoord, b: HexCoord): boolean {
  return a.q === b.q && a.r === b.r && a.s === b.s;
}

export function hexAdd(a: HexCoord, b: HexCoord): HexCoord {
  return { q: a.q + b.q, r: a.r + b.r, s: a.s + b.s };
}

export function hexScale(h: HexCoord, factor: number): HexCoord {
  return { q: h.q * factor, r: h.r * factor, s: h.s * factor };
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.s - b.s));
}

export function getNeighbors(hex: HexCoord): HexCoord[] {
  return DIRECTIONS.map(d => hexAdd(hex, d));
}

export function hexesInRange(center: HexCoord, min: number, max: number): HexCoord[] {
  const results: HexCoord[] = [];
  for (let q = -max; q <= max; q++) {
    for (let r = Math.max(-max, -q - max); r <= Math.min(max, -q + max); r++) {
      const s = -q - r;
      const dist = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
      if (dist >= min && dist <= max) {
        results.push({ q: center.q + q, r: center.r + r, s: center.s + s });
      }
    }
  }
  return results;
}

// Returns hexes in a straight line from `from` in direction `dir` for `length` steps
export function hexesInLine(from: HexCoord, dir: HexCoord, length: number): HexCoord[] {
  const results: HexCoord[] = [];
  let current = from;
  for (let i = 0; i < length; i++) {
    current = hexAdd(current, dir);
    results.push(current);
  }
  return results;
}

// Returns all 6 straight lines from a hex (each line up to 6 steps, within board)
export function getStraightLines(from: HexCoord, maxSteps: number = 6): HexCoord[][] {
  const board = new Set(generateBoard().map(hexKey));
  return DIRECTIONS.map(dir => {
    const line: HexCoord[] = [];
    let current = from;
    for (let i = 0; i < maxSteps; i++) {
      current = hexAdd(current, dir);
      if (!board.has(hexKey(current))) break;
      line.push(current);
    }
    return line;
  });
}

export function getDirections(): HexCoord[] {
  return DIRECTIONS;
}

// Conversion: cube → pixel (flat-top layout)
export function hexToPixel(hex: HexCoord, size: number): { x: number; y: number } {
  const x = size * (3 / 2 * hex.q);
  const y = size * (Math.sqrt(3) / 2 * hex.q + Math.sqrt(3) * hex.r);
  return { x, y };
}

// Conversion: pixel → cube (flat-top)
export function pixelToHex(x: number, y: number, size: number): HexCoord {
  const q = (2 / 3 * x) / size;
  const r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / size;
  return hexRound({ q, r, s: -q - r });
}

function hexRound(h: { q: number; r: number; s: number }): HexCoord {
  let rq = Math.round(h.q);
  let rr = Math.round(h.r);
  let rs = Math.round(h.s);
  const dq = Math.abs(rq - h.q);
  const dr = Math.abs(rr - h.r);
  const ds = Math.abs(rs - h.s);
  if (dq > dr && dq > ds) {
    rq = -rr - rs;
  } else if (dr > ds) {
    rr = -rq - rs;
  } else {
    rs = -rq - rr;
  }
  return { q: rq, r: rr, s: rs };
}

// Generate the 37 hexes of the board (radius 3 from center)
export function generateBoard(): HexCoord[] {
  const result: HexCoord[] = [];
  const RADIUS = 3;
  for (let q = -RADIUS; q <= RADIUS; q++) {
    for (let r = Math.max(-RADIUS, -q - RADIUS); r <= Math.min(RADIUS, -q + RADIUS); r++) {
      const s = -q - r;
      result.push({ q, r, s });
    }
  }
  return result;
}

/** @deprecated Use generateBoard() */
export const generateBoard61 = generateBoard;

export function hexKey(h: HexCoord): string {
  return `${h.q},${h.r},${h.s}`;
}

export function isOnBoard(hex: HexCoord): boolean {
  return Math.max(Math.abs(hex.q), Math.abs(hex.r), Math.abs(hex.s)) <= 3;
}

// Get the direction vector from `from` to `to` (only valid if they are in the same straight line)
export function getDirection(from: HexCoord, to: HexCoord): HexCoord | null {
  const dq = to.q - from.q;
  const dr = to.r - from.r;
  const ds = to.s - from.s;
  for (const dir of DIRECTIONS) {
    // Check if (dq, dr, ds) is a positive multiple of dir
    const multiples = [dq / dir.q, dr / dir.r, ds / dir.s].filter(v => !isNaN(v) && isFinite(v));
    if (multiples.length === 0) continue;
    const m = multiples[0];
    if (m > 0 && Number.isInteger(m) &&
        dq === dir.q * m && dr === dir.r * m && ds === dir.s * m) {
      return dir;
    }
  }
  return null;
}

// Get the SVG viewBox bounds for the 37-hex board at a given hex size
export function getBoardBounds(size: number): { minX: number; minY: number; width: number; height: number } {
  const hexes = generateBoard();
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const h of hexes) {
    const { x, y } = hexToPixel(h, size);
    // flat-top: hex extends ±size horizontally, ±size*√3/2 vertically
    minX = Math.min(minX, x - size);
    minY = Math.min(minY, y - size * Math.sqrt(3) / 2);
    maxX = Math.max(maxX, x + size);
    maxY = Math.max(maxY, y + size * Math.sqrt(3) / 2);
  }
  const pad = size * 0.3;
  return {
    minX: minX - pad,
    minY: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  };
}

// Get the 6 corner points of a flat-top hexagon for SVG polygon
export function hexCorners(cx: number, cy: number, size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i); // flat-top: no -30° offset
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(' ');
}
