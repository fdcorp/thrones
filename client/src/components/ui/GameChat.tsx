import { useState, useEffect, useRef } from 'react';
import styles from './GameChat.module.css';

const URL_RE = /https?:\/\/\S+|www\.\S+|\S+\.\S{2,}\/\S*/i;

interface ChatMsg {
  username: string;
  text: string;
  timestamp: number;
  isMine: boolean;
}

interface GameChatProps {
  myUsername: string;
  sendChatMessage: (text: string) => void;
  onMessage: (handler: (username: string, text: string, timestamp: number) => void) => void;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function GameChat({ myUsername, sendChatMessage, onMessage, mobileOpen, onClose }: GameChatProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput]       = useState('');
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onMessage((username, text, timestamp) => {
      setMessages(prev => [...prev, { username, text, timestamp, isMine: false }]);
    });
  }, [onMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const hasLink    = URL_RE.test(input);
  const canSend    = input.trim().length > 0 && !hasLink;

  const submit = () => {
    if (!canSend) return;
    const text = input.trim().slice(0, 200);
    sendChatMessage(text);
    setMessages(prev => [...prev, { username: myUsername, text, timestamp: Date.now(), isMine: true }]);
    setInput('');
  };

  return (
    <div className={`${styles.panel} ${mobileOpen ? styles.mobileOpen : ''}`}>
      <div className={styles.header}>
        CHAT
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      <div className={styles.messages}>
        {messages.length === 0 && (
          <span className={styles.empty}>Aucun message…</span>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`${styles.msg} ${m.isMine ? styles.mine : styles.theirs}`}>
            <span className={styles.msgUser}>{m.username}</span>
            <span className={styles.msgText}>{m.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputRow}>
        <input
          className={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Message…"
          maxLength={200}
        />
        <button className={styles.sendBtn} onClick={submit} disabled={!canSend}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
