import type { ReactNode } from 'react';
import type { HexCoord } from '@/engine/types';
import { TowerState, Player } from '@/engine/types';
import { hexCorners, hexToPixel } from '@/engine/hex';

interface HexCellProps {
  hex: HexCoord;
  size: number;
  isSelected: boolean;
  isLegalMove: boolean;
  isLegalAttack: boolean;
  isRespawnHex: boolean;
  isGrappleDest: boolean;
  isLastMove: boolean;
  isTowerHex: boolean;
  towerState: TowerState | null;
  towerOwner: Player | null;
  isThroneHex: boolean;
  throneOwner: Player | null;
  throneAlive: boolean;
  isTowerAdjacent: boolean;
  currentPlayer: Player;
  onClick: () => void;
}

export function HexCell({
  hex, size,
  isSelected, isLegalMove, isLegalAttack, isRespawnHex, isGrappleDest, isLastMove,
  isTowerHex, towerState, towerOwner,
  isThroneHex, throneOwner, throneAlive,
  isTowerAdjacent: _isTowerAdjacent,
  currentPlayer,
  onClick,
}: HexCellProps) {
  const { x, y } = hexToPixel(hex, size);
  const points = hexCorners(x, y, size - 1);

  // Determine fill, stroke, filter
  let fill = 'var(--hex-fill)';
  let stroke = 'var(--hex-stroke)';
  let strokeWidth = 1;
  let filterId: string | null = null;
  let secondaryPolygon: ReactNode = null;

  if (isSelected) {
    fill = currentPlayer === Player.P1 ? 'rgba(201,168,76,0.18)' : 'rgba(168,180,192,0.18)';
    stroke = currentPlayer === Player.P1 ? 'rgba(201,168,76,0.9)' : 'rgba(168,180,192,0.9)';
    strokeWidth = 2;
    filterId = currentPlayer === Player.P1 ? 'glow-selected-p1' : 'glow-selected-p2';

  } else if (isLastMove && !isLegalMove && !isLegalAttack) {
    // Last move was played by the *previous* player (opposite of currentPlayer)
    const lastMoveWasP1 = currentPlayer === Player.P2;
    fill   = lastMoveWasP1 ? 'rgba(201,168,76,0.10)'  : 'rgba(168,180,192,0.10)';
    stroke = lastMoveWasP1 ? 'rgba(201,168,76,0.35)'  : 'rgba(168,180,192,0.35)';

  } else if (isLegalAttack || isGrappleDest) {
    fill = 'var(--hex-fill-attack)';
    stroke = 'var(--hex-stroke-attack)';
    strokeWidth = 1.5;
    filterId = 'glow-attack';

  } else if (isLegalMove) {
    fill = currentPlayer === Player.P1 ? 'var(--hex-fill-legal-p1)' : 'var(--hex-fill-legal-p2)';
    stroke = currentPlayer === Player.P1 ? 'var(--hex-stroke-legal-p1)' : 'var(--hex-stroke-legal-p2)';
    filterId = currentPlayer === Player.P1 ? 'glow-legal-p1' : 'glow-legal-p2';

  } else if (isRespawnHex) {
    fill = currentPlayer === Player.P1 ? 'rgba(201,168,76,0.22)' : 'rgba(168,180,192,0.22)';
    stroke = currentPlayer === Player.P1 ? 'rgba(201,168,76,0.95)' : 'rgba(168,180,192,0.95)';
    strokeWidth = 2;
    filterId = currentPlayer === Player.P1 ? 'glow-selected-p1' : 'glow-selected-p2';
  }

  // Tower halo fill — lower priority than game highlights
  if (isTowerHex && towerState && !isSelected && !isLegalMove && !isLegalAttack && !isRespawnHex && !isLastMove) {
    switch (towerState) {
      case TowerState.ACTIVE: {
        fill = 'var(--tower-halo-active)';
        stroke = 'rgba(255,255,255,0.2)';
        strokeWidth = 1.5;
        filterId = null;
        break;
      }
      case TowerState.BLOCKED:
        fill = 'var(--tower-halo-blocked)';
        stroke = 'var(--tower-stroke-blocked)';
        strokeWidth = 1.5;
        filterId = 'glow-tower-blocked';
        break;
      case TowerState.INACTIVE:
        fill = 'var(--tower-halo-inactive)';
        stroke = 'var(--tower-stroke-inactive)';
        break;
    }
  }

  // Throne halo fill
  if (isThroneHex && !isSelected && !isLegalAttack && !isLegalMove) {
    fill = throneOwner === Player.P1 ? 'var(--throne-halo-p1)' : 'var(--throne-halo-p2)';
    const throneColor = throneOwner === Player.P1
      ? (throneAlive ? 'rgba(201,168,76,0.4)' : 'rgba(120,90,30,0.25)')
      : (throneAlive ? 'rgba(168,180,192,0.38)' : 'rgba(80,100,120,0.2)');
    stroke = throneColor;
    strokeWidth = throneAlive ? 1.5 : 1;
    filterId = throneAlive
      ? (throneOwner === Player.P1 ? 'glow-throne-p1' : 'glow-throne-p2')
      : null;
  }

  const isClickable = isSelected || isLegalMove || isLegalAttack || isRespawnHex || isGrappleDest || !isThroneHex;

  return (
    <g>
      <polygon
        points={points}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        filter={filterId ? `url(#${filterId})` : undefined}
        style={{
          cursor: isClickable ? 'pointer' : 'default',
          transition: 'fill 120ms ease, stroke 120ms ease',
        }}
        onClick={onClick}
      />
      {secondaryPolygon}
    </g>
  );
}
