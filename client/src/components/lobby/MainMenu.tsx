import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import styles from './MainMenu.module.css';

export function MainMenu() {
  const navigate = useNavigate();
  const t = useLang();
  const [openMenu, setOpenMenu] = useState<'play' | 'community' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const { user, resendVerification, refreshMe } = useAuthStore();
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => { refreshMe(); }, []);

  useEffect(() => {
    if (!openMenu) return;
    function handleClick(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openMenu]);

  function toggleMenu(name: 'play' | 'community') {
    setOpenMenu(prev => prev === name ? null : name);
  }

  return (
    <div className={styles.container}>

      {/* Title */}
      <img
        src="/assets/logo/logo_menu.png"
        alt="THRONES"
        className={styles.title}
      />

      {/* Ornament separator */}
      <div className={styles.ornament}>
        <div className={styles.ornamentLine} />
        <svg className={styles.ornamentHex} viewBox="0 0 12 14" aria-hidden>
          <polygon points="6,0 12,3.5 12,10.5 6,14 0,10.5 0,3.5" />
        </svg>
        <div className={styles.ornamentLine} />
      </div>

      {/* Email verification banner */}
      {user && !user.emailVerified && (
        <div className={styles.verifyBanner}>
          <span>{t.auth.verifyEmailBanner}</span>
          <button
            className={styles.verifyResendBtn}
            onClick={async () => { await resendVerification(); setResendSent(true); }}
            disabled={resendSent}
          >
            {resendSent ? '✓' : t.auth.resendVerification}
          </button>
        </div>
      )}

      {/* Glass nav card */}
      <div className={styles.card} ref={cardRef}>
        <div className={styles.cardShimmer} aria-hidden />

        {/* PLAY dropdown */}
        <div className={styles.dropGroup}>
          <button
            className={`${styles.btnPrimary} ${styles.btnDrop}`}
            onClick={() => user && !user.emailVerified ? null : toggleMenu('play')}
            aria-expanded={openMenu === 'play'}
            disabled={user ? !user.emailVerified : false}
            title={user && !user.emailVerified ? t.auth.verifyEmailBanner : undefined}
          >
            <span>{t.menu.play}</span>
            <svg
              className={`${styles.chevron} ${openMenu === 'play' ? styles.chevronOpen : ''}`}
              viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className={`${styles.dropdown} ${openMenu === 'play' ? styles.dropdownOpen : ''}`}>
            <button className={styles.dropItem} onClick={() => navigate('/game?mode=local')}>
              {t.menu.playLocal}
            </button>
            <button className={styles.dropItem} onClick={() => navigate('/game?mode=ai')}>
              {t.menu.playAI}
            </button>
            <button className={styles.dropItem} onClick={() => navigate('/game?mode=online')}>
              {t.menu.playOnline}
            </button>
          </div>
        </div>

        {/* COMMUNITY dropdown */}
        <div className={styles.dropGroup}>
          <button
            className={`${styles.btnSecondary} ${styles.btnDrop}`}
            onClick={() => toggleMenu('community')}
            aria-expanded={openMenu === 'community'}
          >
            <span>{t.menu.community}</span>
            <svg
              className={`${styles.chevron} ${openMenu === 'community' ? styles.chevronOpen : ''}`}
              viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className={`${styles.dropdown} ${openMenu === 'community' ? styles.dropdownOpen : ''}`}>
            <button key="tournaments" className={`${styles.dropItem} ${styles.dropItemDisabled}`} disabled>
              <span>{t.menu.tournaments}</span>
              <span className={styles.soonTag}>{t.menu.comingSoon}</span>
            </button>
            <button key="players" className={styles.dropItem} onClick={() => navigate('/players')}>
              {t.menu.players}
            </button>
            <button key="ranking" className={styles.dropItem} onClick={() => navigate('/leaderboard')}>
              {t.menu.ranking}
            </button>
          </div>
        </div>

        {/* Tutorial */}
        <button className={styles.btnSecondary} onClick={() => navigate('/tutorial')}>
          {t.menu.tutorial}
        </button>
      </div>

      <p className={styles.version}>{t.menu.copyright}</p>
    </div>
  );
}
