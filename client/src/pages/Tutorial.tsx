import { useNavigate } from 'react-router-dom';
import { TutorialFlow } from '@/components/tutorial/TutorialFlow';
import { PageLogo } from '@/components/ui/PageLogo';
import { GlobalTopRight } from '@/components/ui/GlobalTopRight';
import { useLang } from '@/i18n';
import styles from './Tutorial.module.css';

export function Tutorial() {
  const navigate = useNavigate();
  const t = useLang();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <PageLogo />
        <span className={styles.title}>{t.tutorial_header.title}</span>
        <GlobalTopRight inline />
      </header>
      <div className={styles.content}>
        <TutorialFlow />
      </div>
    </div>
  );
}
