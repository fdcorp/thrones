import { Player } from '@/engine/types';
import type { DrawReason } from '@/engine/types';
import { useNavigate } from 'react-router-dom';
import { useLang } from '@/i18n';
import styles from './EndScreen.module.css';

interface EndScreenProps {
  winner: Player | null;
  isDraw: boolean;
  drawReason: DrawReason | null;
  onReplay: () => void;
}

export function EndScreen({ winner, isDraw, drawReason, onReplay }: EndScreenProps) {
  const navigate = useNavigate();
  const t = useLang();
  const isP1 = winner === Player.P1;

  const drawReasonText = drawReason
    ? t.end.drawReasons[drawReason]
    : t.end.mutualAgreement;

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        {isDraw ? (
          <>
            <div className={styles.titleDraw}>{t.end.draw}</div>
            <div className={styles.divider} />
            <div className={styles.subtitle}>{drawReasonText}</div>
          </>
        ) : (
          <>
            <div
              className={styles.title}
              style={isP1 ? undefined : {
                background: 'linear-gradient(180deg, #ffffff 0%, var(--silver) 40%, var(--silver-light) 60%, var(--silver) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 20px rgba(168,180,192,0.4))',
              }}
            >
              {isP1 ? t.panel.player1 : t.panel.player2}
            </div>
            <div className={styles.divider} />
            <div className={styles.subtitle}>{t.end.conquered}</div>
          </>
        )}
        <div className={styles.actions}>
          <button className="btn-primary" onClick={onReplay}>
            {t.end.replay}
          </button>
          <button className="btn-ghost" onClick={() => navigate('/')}>
            {t.end.menu}
          </button>
        </div>
      </div>
    </div>
  );
}
