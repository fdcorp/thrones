import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import styles from './UserBadge.module.css';

interface UserBadgeProps {
  onLoginClick?: () => void;
}

export function UserBadge({ onLoginClick }: UserBadgeProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showConfirm, setShowConfirm] = useState(false);

  if (!user) {
    if (!onLoginClick) return null;
    return (
      <button
        className={styles.iconBtn}
        onClick={onLoginClick}
        aria-label="Connexion"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
        </svg>
      </button>
    );
  }

  return (
    <>
      <div className={styles.badge}>
        <button
          className={styles.badgeBtn}
          onClick={() => navigate(`/profile/${user.username}`)}
          title="Voir le profil"
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
        <button
          className={styles.iconBtn}
          onClick={() => setShowConfirm(true)}
          title="Déconnexion"
          aria-label="Déconnexion"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

      {showConfirm && (
        <div className={styles.confirmOverlay} onClick={() => setShowConfirm(false)}>
          <div className={styles.confirmCard} onClick={e => e.stopPropagation()}>
            <div className={styles.confirmTitle}>Déconnexion</div>
            <div className={styles.confirmText}>Êtes-vous sûr de vouloir vous déconnecter ?</div>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => setShowConfirm(false)}>Annuler</button>
              <button className={styles.confirmLogout} onClick={() => { logout(); setShowConfirm(false); }}>Se déconnecter</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
