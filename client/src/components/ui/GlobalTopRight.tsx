import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '@/i18n';
import { CustomPanel } from '@/components/ui/CustomPanel';
import { useAuthStore } from '@/store/authStore';
import styles from './GlobalTopRight.module.css';

export function GlobalTopRight() {
  const navigate = useNavigate();
  const t = useLang();

  const { user, loading: authLoading, error: authError, login, register, logout, clearError, forgotPassword } = useAuthStore();

  const [showAuth, setShowAuth]       = useState(false);
  const [authMode, setAuthMode]       = useState<'login' | 'register' | 'forgot'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authEmail, setAuthEmail]     = useState('');
  const [forgotSent, setForgotSent]   = useState(false);
  const [showCustom, setShowCustom]   = useState(false);

  function openAuthModal(mode: 'login' | 'register') {
    setAuthMode(mode);
    setAuthUsername('');
    setAuthPassword('');
    setAuthEmail('');
    setForgotSent(false);
    clearError();
    setShowAuth(true);
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (authMode === 'forgot') {
      await forgotPassword(authEmail);
      setForgotSent(true);
      return;
    }
    if (authMode === 'login') {
      await login(authUsername, authPassword);
    } else {
      await register(authUsername, authPassword, authEmail);
    }
    if (!useAuthStore.getState().error) {
      setShowAuth(false);
    }
  }

  return (
    <>
      <div className={styles.wrap}>
        {user ? (
          <div className={styles.badge}>
            <button
              className={styles.badgeBtn}
              onClick={() => navigate(`/profile/${user.username}`)}
              title={t.profile.viewProfile}
            >
              {user.country && (
                <img
                  src={`https://flagcdn.com/20x15/${user.country.toLowerCase()}.png`}
                  srcSet={`https://flagcdn.com/40x30/${user.country.toLowerCase()}.png 2x`}
                  width={20}
                  height={15}
                  alt={user.country}
                  style={{ borderRadius: '1px', verticalAlign: 'middle', flexShrink: 0 }}
                />
              )}
              <span className={styles.name}>{user.username}</span>
              <span className={styles.elo}>
                {user.rank?.isInPlacement
                  ? `Placement ${10 - (user.rank.provisionalGamesLeft ?? 10)}/10`
                  : `${user.elo} ELO`}
              </span>
            </button>
            <button className={styles.iconBtn} onClick={logout} title="Déconnexion" aria-label="Déconnexion">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        ) : (
          <button className={styles.iconBtn} onClick={() => openAuthModal('login')} aria-label="Connexion">
            <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </button>
        )}
        <button
          className={styles.iconBtn}
          onClick={() => setShowCustom(v => !v)}
          title={t.game.customize}
          aria-label={t.game.customize}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      {showAuth && (
        <div className={styles.authOverlay} onClick={() => setShowAuth(false)}>
          <div className={styles.authBox} onClick={e => e.stopPropagation()}>
            <div className={styles.authHeader}>
              <span className={styles.authTitle}>
                {authMode === 'login' ? t.auth.loginTitle : authMode === 'register' ? t.auth.registerTitle : t.auth.forgotTitle}
              </span>
              <button className={styles.authClose} onClick={() => setShowAuth(false)} aria-label="Fermer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form className={styles.authBody} onSubmit={handleAuthSubmit}>
              {authError && <div className={styles.authError}>{authError}</div>}

              {authMode === 'forgot' ? (
                forgotSent ? (
                  <p className={styles.authSuccess}>{t.auth.forgotSuccess}</p>
                ) : (
                  <>
                    <p className={styles.authDesc}>{t.auth.forgotDesc}</p>
                    <div className={styles.authField}>
                      <label className={styles.authLabel}>{t.auth.email}</label>
                      <input
                        className={styles.authInput}
                        type="email"
                        value={authEmail}
                        onChange={e => setAuthEmail(e.target.value)}
                        placeholder={t.auth.emailPlaceholder}
                        autoComplete="email"
                        required
                      />
                    </div>
                    <button className={styles.authLoginBtn} type="submit" disabled={authLoading}>
                      {authLoading ? '...' : t.auth.forgotBtn}
                    </button>
                  </>
                )
              ) : (
                <>
                  <div className={styles.authField}>
                    <label className={styles.authLabel}>{t.auth.username}</label>
                    <input
                      className={styles.authInput}
                      type="text"
                      value={authUsername}
                      onChange={e => setAuthUsername(e.target.value)}
                      placeholder={t.auth.usernamePlaceholder}
                      autoComplete="username"
                      required
                      minLength={2}
                      maxLength={20}
                    />
                  </div>
                  {authMode === 'register' && (
                    <div className={styles.authField}>
                      <label className={styles.authLabel}>{t.auth.email}</label>
                      <input
                        className={styles.authInput}
                        type="email"
                        value={authEmail}
                        onChange={e => setAuthEmail(e.target.value)}
                        placeholder={t.auth.emailPlaceholder}
                        autoComplete="email"
                        required
                      />
                    </div>
                  )}
                  <div className={styles.authField}>
                    <label className={styles.authLabel}>{t.auth.password}</label>
                    <input
                      className={styles.authInput}
                      type="password"
                      value={authPassword}
                      onChange={e => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                      required
                      minLength={6}
                    />
                  </div>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      className={styles.authForgotBtn}
                      onClick={() => { setAuthMode('forgot'); clearError(); }}
                    >
                      {t.auth.forgotPassword}
                    </button>
                  )}
                  <button className={styles.authLoginBtn} type="submit" disabled={authLoading}>
                    {authLoading ? '...' : authMode === 'login' ? t.auth.loginBtn : t.auth.registerBtn}
                  </button>
                  <div className={styles.authDivider}><span>{t.auth.or}</span></div>
                  <button
                    type="button"
                    className={styles.authRegisterBtn}
                    onClick={() => { setAuthMode(m => m === 'login' ? 'register' : 'login'); clearError(); setAuthEmail(''); }}
                  >
                    {authMode === 'login' ? t.auth.switchToRegister : t.auth.switchToLogin}
                  </button>
                </>
              )}

              {authMode === 'forgot' && (
                <button
                  type="button"
                  className={styles.authRegisterBtn}
                  onClick={() => { setAuthMode('login'); clearError(); setForgotSent(false); }}
                >
                  {t.auth.backToLogin}
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      <CustomPanel open={showCustom} onClose={() => setShowCustom(false)} />
    </>
  );
}
