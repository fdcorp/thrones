import type { AILevel } from '@/engine/types';
import { useLang } from '@/i18n';
import styles from './AIConfig.module.css';

interface AIConfigProps {
  selected: AILevel | null;
  onSelect: (level: AILevel) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export function AIConfig({ selected, onSelect, onConfirm, onBack }: AIConfigProps) {
  const t = useLang();

  const LEVELS: { level: AILevel; label: string; desc: string }[] = [
    { level: 'easy',   label: t.aiConfig.easy,   desc: t.aiConfig.easyDesc },
    { level: 'medium', label: t.aiConfig.medium,  desc: t.aiConfig.mediumDesc },
    { level: 'hard',   label: t.aiConfig.hard,    desc: t.aiConfig.hardDesc },
    { level: 'expert', label: t.aiConfig.expert,  desc: t.aiConfig.expertDesc },
  ];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{t.aiConfig.title}</h2>
      <div className={styles.levels}>
        {LEVELS.map(({ level, label, desc }) => (
          <button
            key={level}
            className={`${styles.levelBtn} ${selected === level ? styles.selected : ''}`}
            onClick={() => onSelect(level)}
          >
            <span className={styles.levelLabel}>{label}</span>
          </button>
        ))}
      </div>
      <div className={styles.actions}>
        <button className="btn-ghost" onClick={onBack}>{t.aiConfig.back}</button>
        <button
          className={`btn-primary ${!selected ? 'btn-disabled' : ''}`}
          onClick={onConfirm}
          disabled={!selected}
        >
          {t.aiConfig.play}
        </button>
      </div>
    </div>
  );
}
