import { useNavigate } from 'react-router-dom';
import { TutorialFlow } from '@/components/tutorial/TutorialFlow';
import { LangToggle } from '@/components/ui/LangToggle';
import { useLang } from '@/i18n';
import styles from './Tutorial.module.css';

export function Tutorial() {
  const navigate = useNavigate();
  const t = useLang();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/')}>{t.tutorial_header.back}</button>
        <span className={styles.title}>{t.tutorial_header.title}</span>
        <LangToggle />
      </header>
      <div className={styles.content}>
        <TutorialFlow />
      </div>
    </div>
  );
}
