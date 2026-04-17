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
      <svg
        viewBox="0 0 1191 216"
        aria-label="THRONES"
        className={styles.title}
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M115.59,65.086l0,128.078l-50.717,0l0,-128.078l-46.861,0l0,-39.499l145.023,0l0,39.499l-47.445,0Z"/>
        <path d="M291.581,193.165l0,-62.52l-57.963,0l0,62.52l-50.483,0l0,-167.577l50.483,0l0,62.053l57.963,0l0,-62.053l50.483,0l0,167.577l-50.483,0Z"/>
        <path d="M462.079,193.165l-12.504,-36.11c-2.415,-7.09 -5.551,-12.66 -9.407,-16.711c-3.856,-4.051 -8.044,-6.077 -12.562,-6.077l-1.987,0l0,58.897l-50.483,0l0,-167.577l67.078,0c23.45,0 40.765,3.837 51.944,11.511c11.18,7.674 16.769,19.185 16.769,34.532c0,11.53 -3.253,21.191 -9.758,28.981c-6.505,7.791 -16.185,13.439 -29.04,16.945l0,0.467c7.09,2.181 12.991,5.726 17.704,10.634c4.713,4.908 8.94,12.192 12.679,21.853l16.477,42.654l-56.911,0Zm-4.791,-114.406c0,-5.609 -1.714,-10.05 -5.142,-13.322c-3.428,-3.272 -8.803,-4.908 -16.127,-4.908l-10.401,0l0,38.33l9.115,0c6.778,0 12.231,-1.909 16.36,-5.726c4.129,-3.817 6.194,-8.609 6.194,-14.374Z"/>
        <path d="M697.786,108.909c0,16.828 -3.623,31.883 -10.868,45.166c-7.245,13.283 -17.373,23.606 -30.384,30.968c-13.01,7.362 -27.579,11.043 -43.706,11.043c-15.737,0 -30.052,-3.564 -42.946,-10.693c-12.894,-7.128 -22.924,-17.139 -30.091,-30.033c-7.167,-12.894 -10.751,-27.482 -10.751,-43.764c0,-17.062 3.623,-32.409 10.868,-46.043c7.245,-13.634 17.412,-24.171 30.5,-31.611c13.088,-7.44 27.968,-11.16 44.64,-11.16c16.049,0 30.403,3.564 43.063,10.693c12.66,7.128 22.437,17.295 29.332,30.5c6.895,13.205 10.342,28.183 10.342,44.933Zm-48.166,41.864l11.854,-78.091l-31.116,33.698l-16.945,-42.256l-16.945,42.256l-31.116,-33.698l11.854,78.091l72.414,0Z"/>
        <path d="M838.602,193.165l-59.131,-80.867c-4.674,-6.388 -8.492,-12.153 -11.452,-17.295l-0.467,0c0.467,8.258 0.701,17.529 0.701,27.813l0,70.35l-46.744,0l0,-167.577l47.679,0l56.677,76.894c0.701,1.013 1.558,2.22 2.571,3.623c1.013,1.402 2.026,2.844 3.038,4.324c1.013,1.48 1.967,2.921 2.863,4.324c0.896,1.402 1.578,2.649 2.045,3.74l0.467,0c-0.467,-3.428 -0.701,-9.349 -0.701,-17.763l0,-75.141l46.744,0l0,167.577l-44.29,0Z"/>
        <path d="M915.846,193.165l0,-167.577l104.356,0l0,39.499l-53.872,0l0,24.424l50.6,0l0,39.499l-50.6,0l0,24.657l57.729,0l0,39.499l-108.212,0Z"/>
        <path d="M1164.291,142.447c0,11.141 -2.98,20.84 -8.94,29.098c-5.96,8.258 -14.315,14.413 -25.066,18.464c-10.751,4.051 -23.684,6.077 -38.797,6.077c-17.529,0 -33.578,-2.96 -48.146,-8.881l0,-45.926c7.012,5.142 14.763,9.29 23.255,12.446c8.492,3.155 16.399,4.733 23.723,4.733c5.531,0 9.816,-0.993 12.855,-2.98c3.038,-1.987 4.558,-4.889 4.558,-8.706c0,-2.727 -0.76,-5.122 -2.279,-7.187c-1.519,-2.065 -3.817,-3.993 -6.895,-5.785c-3.077,-1.792 -8.784,-4.246 -17.12,-7.362c-26.956,-10.362 -40.434,-27.112 -40.434,-50.25c0,-16.205 6.155,-29.157 18.464,-38.856c12.309,-9.699 28.825,-14.549 49.549,-14.549c5.843,0 11.219,0.234 16.127,0.701c4.908,0.467 9.368,1.052 13.38,1.753c4.012,0.701 9.641,2.026 16.886,3.973l0,42.654c-14.101,-7.713 -27.968,-11.569 -41.602,-11.569c-5.609,0 -10.128,1.052 -13.556,3.155c-3.428,2.103 -5.142,4.986 -5.142,8.648c0,3.506 1.383,6.408 4.149,8.706c2.766,2.298 8.55,5.278 17.354,8.94c17.373,7.012 29.663,14.685 36.869,23.021c7.206,8.336 10.81,18.23 10.81,29.682Z"/>
      </svg>

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
