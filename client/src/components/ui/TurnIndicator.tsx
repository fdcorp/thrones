import { Player } from '@/engine/types';
import { useLang } from '@/i18n';
import styles from './TurnIndicator.module.css';

interface TurnIndicatorProps {
  currentPlayer: Player;
  turnNumber: number;
  aiThinking: boolean;
}

export function TurnIndicator({ currentPlayer, turnNumber, aiThinking }: TurnIndicatorProps) {
  const t = useLang();
  const isP1 = currentPlayer === Player.P1;
  return (
    <div className={`${styles.container} ${isP1 ? styles.p1 : styles.p2}`}>
      <span className={`${styles.dot} ${styles.pulse}`} />
      <span className={styles.player}>
        {aiThinking ? t.turn.aiThinking : isP1 ? t.turn.player1Turn : t.turn.player2Turn}
      </span>
      <span className={styles.turn}>{t.turn.turnLabel(turnNumber)}</span>
    </div>
  );
}
