import { useLangStore } from '@/store/langStore';
import styles from './LangToggle.module.css';

export function LangToggle() {
  const { lang, setLang } = useLangStore();

  return (
    <div className={styles.toggle}>
      <button
        className={`${styles.btn} ${lang === 'fr' ? styles.active : ''}`}
        onClick={() => setLang('fr')}
        aria-pressed={lang === 'fr'}
      >
        FR
      </button>
      <span className={styles.sep}>|</span>
      <button
        className={`${styles.btn} ${lang === 'en' ? styles.active : ''}`}
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
    </div>
  );
}
