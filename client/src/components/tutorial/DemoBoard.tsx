import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Player, UnitType } from '@/engine/types';
import type { GameState, TurnAction } from '@/engine/types';
import { initGame, applyAction } from '@/engine/gameState';
import { generateBoard, hexToPixel, hexCorners, hexKey, hexEquals, getBoardBounds } from '@/engine/hex';

const HEX_SIZE = 26;

// ── Inline SVG paths (240×240 viewBox) ─────────────────────────────────────
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

const CROWN_PATH = "M4002.592,3296.176L997.408,3296.176L505.478,522.686L1796.783,1719.495L2500,218.744L3203.217,1719.495L4494.522,522.686L4002.592,3296.176ZM3565.06,2860.608L3742.177,1862.03L3030.655,2521.484L2500,1389.002L1969.345,2521.484L1422.854,2014.984L1257.823,1862.03L1434.94,2860.608L3565.06,2860.608Z";

// ── Grandmaster demo script (22 moves, fully verified legal) ────────────────
//
// Story: P2 hook grapples P1 ram (stun), P2 warrior executes it,
//        P1 warrior boldly enters P2 tower, P2 shield defends,
//        P1 hook grapples P2 ram, P1 warrior L-attacks P2 ram,
//        P2 warrior reaches P1 throne and destroys it — P2 wins.
//
// Initial positions (from board.ts):
//   P1: w1(-1,2,-1) w2(1,1,-2) r1(-1,3,-2) r2(1,2,-3) s1(-2,3,-1) s2(2,1,-3) h(0,2,-2)
//   P2: w1(1,-2,1)  w2(-1,-1,2) r1(1,-3,2) r2(-1,-2,3) s1(2,-3,1) s2(-2,-1,3) h(0,-2,2)
//
const DEMO_ACTIONS: TurnAction[] = [
  // M1  P1: warrior-2 L-move to right flank  (1,1,-2)→via(2,0,-2)→(2,-1,-1)
  { type: 'MOVE',    unitId: 'p1-warrior-2',   from: {q:1,r:1,s:-2},   to: {q:2,r:-1,s:-1} },
  // M2  P2: warrior-1 advances center-left
  { type: 'MOVE',    unitId: 'p2-warrior-1',   from: {q:1,r:-2,s:1},   to: {q:0,r:-1,s:1} },
  // M3  P1: ram-2 charges 2 steps forward
  { type: 'MOVE',    unitId: 'p1-ram-2',        from: {q:1,r:2,s:-3},   to: {q:1,r:0,s:-1} },
  // M4  P2: hook moves to grapple position (warrior-1 vacated (1,-2,1))
  { type: 'MOVE',    unitId: 'p2-hook',         from: {q:0,r:-2,s:2},   to: {q:1,r:-2,s:1} },
  // M5  P1: warrior-1 L-move to center  (-1,2,-1)→via(-1,1,0)→(0,0,0)
  { type: 'MOVE',    unitId: 'p1-warrior-1',    from: {q:-1,r:2,s:-1},  to: {q:0,r:0,s:0} },
  // M6  P2: warrior-2 L-move to left flank  (-1,-1,2)→via(-2,0,2)→(-2,1,1)
  { type: 'MOVE',    unitId: 'p2-warrior-2',    from: {q:-1,r:-1,s:2},  to: {q:-2,r:1,s:1} },
  // M7  P1: warrior-2 advances deeper right
  { type: 'MOVE',    unitId: 'p1-warrior-2',    from: {q:2,r:-1,s:-1},  to: {q:2,r:-2,s:0} },
  // M8  P2: HOOK GRAPPLES P1 ram-2 — pulls to (1,-1,0), STUNNED!
  //         Line: (1,-2,1)→(1,-1,0)[free]→(1,0,-1)=target  dist=2
  { type: 'GRAPPLE', hookId: 'p2-hook',         targetUnitId: 'p1-ram-2',  destinationHex: {q:1,r:-1,s:0} },
  // M9  P1: warrior-1 steps into vacated ram position
  { type: 'MOVE',    unitId: 'p1-warrior-1',    from: {q:0,r:0,s:0},    to: {q:1,r:0,s:-1} },
  // M10 P2: warrior-2 pushes into P1 territory
  { type: 'MOVE',    unitId: 'p2-warrior-2',    from: {q:-2,r:1,s:1},   to: {q:-1,r:1,s:0} },
  // M11 P1: warrior-2 boldly occupies P2 tower hex!
  { type: 'MOVE',    unitId: 'p1-warrior-2',    from: {q:2,r:-2,s:0},   to: {q:3,r:-3,s:0} },
  // M12 P2: shield CAPTURES P1 warrior — defending tower!
  { type: 'ATTACK',  unitId: 'p2-shield-1',     from: {q:2,r:-3,s:1},   targetHex: {q:3,r:-3,s:0} },
  // M13 P1: warrior-1 advances right flank
  { type: 'MOVE',    unitId: 'p1-warrior-1',    from: {q:1,r:0,s:-1},   to: {q:2,r:-1,s:-1} },
  // M14 P2: warrior-1 EXECUTES the stunned ram!
  { type: 'ATTACK',  unitId: 'p2-warrior-1',    from: {q:0,r:-1,s:1},   targetHex: {q:1,r:-1,s:0} },
  // M15 P1: warrior-1 repositions
  { type: 'MOVE',    unitId: 'p1-warrior-1',    from: {q:2,r:-1,s:-1},  to: {q:2,r:-2,s:0} },
  // M16 P2: warrior-2 advances toward P1 throne
  { type: 'MOVE',    unitId: 'p2-warrior-2',    from: {q:-1,r:1,s:0},   to: {q:0,r:1,s:-1} },
  // M17 P1: hook repositions to grapple lane (line to p2-ram-2 at (-1,-2,3))
  { type: 'MOVE',    unitId: 'p1-hook',         from: {q:0,r:2,s:-2},   to: {q:-1,r:2,s:-1} },
  // M18 P2: warrior-1 retreats after kill
  { type: 'MOVE',    unitId: 'p2-warrior-1',    from: {q:1,r:-1,s:0},   to: {q:0,r:-1,s:1} },
  // M19 P1: HOOK GRAPPLES P2 ram-2 — pulls across board to (-1,1,0), STUNNED!
  //         Line: (-1,2,-1)→(-1,1,0)[free]→(-1,0,1)[free]→(-1,-1,2)[free]→(-1,-2,3)=target  dist=4
  { type: 'GRAPPLE', hookId: 'p1-hook',         targetUnitId: 'p2-ram-2', destinationHex: {q:-1,r:1,s:0} },
  // M20 P2: warrior-2 reaches adjacent to P1 throne — killing blow next!
  { type: 'MOVE',    unitId: 'p2-warrior-2',    from: {q:0,r:1,s:-1},   to: {q:0,r:2,s:-2} },
  // M21 P1: warrior-1 L-attacks P2 ram-1 — via (2,-3,1) free, captures ram!
  //         (2,-2,0)→via(2,-3,1)→(1,-3,2)=p2-ram-1  warriorCanReach confirmed
  { type: 'ATTACK',  unitId: 'p1-warrior-1',    from: {q:2,r:-2,s:0},   targetHex: {q:1,r:-3,s:2} },
  // M22 P2: warrior-2 DESTROYS P1 throne — P2 WINS!  (adjacent, dist=1)
  { type: 'ATTACK',  unitId: 'p2-warrior-2',    from: {q:0,r:2,s:-2},   targetHex: {q:0,r:3,s:-3} },
];

// Pre-compute all states at module level (once, before any render)
function buildDemoStates(): GameState[] {
  const states: GameState[] = [];
  let state = initGame('local');
  states.push(state);
  for (const action of DEMO_ACTIONS) {
    try {
      const next = applyAction(state, action);
      states.push(next);
      state = next;
    } catch {
      console.warn('[DemoBoard] action failed:', action);
      break;
    }
  }
  return states;
}

const DEMO_STATES = buildDemoStates();
const INTERVAL_MS  = 1300;
const PAUSE_FRAMES = 4; // extra pause at end (game-over screen) before looping

export function DemoBoard() {
  const [frameIdx, setFrameIdx] = useState(0);

  useEffect(() => {
    const total = DEMO_STATES.length + PAUSE_FRAMES;
    const id = setInterval(() => {
      setFrameIdx(i => (i + 1) % total);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const gameState = DEMO_STATES[Math.min(frameIdx, DEMO_STATES.length - 1)];
  const { board } = gameState;

  const allHexes = useMemo(() => generateBoard(), []);
  const bounds   = useMemo(() => getBoardBounds(HEX_SIZE), []);

  return (
    <svg
      viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <defs>
        <linearGradient id="demo-grad-p1" gradientUnits="userSpaceOnUse" x1="120" y1="0" x2="120" y2="240">
          <stop offset="0%"   stopColor="#fffbe8" />
          <stop offset="25%"  stopColor="#e8c96a" />
          <stop offset="55%"  stopColor="#c9a84c" />
          <stop offset="80%"  stopColor="#a07830" />
          <stop offset="100%" stopColor="#c9a84c" />
        </linearGradient>
        <linearGradient id="demo-grad-p2" gradientUnits="userSpaceOnUse" x1="120" y1="0" x2="120" y2="240">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="25%"  stopColor="#dce8f0" />
          <stop offset="55%"  stopColor="#a8b4c0" />
          <stop offset="80%"  stopColor="#6a7a88" />
          <stop offset="100%" stopColor="#a8b4c0" />
        </linearGradient>
        <linearGradient id="demo-crown-p1" gradientUnits="userSpaceOnUse" x1="2480" y1="0" x2="2480" y2="3508">
          <stop offset="0%"   stopColor="#fffbe8" />
          <stop offset="55%"  stopColor="#c9a84c" />
          <stop offset="100%" stopColor="#c9a84c" />
        </linearGradient>
        <linearGradient id="demo-crown-p2" gradientUnits="userSpaceOnUse" x1="2480" y1="0" x2="2480" y2="3508">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="55%"  stopColor="#a8b4c0" />
          <stop offset="100%" stopColor="#a8b4c0" />
        </linearGradient>
        <filter id="demo-glow-p1" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feColorMatrix in="blur" type="matrix"
            values="1.5 0.8 0 0 0  0.9 0.6 0 0 0  0 0 0 0 0  0 0 0 0.7 0" result="c" />
          <feMerge><feMergeNode in="c" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="demo-glow-p2" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feColorMatrix in="blur" type="matrix"
            values="0.5 0.6 0.9 0 0  0.4 0.5 0.8 0 0  0.5 0.6 0.9 0 0  0 0 0 0.7 0" result="c" />
          <feMerge><feMergeNode in="c" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Hex cells */}
      {allHexes.map(hex => {
        const key = hexKey(hex);
        const { x, y } = hexToPixel(hex, HEX_SIZE);
        const points = hexCorners(x, y, HEX_SIZE - 1);
        const tower  = board.towers.find(t => hexEquals(t.hex, hex));
        const throne = board.thrones.find(t => hexEquals(t.hex, hex));

        let fill   = 'var(--hex-fill)';
        let stroke = 'var(--hex-stroke)';
        let sw     = 0.8;

        if (tower) {
          fill   = 'rgba(60,80,140,0.15)';
          stroke = 'rgba(100,130,200,0.3)';
          sw     = 1;
        }
        if (throne) {
          const isP1 = throne.owner === Player.P1;
          fill   = isP1
            ? (throne.alive ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.04)')
            : (throne.alive ? 'rgba(168,180,192,0.08)' : 'rgba(168,180,192,0.04)');
          stroke = isP1
            ? (throne.alive ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.1)')
            : (throne.alive ? 'rgba(168,180,192,0.35)' : 'rgba(168,180,192,0.1)');
          sw     = 1;
        }

        return (
          <polygon key={key} points={points} fill={fill} stroke={stroke} strokeWidth={sw}
            style={{ pointerEvents: 'none' }} />
        );
      })}

      {/* Thrones */}
      {board.thrones.map(throne => {
        const { x, y } = hexToPixel(throne.hex, HEX_SIZE);
        const isP1 = throne.owner === Player.P1;
        const iconSize = HEX_SIZE * 1.05;
        const vbW = 4961, vbH = 3508;
        const fitScale = iconSize / Math.max(vbW, vbH);
        const gradId = isP1 ? 'demo-crown-p1' : 'demo-crown-p2';
        return (
          <g key={throne.id} transform={`translate(${x},${y})`}
            opacity={throne.alive ? 1 : 0.15}
            style={{ pointerEvents: 'none', transition: 'opacity 400ms ease' }}>
            <g transform={`scale(${fitScale}) translate(${-vbW/2},${-vbH/2})`} style={{ fillRule: 'evenodd' }}>
              <g transform="matrix(0.900533,0,0,1.052265,228.983579,-95.376462)">
                <path fill={`url(#${gradId})`} d={CROWN_PATH} />
              </g>
            </g>
          </g>
        );
      })}

      {/* Units */}
      {board.units.filter(u => u.alive).map(unit => {
        const { x, y } = hexToPixel(unit.hex, HEX_SIZE);
        const isP1     = unit.owner === Player.P1;
        const iconSize = HEX_SIZE * 1.05;
        const scale    = iconSize / 240;
        const gradId   = isP1 ? 'demo-grad-p1' : 'demo-grad-p2';
        const filterId = isP1 ? 'demo-glow-p1' : 'demo-glow-p2';
        const opacity  = unit.stunned ? 0.45 : 1;

        return (
          <g key={unit.id} transform={`translate(${x},${y})`} opacity={opacity}
            style={{ pointerEvents: 'none', transition: 'transform 350ms cubic-bezier(0.4,0,0.2,1)' }}>
            <g
              transform={`scale(${scale}) translate(-120,-120)`}
              style={{
                fill: `url(#${gradId})`,
                fillRule: 'evenodd',
                stroke: (unit.type === UnitType.SHIELD || unit.type === UnitType.WARRIOR)
                  ? (isP1 ? 'rgba(255,235,140,0.45)' : 'rgba(210,228,242,0.45)')
                  : 'none',
                strokeWidth: 4,
                vectorEffect: 'non-scaling-stroke',
                filter: `url(#${filterId})`,
              }}
            >
              {UNIT_PATHS[unit.type]}
            </g>
            {/* Stun crosshatch overlay */}
            {unit.stunned && (
              <rect
                x={-iconSize/2} y={-iconSize/2} width={iconSize} height={iconSize}
                rx={iconSize/5}
                fill="none"
                stroke="rgba(220,50,50,0.7)"
                strokeWidth={1.5}
                strokeDasharray="3 2"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
