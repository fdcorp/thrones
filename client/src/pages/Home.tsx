import { MainMenu } from '@/components/lobby/MainMenu';
import styles from './Home.module.css';

export function Home() {
  return (
    <div className={styles.page}>
      <MainMenu />
    </div>
  );
}
