import { Player } from '@/engine/types';
import type { DrawReason } from '@/engine/types';
import { useNavigate } from 'react-router-dom';
import { useLang } from '@/i18n';
import styles from './EndScreen.module.css';

interface EndScreenProps {
  winner: Player | null;
  isDraw: boolean;
  drawReason: DrawReason | null;
  mySlot?: Player | null;
  winnerName?: string;
  onReplay: () => void;
  onFindMatch?: () => void;
  isRanked?: boolean;
}

export function EndScreen({ winner, isDraw, drawReason, mySlot, winnerName, onReplay, onFindMatch, isRanked }: EndScreenProps) {
  const navigate = useNavigate();
  const t = useLang();
  const isP1 = winner === Player.P1;
  const isOnline = mySlot != null;
  const iWon = isOnline && winner === mySlot;

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
        ) : isOnline ? (
          <>
            <div
              className={styles.title}
              style={iWon ? undefined : {
                background: 'linear-gradient(180deg, #ffffff 0%, var(--silver) 40%, var(--silver-light) 60%, var(--silver) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 20px rgba(168,180,192,0.4))',
              }}
            >
              {iWon ? t.end.victory : t.end.defeat}
            </div>
            <div className={styles.divider} />
            {winnerName && (
              <div className={styles.subtitle}>
                <span className={styles.winnerName}>{winnerName}</span> {t.end.conquered}
              </div>
            )}
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
            <div className={styles.subtitle}>
              {winnerName && <span className={styles.winnerName}>{winnerName} </span>}
              {t.end.conquered}
            </div>
          </>
        )}
        <div className={styles.actions}>
          {!isOnline && (
            <button className="btn-primary" onClick={onReplay}>
              {t.end.replay}
            </button>
          )}
          {onFindMatch && (
            <button className="btn-primary" onClick={onFindMatch}>
              {isRanked ? t.end.findRanked : t.end.findCasual}
            </button>
          )}
          <button className="btn-ghost" onClick={() => navigate('/')}>
            {t.end.menu}
          </button>
        </div>
      </div>
    </div>
  );
}
