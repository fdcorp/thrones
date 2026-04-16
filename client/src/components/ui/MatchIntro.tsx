import { useEffect, useState } from 'react';
import { Player } from '@/engine/types';
import styles from './MatchIntro.module.css';

interface MatchIntroProps {
  myUsername:          string;
  myElo:               number;
  myInPlacement:       boolean;
  mySlot:              Player;
  opponentUsername:    string;
  opponentElo:         number | null;
  opponentInPlacement: boolean;
}

export function MatchIntro({ myUsername, myElo, myInPlacement, mySlot, opponentUsername, opponentElo, opponentInPlacement }: MatchIntroProps) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 400);
    const t2 = setTimeout(() => setPhase('out'), 4400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const p1Username    = mySlot === Player.P1 ? myUsername    : opponentUsername;
  const p1Elo         = mySlot === Player.P1 ? myElo         : opponentElo;
  const p1InPlacement = mySlot === Player.P1 ? myInPlacement : opponentInPlacement;
  const p2Username    = mySlot === Player.P2 ? myUsername    : opponentUsername;
  const p2Elo         = mySlot === Player.P2 ? myElo         : opponentElo;
  const p2InPlacement = mySlot === Player.P2 ? myInPlacement : opponentInPlacement;

  return (
    <div className={`${styles.overlay} ${styles[phase]}`}>
      <div className={styles.inner}>

        {/* Player 1 — Gold */}
        <div className={`${styles.side} ${styles.sideLeft} ${styles.gold}`}>
          <div className={styles.label}>JOUEUR 1</div>
          <div className={styles.username}>{p1Username}</div>
          {p1InPlacement ? <div className={styles.elo}>UNRANKED</div> : p1Elo != null && <div className={styles.elo}>{p1Elo} ELO</div>}
        </div>

        {/* VS */}
        <div className={styles.vs}>VS</div>

        {/* Player 2 — Silver */}
        <div className={`${styles.side} ${styles.sideRight} ${styles.silver}`}>
          <div className={styles.label}>JOUEUR 2</div>
          <div className={styles.username}>{p2Username}</div>
          {p2InPlacement ? <div className={styles.elo}>UNRANKED</div> : p2Elo != null && <div className={styles.elo}>{p2Elo} ELO</div>}
        </div>

      </div>
    </div>
  );
}
