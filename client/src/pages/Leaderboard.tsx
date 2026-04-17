import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { apiGetLeaderboard } from '@/lib/api';
import type { LeaderboardEntry } from '../../../shared/types';
import { PageLogo } from '@/components/ui/PageLogo';
import { GlobalTopRight } from '@/components/ui/GlobalTopRight';
import styles from './Leaderboard.module.css';

export function Leaderboard() {
  const navigate = useNavigate();
  const t        = useLang();
  const user     = useAuthStore(s => s.user);

  const [entries, setEntries]   = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState<string | null>(null);

  useEffect(() => {
    apiGetLeaderboard()
      .then(({ leaderboard }) => setEntries(leaderboard))
      .catch(() => setError('Unable to load leaderboard — is the server running?'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <PageLogo />
        <span className={styles.headerTitle}>{t.leaderboard.title}</span>
        <GlobalTopRight inline />
      </header>

      <div className={styles.content}>
        {loading && <div className={styles.loading}>…</div>}
        {error   && <div className={styles.error}>{error}</div>}
        {!loading && !error && entries.length === 0 && (
          <div className={styles.empty}>{t.leaderboard.noGames}</div>
        )}
        {!loading && !error && entries.length > 0 && (
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th>{t.leaderboard.rank}</th>
                <th style={{ textAlign: 'left' }}>{t.leaderboard.player}</th>
                <th>{t.leaderboard.elo}</th>
                <th>{t.leaderboard.wins}</th>
                <th>{t.leaderboard.played}</th>
                <th>{t.leaderboard.winRate}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => {
                const isMe = user?.id === entry.id;
                return (
                  <tr
                    key={entry.id}
                    className={`${styles.row} ${isMe ? styles.rowMe : ''} ${styles.rowClickable}`}
                    onClick={() => navigate(`/profile/${entry.username}`)}
                  >
                    <td>
                      <span className={styles.rank}>#{entry.rank}</span>
                    </td>
                    <td>
                      <div className={styles.playerCell}>
                        {entry.country ? (
                          <div className={styles.avatarFlag}>
                            <img
                              src={`https://flagcdn.com/20x15/${entry.country.toLowerCase()}.png`}
                              srcSet={`https://flagcdn.com/40x30/${entry.country.toLowerCase()}.png 2x`}
                              width={20}
                              height={15}
                              alt={entry.country}
                              style={{ display: 'block', borderRadius: '1px' }}
                            />
                          </div>
                        ) : (
                          <div className={styles.avatar}>
                            {entry.username[0].toUpperCase()}
                          </div>
                        )}
                        <span className={styles.username}>{entry.username}</span>
                        {isMe && <span className={styles.youTag}>{t.leaderboard.you}</span>}
                      </div>
                    </td>
                    <td>
                      <span className={styles.eloCell}>{entry.elo}</span>
                    </td>
                    <td>{entry.gamesWon}</td>
                    <td>{entry.gamesPlayed}</td>
                    <td>
                      <span className={styles.winRate}>{entry.winRate}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
