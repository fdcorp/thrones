import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLang } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { apiGetAllPlayers, apiGetFriends, apiAddFriend } from '@/lib/api';
import type { LeaderboardEntry } from '../../../shared/types';
import { PageLogo } from '@/components/ui/PageLogo';
import { GlobalTopRight } from '@/components/ui/GlobalTopRight';
import styles from './Players.module.css';

export function Players() {
  const navigate = useNavigate();
  const t        = useLang();
  const { user, token } = useAuthStore();

  const [entries, setEntries]             = useState<LeaderboardEntry[]>([]);
  const [friendIds, setFriendIds]         = useState<Set<number>>(new Set());
  const [requestSentIds, setRequestSentIds] = useState<Set<number>>(new Set());
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [adding, setAdding]               = useState<Set<number>>(new Set());
  const [search, setSearch]               = useState('');

  const filtered = search.trim()
    ? entries.filter(e => e.username.toLowerCase().includes(search.trim().toLowerCase()))
    : entries;

  useEffect(() => {
    const fetches: Promise<void>[] = [
      apiGetAllPlayers()
        .then(({ players }) => {
          const sorted = [...players].sort((a, b) =>
            a.username.toLowerCase().localeCompare(b.username.toLowerCase())
          );
          setEntries(sorted);
        })
        .catch(() => setError('Unable to load — is the server running?')),
    ];
    if (token) {
      fetches.push(
        apiGetFriends(token)
          .then(({ friends }) => setFriendIds(new Set(friends.map(f => f.id))))
          .catch(() => {}),
      );
    }
    Promise.all(fetches).finally(() => setLoading(false));
  }, [token]);

  async function handleAddFriend(entry: LeaderboardEntry) {
    if (!token) return;
    setAdding(prev => new Set(prev).add(entry.id));
    try {
      const { accepted } = await apiAddFriend(token, entry.username) as { ok: boolean; accepted?: boolean };
      if (accepted) {
        setFriendIds(prev => new Set(prev).add(entry.id));
      } else {
        setRequestSentIds(prev => new Set(prev).add(entry.id));
      }
    } catch {
      // ignore
    } finally {
      setAdding(prev => { const s = new Set(prev); s.delete(entry.id); return s; });
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <PageLogo />
        <span className={styles.headerTitle}>{t.players.title}</span>
        <GlobalTopRight inline />
      </header>

      <div className={styles.content}>
        {loading && <div className={styles.loading}>…</div>}
        {error   && <div className={styles.error}>{error}</div>}
        {!loading && !error && (
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Rechercher un joueur…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className={styles.empty}>{t.players.noPlayers}</div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th style={{ textAlign: 'left' }}>{t.players.player}</th>
                <th>{t.players.elo}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(entry => {
                const isMe        = user?.id === entry.id;
                const isFriend    = friendIds.has(entry.id);
                const isAdding    = adding.has(entry.id);
                const requestSent = requestSentIds.has(entry.id);

                return (
                  <tr
                    key={entry.id}
                    className={`${styles.row} ${isMe ? styles.rowMe : ''}`}
                  >
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
                        <Link to={`/profile/${entry.username}`} className={styles.username}>
                          {entry.username}
                        </Link>
                        {isMe && <span className={styles.youTag}>{t.players.you}</span>}
                      </div>
                    </td>
                    <td>
                      {entry.isInPlacement
                        ? <span className={styles.unranked}>Unranked</span>
                        : <span className={styles.eloCell}>{entry.elo}</span>
                      }
                    </td>
                    <td className={styles.actionCell}>
                      {isMe ? null : isFriend ? (
                        <span className={styles.friendTag}>✓ {t.players.friend}</span>
                      ) : requestSent ? (
                        <span className={styles.requestSentTag}>{t.profile.requestSent}</span>
                      ) : token ? (
                        <button
                          className={styles.addBtn}
                          onClick={() => handleAddFriend(entry)}
                          disabled={isAdding}
                        >
                          + {t.players.addFriend}
                        </button>
                      ) : null}
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
