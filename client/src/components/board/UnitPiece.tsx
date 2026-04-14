import type { ReactNode } from 'react';
import { Player, UnitType } from '@/engine/types';
import type { Unit } from '@/engine/types';
import { hexToPixel } from '@/engine/hex';

// ── Inline SVG paths — viewBox 0 0 240 240 ──────────────────────────────────
const UNIT_PATHS: Record<UnitType, ReactNode> = {
  [UnitType.SHIELD]: (
    <>
      <path d="M112.636,229.158c0,0 -31.131,-17.534 -56.027,-45.471c-17.852,-20.033 -32.154,-45.289 -32.154,-72.973l0,-104.025l191.091,0l0,104.025c0,27.684 -14.302,52.94 -32.154,72.973c-24.896,27.938 -56.028,45.472 -56.027,45.471l-7.365,4.153l-7.364,-4.153Zm7.364,-30.691c9.506,-6.223 26.48,-18.433 41.003,-34.731c13.081,-14.679 24.555,-32.737 24.555,-53.022l0,-74.037l-131.116,0l0,74.037c0,20.286 11.473,38.343 24.555,53.022c14.523,16.298 31.498,28.508 41.004,34.731Z" />
      <path d="M120,62.517l42.165,42.165l-42.165,42.165l-42.165,-42.165l42.165,-42.165Z" />
    </>
  ),
  [UnitType.RAM]: (
    <>
      <path d="M51.012,170.541l34.792,-17.4l-58.071,12.67l-13.251,-8.713l-5.098,-4.363l-4.937,-21.347l34.508,-48.14l30.142,-20.796l14.019,29.103l36.813,14.878l-24.022,21.094l43.736,31.211l-46.088,18.843l2.876,42.092l-39.58,-27.23l-5.84,-21.902Zm-4.56,-57.708l17.532,-2.96l4.856,-13.675l-14.689,2.354l-7.698,14.281Z" />
      <path d="M38.954,71.102l63.662,-45.042l-54.45,8.238l-9.211,36.804Z" />
      <path d="M193.228,153.22l-11.53,15.946l-62.628,-45.353l42.38,-35.745l-5.706,21.86l19.119,0.45l-9.137,-42.452l-36.055,29.854l-38.004,-16.367l-12.238,-25.254l51.1,-35.832l10.392,0.093l5.182,27.801l5.972,-27.701l21.64,0.194l5.127,27.508l5.909,-27.409l15.538,0.139l11.733,24.534l-20.152,14.013l24.358,-5.218l9.863,20.622l-20.771,14.444l25.107,-5.378l5.125,10.717l-17.463,24.15l-22.812,-10.204l17.051,18.172l-13.502,18.673l-22.166,-9.915l16.568,17.658Z" />
    </>
  ),
  [UnitType.WARRIOR]: (
    <>
      <path d="M79.744,28.469l8.202,80.779l-22.978,-11.797l0,20.313l42.969,26.794l-7.653,92.347l-61.925,-70.057l9.422,-120.961l31.964,-17.419Zm89.912,89.294l0,-20.313l-22.064,11.328l8.109,-79.862l31.143,16.971l14.797,120.961l-67.301,70.057l-7.653,-92.347l42.969,-26.794Z" />
      <path d="M139.219,3.095l-11.573,113.98l-19.801,0l-11.573,-113.98l42.948,0Z" />
    </>
  ),
  [UnitType.HOOK]: (
    <>
      <path d="M128.43,173.721l0,7.098l22.654,22.654l-31.085,31.085l-31.085,-31.085l22.786,-22.786l0,-6.783l-7.965,-7.965l0,-17.955l7.965,-7.965l0,-7.035l-7.965,-7.965l0,-17.955l7.965,-7.965l0,-5.821l-10.561,0l0,-42.358l38.512,-0l0,42.358l-11.221,0l0,6.005l7.781,7.781l0,17.955l-7.781,7.781l0,7.403l7.781,7.781l0,17.955l-7.781,7.781Zm-8.527,19.036l-8.337,8.337l8.425,7.324l8.337,-7.236l-8.425,-8.425Zm2.745,-82.461l-5.349,0l-0,11.491l5.349,-0l0,-11.491Zm-0,41.79l-5.349,0l-0,10.622l5.349,-0l0,-10.622Z" />
      <path d="M94.811,57.998l-54.398,-30.087l-19.152,91.271l45.915,61.904l-17.281,-56.775l17.36,-41.029l27.556,0l0,-25.283Z" />
      <path d="M145.429,57.998l54.398,-30.087l19.152,91.271l-45.915,61.904l17.281,-56.775l-17.36,-41.029l-27.556,0l0,-25.283Z" />
      <path d="M133.538,44.205l-25.319,0l12.66,-38.763l12.66,38.763Z" />
    </>
  ),
};

interface UnitPieceProps {
  unit: Unit;
  size: number;
  isSelected: boolean;
  flipped?: boolean;
  autoFlipped?: boolean;
}

export function UnitPiece({ unit, size, isSelected, flipped, autoFlipped }: UnitPieceProps) {
  const { x, y } = hexToPixel(unit.hex, size);
  const iconSize  = size * 1.1;
  const scale     = (iconSize / 240) * (isSelected ? 1.08 : 1);
  const opacity   = unit.stunned ? 0.55 : 1;

  const isP1      = unit.owner === Player.P1;
  const gradId    = `unit-grad-${unit.id}`;
  const hatchId   = `stun-hatch-${unit.id}`;
  const glowColor = isP1 ? 'rgba(201,168,76,0.9)' : 'rgba(168,180,192,0.9)';

  // Gold gradient — same as THRONES title
  // Silver gradient — mirror equivalent
  const stopTop    = isP1 ? '#fffbe8' : '#ffffff';
  const stopMidHi  = isP1 ? '#e8c96a' : '#dce8f0';
  const stopMid    = isP1 ? '#c9a84c' : '#a8b4c0';
  const stopBottom = isP1 ? '#a07830' : '#6a7a88';

  const dropShadow = isSelected
    ? `drop-shadow(0 0 8px ${glowColor}) drop-shadow(0 0 16px ${glowColor})`
    : unit.stunned
      ? 'drop-shadow(0 0 2px rgba(0,0,0,0.8))'
      : undefined;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      style={{ pointerEvents: 'none', transition: 'transform 180ms ease, opacity 150ms ease' }}
      opacity={opacity}
    >
      <defs>
        {/* Gradient applied directly to paths — no bounding box artifacts */}
        <linearGradient
          id={gradId}
          gradientUnits="userSpaceOnUse"
          x1="120" y1="0"
          x2="120" y2="240"
        >
          <stop offset="0%"   stopColor={stopTop} />
          <stop offset="25%"  stopColor={stopMidHi} />
          <stop offset="55%"  stopColor={stopMid} />
          <stop offset="80%"  stopColor={stopBottom} />
          <stop offset="100%" stopColor={stopMid} />
        </linearGradient>

        {unit.stunned && (
          <pattern
            id={hatchId}
            patternUnits="userSpaceOnUse"
            width="7" height="7"
            patternTransform="rotate(45 0 0)"
          >
            <line x1="0" y1="0" x2="0" y2="7" stroke="rgba(0,0,0,0.65)" strokeWidth="3" />
          </pattern>
        )}
      </defs>

      {/* Auto-rotate wrapper — CSS transition, rotates around icon center */}
      <g style={{
        transformBox: 'fill-box',
        transformOrigin: 'center',
        transform: autoFlipped ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 480ms cubic-bezier(0.23, 1, 0.32, 1)',
      }}>
        {/* Icon paths — centered on (0,0), scaled to iconSize; counter-rotate when board is flipped */}
        <g
          transform={`${flipped ? 'rotate(180)' : ''} scale(${scale}) translate(-120, -120)`}
          style={{
            fill: `url(#${gradId})`,
            fillRule: 'evenodd',
            stroke: (unit.type === UnitType.SHIELD || unit.type === UnitType.WARRIOR)
              ? (isP1 ? 'rgba(255,235,140,0.45)' : 'rgba(210,228,242,0.45)')
              : 'none',
            strokeWidth: 4,
            vectorEffect: 'non-scaling-stroke',
            filter: dropShadow,
            transition: 'filter 180ms ease',
          }}
        >
          {UNIT_PATHS[unit.type]}
        </g>
      </g>

      {/* Stun hatch overlay — stays at board scale */}
      {unit.stunned && (
        <rect
          x={-iconSize / 2} y={-iconSize / 2}
          width={iconSize}  height={iconSize}
          rx={iconSize / 6}
          fill={`url(#${hatchId})`}
          opacity={0.75}
        />
      )}
    </g>
  );
}
