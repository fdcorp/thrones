import type { ReactNode } from 'react';
import styles from './TutorialStep.module.css';

interface TutorialStepProps {
  title: string;
  subtitle?: string;
  text: string;
  bullets?: string[];
  icon: ReactNode;
}

export function TutorialStep({ title, subtitle, text, bullets, icon }: TutorialStepProps) {
  return (
    <div className={styles.step}>
      <div className={styles.iconWrapper}>
        {icon}
      </div>
      <div className={styles.content}>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.text}>{text}</p>
        {bullets && bullets.length > 0 && (
          <ul className={styles.bullets}>
            {bullets.map((b, i) => (
              <li key={i} className={styles.bullet}>{b}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
