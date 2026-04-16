import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiResetPassword } from '@/lib/api';
import styles from './AuthPage.module.css';

export function ResetPassword() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const token      = params.get('token') ?? '';

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      await apiResetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.title}>Invalid link</div>
        <button className={styles.btn} onClick={() => navigate('/')}>Back to menu</button>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.title}>
          {done ? '✓ Password updated' : 'NEW PASSWORD'}
        </div>

        {done ? (
          <>
            <p className={styles.desc}>Your password has been reset. You can now sign in.</p>
            <button className={styles.btn} onClick={() => navigate('/')}>Sign in</button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.field}>
              <label className={styles.label}>New password</label>
              <input
                className={styles.input}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Confirm password</label>
              <input
                className={styles.input}
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button className={styles.btn} type="submit" disabled={loading}>
              {loading ? '…' : 'RESET PASSWORD'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
