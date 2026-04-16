import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiVerifyEmail } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import styles from './AuthPage.module.css';

export function VerifyEmail() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const refreshMe  = useAuthStore(s => s.refreshMe);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); return; }
    apiVerifyEmail(token)
      .then(() => { refreshMe(); setStatus('ok'); })
      .catch(() => setStatus('error'));
  }, [params]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.title}>
          {status === 'loading' && 'Verifying…'}
          {status === 'ok'      && '✓ Email verified'}
          {status === 'error'   && 'Invalid link'}
        </div>
        {status === 'ok' && (
          <p className={styles.desc}>Your account is now verified. You can sign in.</p>
        )}
        {status === 'error' && (
          <p className={styles.desc}>This link is invalid or has expired.</p>
        )}
        <button className={styles.btn} onClick={() => navigate('/')}>
          Back to menu
        </button>
      </div>
    </div>
  );
}
