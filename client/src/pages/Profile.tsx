import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLang } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import {
  apiGetProfile,
  apiGetHistory,
  apiGetFriends,
  apiAddFriend,
  apiRemoveFriend,
  apiCheckFriend,
} from '@/lib/api';
import type { UserProfile, GameHistoryEntry, FriendEntry } from '../../../shared/types';
import styles from './Profile.module.css';

// ── Flag image helper (flagcdn.com — reliable on Windows) ─────────

function FlagImg({ code, size = 24, className }: { code: string; size?: number; className?: string }) {
  const src = `https://flagcdn.com/${size}x${Math.round(size * 0.75)}/${code.toLowerCase()}.png`;
  const src2x = `https://flagcdn.com/${size * 2}x${Math.round(size * 0.75 * 2)}/${code.toLowerCase()}.png`;
  return (
    <img
      src={src}
      srcSet={`${src2x} 2x`}
      width={size}
      height={Math.round(size * 0.75)}
      alt={code}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: '1px' }}
    />
  );
}

// ── Country data ──────────────────────────────────────────────────

const COUNTRIES: { code: string; name: string; nameFr: string }[] = [
  { code: 'AF', name: 'Afghanistan',         nameFr: 'Afghanistan' },
  { code: 'DZ', name: 'Algeria',             nameFr: 'Algérie' },
  { code: 'AR', name: 'Argentina',           nameFr: 'Argentine' },
  { code: 'AU', name: 'Australia',           nameFr: 'Australie' },
  { code: 'AT', name: 'Austria',             nameFr: 'Autriche' },
  { code: 'BE', name: 'Belgium',             nameFr: 'Belgique' },
  { code: 'BR', name: 'Brazil',              nameFr: 'Brésil' },
  { code: 'CA', name: 'Canada',              nameFr: 'Canada' },
  { code: 'CL', name: 'Chile',               nameFr: 'Chili' },
  { code: 'CN', name: 'China',               nameFr: 'Chine' },
  { code: 'CO', name: 'Colombia',            nameFr: 'Colombie' },
  { code: 'HR', name: 'Croatia',             nameFr: 'Croatie' },
  { code: 'CZ', name: 'Czech Republic',      nameFr: 'Tchéquie' },
  { code: 'DK', name: 'Denmark',             nameFr: 'Danemark' },
  { code: 'EG', name: 'Egypt',               nameFr: 'Égypte' },
  { code: 'FI', name: 'Finland',             nameFr: 'Finlande' },
  { code: 'FR', name: 'France',              nameFr: 'France' },
  { code: 'DE', name: 'Germany',             nameFr: 'Allemagne' },
  { code: 'GR', name: 'Greece',              nameFr: 'Grèce' },
  { code: 'HU', name: 'Hungary',             nameFr: 'Hongrie' },
  { code: 'IN', name: 'India',               nameFr: 'Inde' },
  { code: 'ID', name: 'Indonesia',           nameFr: 'Indonésie' },
  { code: 'IR', name: 'Iran',                nameFr: 'Iran' },
  { code: 'IE', name: 'Ireland',             nameFr: 'Irlande' },
  { code: 'IL', name: 'Israel',              nameFr: 'Israël' },
  { code: 'IT', name: 'Italy',               nameFr: 'Italie' },
  { code: 'JP', name: 'Japan',               nameFr: 'Japon' },
  { code: 'KR', name: 'South Korea',         nameFr: 'Corée du Sud' },
  { code: 'MX', name: 'Mexico',              nameFr: 'Mexique' },
  { code: 'MA', name: 'Morocco',             nameFr: 'Maroc' },
  { code: 'NL', name: 'Netherlands',         nameFr: 'Pays-Bas' },
  { code: 'NZ', name: 'New Zealand',         nameFr: 'Nouvelle-Zélande' },
  { code: 'NG', name: 'Nigeria',             nameFr: 'Nigéria' },
  { code: 'NO', name: 'Norway',              nameFr: 'Norvège' },
  { code: 'PK', name: 'Pakistan',            nameFr: 'Pakistan' },
  { code: 'PE', name: 'Peru',                nameFr: 'Pérou' },
  { code: 'PH', name: 'Philippines',         nameFr: 'Philippines' },
  { code: 'PL', name: 'Poland',              nameFr: 'Pologne' },
  { code: 'PT', name: 'Portugal',            nameFr: 'Portugal' },
  { code: 'RO', name: 'Romania',             nameFr: 'Roumanie' },
  { code: 'RU', name: 'Russia',              nameFr: 'Russie' },
  { code: 'SA', name: 'Saudi Arabia',        nameFr: 'Arabie Saoudite' },
  { code: 'RS', name: 'Serbia',              nameFr: 'Serbie' },
  { code: 'ZA', name: 'South Africa',        nameFr: 'Afrique du Sud' },
  { code: 'ES', name: 'Spain',               nameFr: 'Espagne' },
  { code: 'SE', name: 'Sweden',              nameFr: 'Suède' },
  { code: 'CH', name: 'Switzerland',         nameFr: 'Suisse' },
  { code: 'TN', name: 'Tunisia',             nameFr: 'Tunisie' },
  { code: 'TR', name: 'Turkey',              nameFr: 'Turquie' },
  { code: 'UA', name: 'Ukraine',             nameFr: 'Ukraine' },
  { code: 'GB', name: 'United Kingdom',      nameFr: 'Royaume-Uni' },
  { code: 'US', name: 'United States',       nameFr: 'États-Unis' },
  { code: 'VN', name: 'Vietnam',             nameFr: 'Viêt Nam' },
];


function formatDate(iso: string | undefined, lang: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return iso; }
}

// ── Component ─────────────────────────────────────────────────────

export function Profile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const t = useLang();
  const { user: me, token, updateProfile } = useAuthStore();

  const isOwnProfile = !!me && me.username.toLowerCase() === username?.toLowerCase();

  const [profile, setProfile]     = useState<UserProfile | null>(null);
  const [history, setHistory]     = useState<GameHistoryEntry[]>([]);
  const [histTotal, setHistTotal] = useState(0);
  const [histPage, setHistPage]   = useState(1);
  const HIST_PAGE_SIZE = 15;
  const [friends, setFriends]     = useState<FriendEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // Country edit state (own profile only)
  const [selectedCountry, setSelectedCountry] = useState('');
  const [saving, setSaving]       = useState(false);
  const [savedMsg, setSavedMsg]   = useState(false);

  // Friend state (viewing another profile while logged in)
  const [isFriend, setIsFriend]       = useState(false);
  const [friendMsg, setFriendMsg]     = useState('');

  // Add friend by username (own profile)
  const [showAddFriend, setShowAddFriend]         = useState(false);
  const [addFriendUsername, setAddFriendUsername] = useState('');

  const lang = t.lang;

  // Load profile (runs when username changes)
  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setError(null);
    setHistPage(1);
    apiGetProfile(username)
      .then(({ profile: p }) => {
        setProfile(p);
        setSelectedCountry(p.country ?? '');
      })
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [username]);

  // Load history (runs on username change and page change)
  useEffect(() => {
    if (!username) return;
    apiGetHistory(username, histPage)
      .then(({ history: h, total }) => {
        setHistory(h);
        setHistTotal(total);
      })
      .catch(() => {});
  }, [username, histPage]);

  // Own profile: load own friends list
  useEffect(() => {
    if (!isOwnProfile || !token) return;
    apiGetFriends(token).then(({ friends: f }) => setFriends(f)).catch(() => {});
  }, [isOwnProfile, token]);

  // Viewing someone else's profile: check friend status
  useEffect(() => {
    if (isOwnProfile || !token || !username) return;
    apiCheckFriend(token, username).then(({ isFriend: f }) => setIsFriend(f)).catch(() => {});
  }, [isOwnProfile, token, username]);

  async function handleSaveCountry() {
    setSaving(true);
    await updateProfile(selectedCountry || null);
    setSaving(false);
    setSavedMsg(true);
    // Update local profile display
    setProfile(p => p ? { ...p, country: selectedCountry || undefined } : p);
    setTimeout(() => setSavedMsg(false), 2000);
  }

  async function handleAddFriendByName() {
    if (!token || !addFriendUsername.trim()) return;
    try {
      await apiAddFriend(token, addFriendUsername.trim());
      setFriendMsg(t.profile.friendAdded);
      setAddFriendUsername('');
      setShowAddFriend(false);
      // Refresh friends list
      const { friends: f } = await apiGetFriends(token);
      setFriends(f);
    } catch (e) {
      setFriendMsg((e as Error).message);
    }
    setTimeout(() => setFriendMsg(''), 3000);
  }

  async function handleToggleFriend() {
    if (!token || !username) return;
    try {
      if (isFriend) {
        await apiRemoveFriend(token, username);
        setIsFriend(false);
        setFriendMsg(t.profile.friendRemoved);
      } else {
        await apiAddFriend(token, username);
        setIsFriend(true);
        setFriendMsg(t.profile.friendAdded);
      }
      setTimeout(() => setFriendMsg(''), 2000);
    } catch {}
  }

  function getResultLabel(entry: GameHistoryEntry): string {
    if (entry.winnerId === null) return t.profile.draw;
    if (!profile) return '';
    return entry.winnerId === profile.id ? t.profile.win : t.profile.loss;
  }

  function getResultClass(entry: GameHistoryEntry): string {
    if (entry.winnerId === null) return styles.resultDraw;
    if (!profile) return styles.resultDraw;
    return entry.winnerId === profile.id ? styles.resultWin : styles.resultLoss;
  }

  function getModeLabel(mode: string): string {
    if (mode === 'ai') return t.profile.modeAI;
    if (mode === 'local') return t.profile.modeLocal;
    if (mode === 'online_casual') return t.profile.modeOnlineCasual;
    return t.profile.modeOnline; // 'online_ranked' and any legacy value
  }

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.empty}>…</div>
    </div>
  );

  if (error || !profile) return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate(-1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back
      </button>
      <div className={styles.empty}>{error ?? 'Profile not found'}</div>
    </div>
  );

  const countryEntry = COUNTRIES.find(c => c.code === (profile.country ?? ''));
  const countryName = countryEntry ? (lang === 'fr' ? countryEntry.nameFr : countryEntry.name) : null;

  return (
    <div className={styles.page}>

      {/* Back */}
      <button className={styles.back} onClick={() => navigate(-1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        {isOwnProfile ? t.profile.myProfile : profile.username}
      </button>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.usernameRow}>
          <div className={styles.username}>{profile.username}</div>
          <div className={styles.eloTag}>
            {profile.rank?.isInPlacement
              ? <span className={styles.unranked}>UNRANKED</span>
              : <>{profile.elo} <span className={styles.eloLp}>ELO</span></>
            }
          </div>
        </div>
        <div className={styles.dates}>
          <span>{t.profile.memberSince} <strong>{formatDate(profile.createdAt, lang)}</strong></span>
          <span>{t.profile.lastSeen} <strong>{profile.lastLogin ? formatDate(profile.lastLogin, lang) : t.profile.never}</strong></span>
        </div>
      </div>

      <div className={styles.grid}>

        {/* Country (own profile only) */}
        {isOwnProfile && (
          <div className={styles.card}>
            <div className={styles.sectionTitle}>{t.profile.editCountry}</div>
            <div className={styles.countryRow}>
              <span className={styles.countryFlag}>
                {selectedCountry
                  ? <FlagImg code={selectedCountry} size={28} />
                  : <span style={{ fontSize: '1.4rem', opacity: 0.4 }}>?</span>
                }
              </span>
              <select
                className={styles.countrySelect}
                value={selectedCountry}
                onChange={e => setSelectedCountry(e.target.value)}
              >
                <option value="">{t.profile.countryLabel}</option>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {lang === 'fr' ? c.nameFr : c.name}
                  </option>
                ))}
              </select>
              {savedMsg
                ? <span className={styles.savedMsg}>{t.profile.saved}</span>
                : (
                  <button className={styles.saveBtn} onClick={handleSaveCountry} disabled={saving}>
                    {saving ? '…' : t.profile.saveCountry}
                  </button>
                )
              }
            </div>
          </div>
        )}

        {/* Friends (own profile: manage / other profile: add/remove) */}
        <div className={styles.card}>
          <div className={styles.sectionTitleRow}>
            <span className={styles.sectionTitle} style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>{t.profile.friends}</span>
            {isOwnProfile && (
              <button
                className={styles.addFriendInline}
                onClick={() => setShowAddFriend(v => !v)}
              >
                + {t.profile.addFriend}
              </button>
            )}
          </div>
          <div className={styles.sectionDivider} />

          {isOwnProfile && showAddFriend && (
            <div className={styles.addFriendRow}>
              <input
                className={styles.addFriendInput}
                type="text"
                value={addFriendUsername}
                onChange={e => setAddFriendUsername(e.target.value)}
                placeholder="Username…"
                onKeyDown={e => e.key === 'Enter' && handleAddFriendByName()}
              />
              <button className={styles.saveBtn} onClick={handleAddFriendByName} disabled={!addFriendUsername.trim()}>
                {t.profile.addFriend}
              </button>
              {friendMsg && <span className={styles.savedMsg}>{friendMsg}</span>}
            </div>
          )}

          {isOwnProfile ? (
            friends.length === 0
              ? <div className={styles.empty}>{t.profile.noFriends}</div>
              : (
                <div className={styles.friendsList}>
                  {friends.map(f => (
                    <div key={f.id} className={styles.friendRow} onClick={() => navigate(`/profile/${f.username}`)}>
                      <div className={styles.friendAvatar}>{f.username[0]}</div>
                      <span className={styles.friendName}>
                        {f.country && <FlagImg code={f.country} size={18} />}
                        {f.username}
                      </span>
                      <span className={styles.friendElo}>{f.elo}</span>
                      <button
                        className={styles.removeFriendBtn}
                        onClick={async e => {
                          e.stopPropagation();
                          if (!token) return;
                          await apiRemoveFriend(token, f.username);
                          setFriends(prev => prev.filter(x => x.id !== f.id));
                        }}
                      >
                        {t.profile.removeFriend}
                      </button>
                    </div>
                  ))}
                </div>
              )
          ) : (
            <>
              {/* Viewing another user: only show add/remove if logged in */}
              {token && me && (
                <>
                  {friendMsg && <div className={styles.savedMsg} style={{ marginBottom: '0.5rem' }}>{friendMsg}</div>}
                  <button
                    className={`${styles.addFriendBtn} ${isFriend ? '' : styles.addFriendBtnActive}`}
                    onClick={handleToggleFriend}
                  >
                    {isFriend ? t.profile.removeFriend : t.profile.addFriend}
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Match history — full width */}
        <div className={`${styles.card} ${styles.cardFull}`}>
          <div className={styles.sectionTitle}>{t.profile.matchHistory}</div>
          {history.length === 0
            ? <div className={styles.empty}>{t.profile.noHistory}</div>
            : (() => {
                const totalPages = Math.ceil(histTotal / HIST_PAGE_SIZE);
                return (
                  <>
                    <div className={styles.historyList}>
                      {history.map(entry => {
                        const delta      = entry.eloChangeMe;
                        const eloClass   = delta > 0 ? styles.historyEloPos : delta < 0 ? styles.historyEloNeg : styles.historyEloNeutral;
                        const isRanked   = entry.gameMode === 'online_ranked';
                        // rankedGamesNewer = how many ranked games came AFTER this one
                        // chronological rank of this game = totalRanked - rankedGamesNewer
                        // it's a placement game if that number is between 1 and 10
                        const totalRanked = profile.rank.totalRankedGamesPlayed;
                        const chronoRank  = isRanked && entry.rankedGamesNewer != null
                          ? totalRanked - entry.rankedGamesNewer
                          : null;
                        const placementN  = chronoRank != null && chronoRank >= 1 && chronoRank <= 10 ? chronoRank : null;
                        return (
                          <div key={entry.id} className={styles.historyRow}>
                            <span className={`${styles.resultBadge} ${getResultClass(entry)}`}>
                              {getResultLabel(entry)}
                            </span>
                            <span className={styles.historyOpponent}>
                              {entry.opponentUsername ?? '—'}
                            </span>
                            <span className={styles.historyMeta}>
                              <span className={styles.modeBadge}>{getModeLabel(entry.gameMode)}</span>
                              {' '}
                              {t.profile.turns(entry.turns)}
                              {' · '}
                              {formatDate(entry.createdAt, lang)}
                            </span>
                            {isRanked && placementN != null && (
                              <span className={styles.historyPlacement}>
                                Placement {placementN}/10
                              </span>
                            )}
                            {isRanked && placementN == null && (
                              <span className={`${styles.historyElo} ${eloClass}`}>
                                {t.profile.eloChange(delta)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {totalPages > 1 && (
                      <div className={styles.pagination}>
                        <button
                          className={styles.pageBtn}
                          onClick={() => setHistPage(p => Math.max(1, p - 1))}
                          disabled={histPage === 1}
                        >
                          ←
                        </button>
                        <span className={styles.pageLabel}>{histPage} / {totalPages}</span>
                        <button
                          className={styles.pageBtn}
                          onClick={() => setHistPage(p => Math.min(totalPages, p + 1))}
                          disabled={histPage === totalPages}
                        >
                          →
                        </button>
                      </div>
                    )}
                  </>
                );
              })()
          }
        </div>

      </div>
    </div>
  );
}
