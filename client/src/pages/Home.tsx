import { MainMenu } from '@/components/lobby/MainMenu';
import { DemoBoard } from '@/components/tutorial/DemoBoard';
import styles from './Home.module.css';

export function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.bgBoard} aria-hidden>
        <DemoBoard />
      </div>
      <MainMenu />
    </div>
  );
}
