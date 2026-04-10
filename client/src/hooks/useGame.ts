// Main game hook — exposes all game actions to UI
import { useGameStore } from '@/store/gameStore';
import { useUIStore } from '@/store/uiStore';
import type { HexCoord, Unit } from '@/engine/types';
import { UnitType, Player } from '@/engine/types';
import { getLegalMoves } from '@/engine/moves';
import { getLegalAttacks } from '@/engine/combat';
import { getLegalGrappleTargets } from '@/engine/hook';
import { getLegalRespawnHexes } from '@/engine/respawn';

export function useGame() {
  const gameState  = useGameStore(s => s.gameState);
  const dispatch   = useGameStore(s => s.dispatch);
  const aiThinking = useGameStore(s => s.aiThinking);
  const ui         = useUIStore();

  const selectUnit = (unit: Unit) => {
    if (!gameState || aiThinking) return;
    if (unit.owner !== gameState.currentPlayer) return;
    if (unit.stunned) return;

    const moves = getLegalMoves(gameState.board, unit, gameState);
    if (unit.type === UnitType.HOOK) {
      const targets = getLegalGrappleTargets(gameState.board, unit);
      ui.selectUnit(unit.id, moves, targets);
    } else {
      const attacks = getLegalAttacks(gameState.board, unit, gameState);
      ui.selectUnit(unit.id, moves, attacks);
    }
  };

  const startRespawn = (unit: Unit) => {
    if (!gameState || aiThinking) return;
    const hexes = getLegalRespawnHexes(gameState.board, gameState.currentPlayer);
    if (hexes.length === 0) return;
    ui.setRespawnMode(unit.id, hexes);
  };

  return { gameState, dispatch, aiThinking, selectUnit, startRespawn, ui };
}
