import { Player } from '@/engine/types';
import type { Throne } from '@/engine/types';
import { hexToPixel } from '@/engine/hex';

interface ThroneHexProps {
  throne: Throne;
  size: number;
  flipped?: boolean;
}

// couronne.svg — viewBox 0 0 4961 3508, transform already baked in paths
// Simplified: use the path from couronne.svg with its group transform
const CROWN_SCALE = 0.900533;
const CROWN_TX    = 228.983579;
const CROWN_SY    = 1.052265;
const CROWN_TY    = -95.376462;

export function ThroneHex({ throne, size, flipped }: ThroneHexProps) {
  const { x, y } = hexToPixel(throne.hex, size);
  const iconSize  = size * 1.25;
  const isP1      = throne.owner === Player.P1;
  const gradId    = `throne-grad-${isP1 ? 'p1' : 'p2'}`;

  const glowFilter = throne.alive
    ? (isP1 ? 'url(#glow-throne-p1)' : 'url(#glow-throne-p2)')
    : undefined;

  // Same gradient as unit pieces
  const stopTop   = isP1 ? '#fffbe8' : '#ffffff';
  const stopMidHi = isP1 ? '#e8c96a' : '#dce8f0';
  const stopMid   = isP1 ? '#c9a84c' : '#a8b4c0';
  const stopBot   = isP1 ? '#a07830' : '#6a7a88';

  // Crown viewBox is 0 0 4961 3508 — scale to iconSize fitting the larger dimension
  const vbW = 4961;
  const vbH = 3508;
  const fitScale = iconSize / Math.max(vbW, vbH);

  return (
    <g
      transform={`translate(${x}, ${y})`}
      style={{ pointerEvents: 'none', transition: 'opacity 300ms ease' }}
      opacity={throne.alive ? 1 : 0.18}
    >
      <defs>
        <linearGradient
          id={gradId}
          gradientUnits="userSpaceOnUse"
          x1={vbW / 2} y1={0}
          x2={vbW / 2} y2={vbH}
        >
          <stop offset="0%"   stopColor={stopTop} />
          <stop offset="25%"  stopColor={stopMidHi} />
          <stop offset="55%"  stopColor={stopMid} />
          <stop offset="80%"  stopColor={stopBot} />
          <stop offset="100%" stopColor={stopMid} />
        </linearGradient>
      </defs>

      <g
        transform={`${flipped ? 'rotate(180)' : ''} scale(${fitScale}) translate(${-vbW / 2}, ${-vbH / 2})`}
        filter={glowFilter}
        style={{ fillRule: 'evenodd' }}
      >
        <g transform={`matrix(${CROWN_SCALE},0,0,${CROWN_SY},${CROWN_TX},${CROWN_TY})`}>
          <path
            fill={`url(#${gradId})`}
            d="M4002.592,3296.176L997.408,3296.176L505.478,522.686L1796.783,1719.495L2500,218.744L3203.217,1719.495L4494.522,522.686L4002.592,3296.176ZM3565.06,2860.608L3742.177,1862.03L3030.655,2521.484L2500,1389.002L1969.345,2521.484L1422.854,2014.984L1257.823,1862.03L1434.94,2860.608L3565.06,2860.608Z"
          />
        </g>
      </g>
    </g>
  );
}
