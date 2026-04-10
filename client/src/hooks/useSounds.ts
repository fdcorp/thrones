import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GamePhase } from '@/engine/types';
import { playMove, playCapture, playGrapple, playRespawn, playVictory } from '@/utils/sounds';

export function useSounds() {
  const gameState = useGameStore(s => s.gameState);
  const prevTurnRef     = useRef<number>(0);
  const prevCapturedRef = useRef<number>(0);
  const victoryPlayedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!gameState) return;

    const { turnNumber, capturedUnits, lastAction, phase } = gameState;

    // Victory
    if (phase === GamePhase.ENDED && !victoryPlayedRef.current) {
      victoryPlayedRef.current = true;
      playVictory();
      return;
    }

    // Only fire on new turn
    if (turnNumber === prevTurnRef.current) return;
    prevTurnRef.current = turnNumber;

    if (!lastAction) return;

    const capturedCount = capturedUnits.length;
    const newCapture = capturedCount > prevCapturedRef.current;
    prevCapturedRef.current = capturedCount;

    if (lastAction.type === 'RESPAWN') {
      playRespawn();
    } else if (lastAction.type === 'GRAPPLE') {
      playGrapple();
    } else if (newCapture || lastAction.type === 'ATTACK') {
      playCapture();
    } else {
      playMove();
    }
  }, [gameState?.turnNumber, gameState?.phase]);

  // Reset refs when a new game starts
  useEffect(() => {
    if (!gameState) {
      prevTurnRef.current = 0;
      prevCapturedRef.current = 0;
      victoryPlayedRef.current = false;
    }
  }, [gameState]);
}
