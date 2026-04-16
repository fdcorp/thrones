import { useNavigate } from 'react-router-dom';
import { TutorialFlow } from '@/components/tutorial/TutorialFlow';
import { useLang } from '@/i18n';
import styles from './Tutorial.module.css';

export function Tutorial() {
  const navigate = useNavigate();
  const t = useLang();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/')}>
          <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 14, height: 14 }}>
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {t.tutorial_header.back}
        </button>
        <span className={styles.title}>{t.tutorial_header.title}</span>
      </header>
      <div className={styles.content}>
        <TutorialFlow />
      </div>
    </div>
  );
}
