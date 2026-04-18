import { useState, useEffect } from 'react';
import { Player } from '@/engine/types';
import styles from './GameClock.module.css';

interface GameClockProps {
  timeMs: number;
  syncTime: number;
  isActive: boolean;
  player: Player;
}

function formatTime(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function GameClock({ timeMs, syncTime, isActive, player }: GameClockProps) {
  const [display, setDisplay] = useState(timeMs);

  useEffect(() => {
    const tick = () => {
      const remaining = isActive ? timeMs - (Date.now() - syncTime) : timeMs;
      setDisplay(Math.max(0, remaining));
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [timeMs, syncTime, isActive]);

  const isLow = display < 30_000;
  const isDead = display <= 0;

  return (
    <div className={`${styles.clock} ${isActive ? styles.active : styles.inactive} ${player === Player.P1 ? styles.gold : styles.silver} ${isLow && isActive ? styles.low : ''} ${isDead ? styles.dead : ''}`}>
      <span className={styles.time}>{formatTime(display)}</span>
    </div>
  );
}
