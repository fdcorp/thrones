import { Player } from '@/engine/types';
import styles from './AshParticles.module.css';

// Pre-computed static particle data — deterministic, no re-renders
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left:     `${((i * 41 + 7) % 86) + 7}%`,
  width:    1.2 + ((i * 17) % 28) / 10,       // 1.2 – 4px
  height:   1.8 + ((i * 11) % 36) / 10,       // 1.8 – 5.4px
  duration: 5.5 + ((i * 1.3) % 5.5),          // 5.5 – 11s
  delay:    -(((i * 2.1) % 11)),               // 0 to -11s — pre-seeds cycle
  opacity:  0.18 + ((i * 13) % 28) / 100,     // 0.18 – 0.46
}));

interface Props {
  player: Player;
  flipped?: boolean;
}

export function AshParticles({ player, flipped }: Props) {
  // When flipped, P2 is at bottom (rising particles) and P1 is at top (falling)
  const isP1 = flipped ? player !== Player.P1 : player === Player.P1;

  return (
    <div className={styles.container}>
      {PARTICLES.map(p => (
        <div
          key={p.id}
          className={`${styles.ash} ${isP1 ? styles.ashP1 : styles.ashP2}`}
          style={{
            left: p.left,
            width:  `${p.width}px`,
            height: `${p.height}px`,
            background: isP1
              ? `rgba(201, 168, 76, ${p.opacity * 0.45})`
              : `rgba(168, 180, 192, ${p.opacity * 0.4})`,
            boxShadow: isP1
              ? `0 0 ${p.width * 2}px rgba(201,168,76,${p.opacity * 0.3})`
              : `0 0 ${p.width * 2}px rgba(168,180,192,${p.opacity * 0.25})`,
            '--dur':   `${p.duration}s`,
            '--delay': `${p.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
