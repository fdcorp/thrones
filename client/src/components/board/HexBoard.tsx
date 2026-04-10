import { useCallback, useMemo } from 'react';
import type { HexCoord, GameState } from '@/engine/types';
import { UnitType } from '@/engine/types';
import { generateBoard, hexEquals, hexKey, getBoardBounds, getNeighbors } from '@/engine/hex';
import { HexCell } from './HexCell';
import { UnitPiece } from './UnitPiece';
import { ThroneHex } from './ThroneHex';
import { TowerHex } from './TowerHex';
import { useGameStore } from '@/store/gameStore';
import { useUIStore } from '@/store/uiStore';
import type { UIStore } from '@/store/uiStore';
import { getLegalMoves } from '@/engine/moves';
import { getLegalAttacks } from '@/engine/combat';
import { getLegalGrappleTargets, getLegalGrappleDestinations } from '@/engine/hook';
import { getLegalRespawnHexes } from '@/engine/respawn';
import { getUnitAt, getTowerAt, getThroneAt } from '@/engine/board';

const HEX_SIZE = 38;

function selectUnitInStore(
  unitId: string,
  gameState: GameState,
  ui: UIStore,
) {
  const unit = gameState.board.units.find(u => u.id === unitId);
  if (!unit) return;

  const moves = getLegalMoves(gameState.board, unit, gameState);
  if (unit.type === UnitType.HOOK) {
    const targets = getLegalGrappleTargets(gameState.board, unit);
    ui.selectUnit(unitId, moves, targets);
  } else {
    const attacks = getLegalAttacks(gameState.board, unit, gameState);
    ui.selectUnit(unitId, moves, attacks);
  }
}

/** SVG filter definitions for glassmorphism glow effects */
function BoardDefs() {
  return (
    <defs>
      {/* Selected hex — gold glow (P1) */}
      <filter id="glow-selected-p1" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feColorMatrix in="blur" type="matrix"
          values="1.5 0.8 0 0 0  0.9 0.6 0 0 0  0 0 0 0 0  0 0 0 0.8 0"
          result="colored" />
        <feMerge><feMergeNode in="colored" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>

      {/* Selected hex — silver glow (P2) */}
      <filter id="glow-selected-p2" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feColorMatrix in="blur" type="matrix"
          values="0.6 0.7 0.9 0 0  0.6 0.7 0.9 0 0  0.6 0.7 0.9 0 0  0 0 0 0.8 0"
          result="colored" />
        <feMerge><feMergeNode in="colored" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>

      {/* Legal move P1 — soft gold glow */}
      <filter id="glow-legal-p1" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feColorMatrix in="blur" type="matrix"
          values="1.4 0.7 0 0 0  0.8 0.5 0 0 0  0 0 0 0 0  0 0 0 0.5 0"
          result="colored" />
        <feMerge><feMergeNode in="colored" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>

      {/* Legal move P2 — soft silver glow */}
      <filter id="glow-legal-p2" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feColorMatrix in="blur" type="matrix"
          values="0.6 0.7 0.8 0 0  0.5 0.6 0.7 0 0  0.6 0.7 0.8 0 0  0 0 0 0.5 0"
          result="colored" />
        <feMerge><feMergeNode in="colored" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>

      {/* Attack hex — red glow */}
      <filter id="glow-attack" x="-25%" y="-25%" width="150%" height="150%">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feColorMatrix in="blur" type="matrix"
          values="1.6 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.7 0"
          result="colored" />
        <feMerge><feMergeNode in="colored" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>

      {/* Tower active — blue glow */}
      <filter id="glow-tower-active" x="-25%" y="-25%" width="150%" height="150%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feColorMatrix in="blur" type="matrix"
          values="0 0.2 0.9 0 0  0 0.3 0.7 0 0  0 0.2 1.2 0 0  0 0 0 0.6 0"
          result="colored" />
        <feMerge><feMergeNode in="colored" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>

      {/* Tower blocked — red glow */}
      <filter id="glow-tower-blocked" x="-25%" y="-25%" width="150%" height="150%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feColorMatrix in="blur" type="matrix"
          values="1.4 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0"
          result="colored" />
        <feMerge><feMergeNode in="colored" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>

      {/* Throne P1 — subtle gold glow */}
      <filter id="glow-throne-p1" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.8" result="blur" />
        <feColorMatrix in="blur" type="matrix"
          values="1.2 0.6 0 0 0  0.7 0.4 0 0 0  0 0 0 0 0  0 0 0 0.45 0"
          result="colored" />
        <feMerge><feMergeNode in="colored" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>

      {/* Throne P2 — subtle silver glow */}
      <filter id="glow-throne-p2" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.8" result="blur" />
        <feColorMatrix in="blur" type="matrix"
          values="0.5 0.6 0.7 0 0  0.4 0.5 0.6 0 0  0.5 0.6 0.7 0 0  0 0 0 0.4 0"
          result="colored" />
        <feMerge><feMergeNode in="colored" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>

      {/* Unit selected — bright glow */}
      <filter id="glow-unit-p1" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feColorMatrix in="blur" type="matrix"
          values="1.6 0.8 0 0 0  1 0.7 0 0 0  0 0 0 0 0  0 0 0 1 0"
          result="colored" />
        <feMerge><feMergeNode in="colored" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>

      <filter id="glow-unit-p2" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feColorMatrix in="blur" type="matrix"
          values="0.5 0.6 0.9 0 0  0.4 0.5 0.8 0 0  0.5 0.6 0.9 0 0  0 0 0 1 0"
          result="colored" />
        <feMerge><feMergeNode in="colored" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  );
}

export function HexBoard() {
  const gameState   = useGameStore(s => s.gameState);
  const dispatch    = useGameStore(s => s.dispatch);
  const aiThinking  = useGameStore(s => s.aiThinking);
  const ui          = useUIStore();
  const boardFlipped = useUIStore(s => s.boardFlipped);

  const allHexes = useMemo(() => generateBoard(), []);
  const bounds   = useMemo(() => getBoardBounds(HEX_SIZE), []);

  const handleHexClick = useCallback((hex: HexCoord) => {
    if (!gameState || aiThinking) return;
    const { board, currentPlayer, phase } = gameState;
    if (phase !== 'PLAYING') return;

    const {
      interactionMode, selectedUnitId,
      legalMoveHexes, legalAttackHexes, legalRespawnHexes,
      grappleTargetHex, grappleDestHexes, pendingRespawnUnitId,
    } = ui;

    // Grapple destination select (kept for safety but destination is now automatic)
    if (interactionMode === 'grapple-dest') {
      if (grappleDestHexes.some(h => hexEquals(h, hex)) && grappleTargetHex && selectedUnitId) {
        const targetUnit = getUnitAt(board, grappleTargetHex);
        if (targetUnit) {
          dispatch({ type: 'GRAPPLE', hookId: selectedUnitId, targetUnitId: targetUnit.id, destinationHex: hex });
        }
      }
      ui.clearSelection();
      return;
    }

    // Respawn hex select
    if (interactionMode === 'respawn-select') {
      if (legalRespawnHexes.some(h => hexEquals(h, hex)) && pendingRespawnUnitId) {
        dispatch({ type: 'RESPAWN', unitId: pendingRespawnUnitId, targetHex: hex });
      }
      ui.clearSelection();
      return;
    }

    // Unit selected — second click
    if (interactionMode === 'unit-selected' && selectedUnitId) {
      const selectedUnit = board.units.find(u => u.id === selectedUnitId);

      if (legalMoveHexes.some(h => hexEquals(h, hex))) {
        if (selectedUnit) {
          dispatch({ type: 'MOVE', unitId: selectedUnitId, from: selectedUnit.hex, to: hex });
          ui.clearSelection();
          return;
        }
      }

      // Check attack
      if (selectedUnit) {
        if (selectedUnit.type === UnitType.HOOK) {
          const freshTargets = getLegalGrappleTargets(board, selectedUnit);
          if (freshTargets.some(h => hexEquals(h, hex))) {
            const [dest] = getLegalGrappleDestinations(board, selectedUnit, hex);
            const targetUnit = getUnitAt(board, hex);
            if (dest && targetUnit) {
              dispatch({ type: 'GRAPPLE', hookId: selectedUnitId, targetUnitId: targetUnit.id, destinationHex: dest });
              ui.clearSelection();
            }
            return;
          }
        } else {
          const freshAttacks = getLegalAttacks(board, selectedUnit, gameState);
          if (freshAttacks.some(h => hexEquals(h, hex))) {
            dispatch({ type: 'ATTACK', unitId: selectedUnitId, from: selectedUnit.hex, targetHex: hex });
            ui.clearSelection();
            return;
          }
        }
      }

      // Click on the already-selected unit → deselect
      const clickedUnit = getUnitAt(board, hex);
      if (clickedUnit && clickedUnit.id === selectedUnitId) {
        ui.clearSelection();
        return;
      }
      // Re-select a different own unit
      if (clickedUnit && clickedUnit.owner === currentPlayer && !clickedUnit.stunned) {
        selectUnitInStore(clickedUnit.id, gameState, ui);
        return;
      }
      ui.clearSelection();
      return;
    }

    // First click — select a unit
    const unit = getUnitAt(board, hex);
    if (unit && unit.owner === currentPlayer && !unit.stunned) {
      selectUnitInStore(unit.id, gameState, ui);
    }
  }, [gameState, dispatch, ui, aiThinking]);

  if (!gameState) return null;
  const { board, currentPlayer } = gameState;

  // Hexes adjacent to any tower (for subtle highlight)
  const towerAdjacentHexes = useMemo(() =>
    board.towers.flatMap(t => getNeighbors(t.hex)),
  [board.towers]);

  // Compute last action highlight hexes
  const lastMoveHexes = useMemo((): HexCoord[] => {
    const la = gameState.lastAction;
    if (!la) return [];
    if (la.type === 'MOVE')    return [la.from, la.to];
    if (la.type === 'ATTACK')  return [la.from, la.targetHex];
    if (la.type === 'GRAPPLE') return [la.destinationHex];
    if (la.type === 'RESPAWN') return [la.targetHex];
    return [];
  }, [gameState.lastAction]);

  const flipTransform = boardFlipped ? 'rotate(180, 0, 0)' : undefined;

  return (
    <svg
      viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <BoardDefs />
      <g transform={flipTransform}>

      {/* Hex cells */}
      {allHexes.map(hex => {
        const key = hexKey(hex);
        const tower = getTowerAt(board, hex);
        const throne = getThroneAt(board, hex);

        const selectedUnit = ui.selectedUnitId
          ? board.units.find(u => u.id === ui.selectedUnitId)
          : null;
        const isSelected = selectedUnit ? hexEquals(selectedUnit.hex, hex) : false;

        return (
          <HexCell
            key={key}
            hex={hex}
            size={HEX_SIZE}
            isSelected={isSelected}
            isLegalMove={ui.legalMoveHexes.some(h => hexEquals(h, hex))}
            isLegalAttack={ui.legalAttackHexes.some(h => hexEquals(h, hex))}
            isRespawnHex={ui.legalRespawnHexes.some(h => hexEquals(h, hex))}
            isGrappleDest={ui.grappleDestHexes.some(h => hexEquals(h, hex))}
            isLastMove={lastMoveHexes.some(h => hexEquals(h, hex))}
            isTowerHex={!!tower}
            towerState={tower?.state ?? null}
            towerOwner={tower?.owner ?? null}
            isThroneHex={!!throne}
            throneOwner={throne?.owner ?? null}
            throneAlive={throne?.alive ?? false}
            isTowerAdjacent={!tower && !throne && towerAdjacentHexes.some(h => hexEquals(h, hex))}
            currentPlayer={currentPlayer}
            onClick={() => handleHexClick(hex)}
          />
        );
      })}

      {/* Tower icons — faint watermark on tower hexes, hidden when a unit occupies the hex */}
      {board.towers.map(tower => {
        const occupied = board.units.some(u => u.alive && u.hex.q === tower.hex.q && u.hex.r === tower.hex.r);
        if (occupied) return null;
        return <TowerHex key={tower.id} tower={tower} size={HEX_SIZE} flipped={boardFlipped} />;
      })}

      {/* Thrones */}
      {board.thrones.map(throne => (
        <ThroneHex key={throne.id} throne={throne} size={HEX_SIZE} flipped={boardFlipped} />
      ))}

      {/* Units */}
      {board.units.filter(u => u.alive).map(unit => (
        <UnitPiece
          key={unit.id}
          unit={unit}
          size={HEX_SIZE}
          isSelected={ui.selectedUnitId === unit.id}
          flipped={boardFlipped}
        />
      ))}

      </g>
    </svg>
  );
}
