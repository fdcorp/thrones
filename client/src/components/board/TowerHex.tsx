import { Player, TowerState } from '@/engine/types';
import type { Tower } from '@/engine/types';
import { hexToPixel } from '@/engine/hex';

const TOWER_PATH = "M87.013,234.812l-48.595,0l13.59,-154.656l-27.733,-22.772l0,-52.195l29.423,0l0,25.919l24.385,0l0,-25.919l29.826,0l0,25.919l24.182,0l0,-25.919l29.826,0l0,25.919l24.385,0l0,-25.919l29.423,0l0,52.195l-27.733,22.772l13.59,154.656l-47.077,0l-17.186,-71.627l-33.119,0l-17.186,71.627Z";

interface TowerHexProps {
  tower: Tower;
  size: number;
  flipped?: boolean;
}

export function TowerHex({ tower, size, flipped }: TowerHexProps) {
  const { x, y } = hexToPixel(tower.hex, size);
  const iconScale = (size * 0.48) / 240;

  let iconColor: string;
  let iconOpacity: number;
  let filterId: string | undefined;

  switch (tower.state) {
    case TowerState.ACTIVE:
      iconColor = tower.owner === Player.P1 ? '#c9a84c' : '#a8b4c0';
      iconOpacity = 0.45;
      filterId = tower.owner === Player.P1 ? 'url(#glow-tower-active-p1)' : 'url(#glow-tower-active-p2)';
      break;
    case TowerState.BLOCKED:
      iconColor = '#e05050';
      iconOpacity = 0.35;
      filterId = 'url(#glow-tower-blocked)';
      break;
    case TowerState.INACTIVE:
    default:
      iconColor = tower.owner === Player.P1 ? '#c9a84c' : '#a8b4c0';
      iconOpacity = 0.1;
      filterId = undefined;
      break;
  }

  return (
    <g transform={`translate(${x}, ${y})`} style={{ pointerEvents: 'none' }}>
      <g
        transform={`${flipped ? 'rotate(180)' : ''} scale(${iconScale}) translate(-120, -120)`}
        fill={iconColor}
        opacity={iconOpacity}
        filter={filterId}
        style={{ fillRule: 'evenodd', transition: 'opacity 200ms ease, fill 200ms ease' }}
      >
        <path d={TOWER_PATH} />
      </g>
    </g>
  );
}
