import { useState } from 'react';
import styles from './ContactModal.module.css';

interface Props {
  onClose: () => void;
}

export function ContactModal({ onClose }: Props) {
  const [email,   setEmail]   = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status,  setStatus]  = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errMsg,  setErrMsg]  = useState('');

  const canSend = email.trim() && subject.trim() && message.trim() && status === 'idle';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), subject: subject.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setErrMsg(data.error ?? 'Error'); setStatus('error'); return; }
      setStatus('sent');
    } catch {
      setErrMsg('Network error.');
      setStatus('error');
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>CONTACT</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {status === 'sent' ? (
          <div className={styles.successMsg}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Message envoyé. Nous vous répondrons dès que possible.
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.label}>Votre email</label>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              maxLength={200}
              required
            />

            <label className={styles.label}>Objet</label>
            <input
              className={styles.input}
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Sujet de votre message"
              maxLength={120}
              required
            />

            <label className={styles.label}>Message</label>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Votre message…"
              maxLength={2000}
              required
            />

            {status === 'error' && <p className={styles.errorMsg}>{errMsg}</p>}

            <button
              className={styles.sendBtn}
              type="submit"
              disabled={!canSend}
            >
              {status === 'sending' ? 'Envoi…' : 'ENVOYER'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
