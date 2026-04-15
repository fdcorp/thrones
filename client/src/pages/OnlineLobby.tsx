import { useState } from 'react';
import { useLang } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { useOnlineStore } from '@/hooks/useSocket';
import styles from './OnlineLobby.module.css';

import { Player } from '@/engine/types';

interface OnlineLobbyProps {
  onGameReady: () => void;
  onBack: () => void;
  createRoom: (preferredSlot?: Player) => Promise<void>;
  joinRoom: (code: string) => Promise<void>;
  joinQueue: (ranked: boolean) => Promise<void>;
  leaveQueue: () => void;
}

export function OnlineLobby({ onGameReady: _onGameReady, onBack, createRoom, joinRoom, joinQueue, leaveQueue }: OnlineLobbyProps) {
  const t       = useLang();
  const user    = useAuthStore(s => s.user);
  const online  = useOnlineStore();

  const [joinCode, setJoinCode]           = useState('');
  const [copied, setCopied]               = useState(false);
  const [isLoading, setIsLoading]         = useState(false);
  const [showColorPick, setShowColorPick] = useState(false);
  const [showMatchPick, setShowMatchPick] = useState(false);

  async function handleColorPicked(choice: Player | 'random') {
    const slot = choice === 'random'
      ? (Math.random() < 0.5 ? Player.P1 : Player.P2)
      : choice;
    setShowColorPick(false);
    setIsLoading(true);
    online.reset();
    try {
      await createRoom(slot);
      online.setStatus('creating');
    } catch {
      online.setError(t.online.mustBeLoggedIn);
      setIsLoading(false);
    }
  }

  async function handleMatchmaking(ranked: boolean) {
    if (!user) return;
    setShowMatchPick(false);
    setIsLoading(true);
    online.reset();
    try {
      await joinQueue(ranked);
      online.setStatus('searching');
    } catch {
      online.setError(t.online.mustBeLoggedIn);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancelMatchmaking() {
    leaveQueue();
    online.reset();
  }

  async function handleJoin() {
    if (!user || !joinCode.trim()) return;
    setIsLoading(true);
    online.reset();
    try {
      await joinRoom(joinCode.trim().toUpperCase());
    } catch {
      online.setError(t.online.mustBeLoggedIn);
      setIsLoading(false);
    }
  }

  function handleCopy() {
    if (!online.roomCode) return;
    navigator.clipboard.writeText(online.roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Not logged in
  if (!user) {
    return (
      <div className={styles.card}>
        <div className={styles.title}>{t.online.createRoom}</div>
        <p className={styles.notLoggedIn}>{t.online.mustBeLoggedIn}</p>
        <button className={styles.btnGhost} onClick={onBack}>
          <svg viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {t.aiConfig.back}
        </button>
      </div>
    );
  }

  // Color pick before creating room
  if (showColorPick) {
    return (
      <div className={styles.card}>
        <div className={styles.title}>CHOISIR SA COULEUR</div>
        <button className={styles.btnPrimary} onClick={() => handleColorPicked(Player.P1)}>
          ♔ OR — Jouer en premier
        </button>
        <button className={styles.btnSecondary} onClick={() => handleColorPicked(Player.P2)}>
          ♔ ARGENT — Jouer en deuxième
        </button>
        <button className={styles.btnSecondary} onClick={() => handleColorPicked('random')}>
          ⚄ ALÉATOIRE
        </button>
        <button className={styles.btnGhost} onClick={() => setShowColorPick(false)}>
          <svg viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Retour
        </button>
      </div>
    );
  }

  // Matchmaking mode pick
  if (showMatchPick) {
    return (
      <div className={styles.card}>
        <div className={styles.title}>MATCHMAKING</div>
        <button className={styles.btnPrimary} onClick={() => handleMatchmaking(false)}>
          🎲 FOR FUN
        </button>
        <button className={styles.btnSecondary} onClick={() => handleMatchmaking(true)}>
          <span>⚔️ RANKED</span>
          <span className={styles.eloTag}>{user.elo} ELO</span>
        </button>
        <button className={styles.btnGhost} onClick={() => setShowMatchPick(false)}>
          <svg viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {t.aiConfig.back}
        </button>
      </div>
    );
  }

  // Matchmaking — searching for opponent
  if (online.status === 'searching') {
    return (
      <div className={styles.card}>
        <div className={styles.title}>MATCHMAKING</div>
        <div className={styles.waiting}>
          <span className={styles.waitingDots} />
        </div>
        <p className={styles.subtitle}>Recherche d'un adversaire en cours...</p>
        <button className={styles.btnGhost} onClick={handleCancelMatchmaking}>
          <svg viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Annuler
        </button>
      </div>
    );
  }

  // Error state — connection failed while trying to match
  if (online.status === 'idle' && online.error) {
    return (
      <div className={styles.card}>
        <div className={styles.title}>MATCHMAKING</div>
        <div className={styles.error}>{online.error}</div>
        <button className={styles.btnGhost} onClick={() => { online.reset(); }}>
          <svg viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {t.aiConfig.back}
        </button>
      </div>
    );
  }

  // Waiting for opponent after creating room
  if (online.status === 'waiting' && online.roomCode) {
    return (
      <div className={styles.card}>
        <div className={styles.title}>{t.online.waitingForOpponent}</div>
        <div className={styles.codeDisplay}>
          <span className={styles.codeLabel}>{t.online.roomCode}</span>
          <span className={styles.codeValue}>{online.roomCode}</span>
          <button className={styles.copyBtn} onClick={handleCopy}>
            {copied ? t.online.codeCopied : t.online.copyCode}
          </button>
        </div>
        <div className={styles.waiting}>
          <span className={styles.waitingDots} />
        </div>
        <button className={styles.btnGhost} onClick={() => { online.reset(); setIsLoading(false); }}>
          {t.aiConfig.back}
        </button>
      </div>
    );
  }

  // Default lobby
  return (
    <div className={styles.card}>
      <div className={styles.title}>ONLINE</div>

      {online.error && <div className={styles.error}>{online.error}</div>}

      <button className={styles.btnPrimary} onClick={() => setShowMatchPick(true)} disabled={isLoading}>
        MATCHMAKING
      </button>

      <div className={styles.orDivider}><span>ou</span></div>

      <button className={styles.btnSecondary} onClick={() => setShowColorPick(true)} disabled={isLoading}>
        {t.online.createRoom}
      </button>

      <div className={styles.orDivider}><span>ou</span></div>

      <div className={styles.codeInputRow}>
        <input
          className={styles.codeInput}
          type="text"
          value={joinCode}
          onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="ABC123"
          maxLength={6}
        />
        <button
          className={styles.btnSecondary}
          style={{ width: 'auto', padding: '0.8rem 1.2rem' }}
          onClick={handleJoin}
          disabled={isLoading || joinCode.length < 6}
        >
          {t.online.joinRoom}
        </button>
      </div>

      <button className={styles.btnGhost} onClick={onBack}>
        <svg viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        {t.aiConfig.back}
      </button>
    </div>
  );
}
