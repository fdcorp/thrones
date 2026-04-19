import { useState } from 'react';
import { useLang } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { useOnlineStore } from '@/hooks/useSocket';
import styles from './OnlineLobby.module.css';
import colorStyles from './ColorSelect.module.css';

import { Player } from '@/engine/types';

interface OnlineLobbyProps {
  onGameReady: () => void;
  onBack: () => void;
  createRoom: (preferredSlot?: Player, timerEnabled?: boolean) => Promise<void>;
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
  const [showCustom, setShowCustom]       = useState(false);
  const [timerEnabled, setTimerEnabled]   = useState(false);

  async function handleColorPicked(choice: Player | 'random') {
    const slot = choice === 'random'
      ? (Math.random() < 0.5 ? Player.P1 : Player.P2)
      : choice;
    setShowColorPick(false);
    setIsLoading(true);
    online.reset();
    try {
      await createRoom(slot, timerEnabled);
      online.setStatus('creating');
    } catch {
      online.setError(t.online.mustBeLoggedIn);
      setIsLoading(false);
    }
  }

  async function handleMatchmaking(ranked: boolean) {
    if (!user) return;
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
      <div className={colorStyles.card}>
        <div className={colorStyles.title}>{t.game.chooseSide}</div>
        <div className={colorStyles.subtitle}>{t.game.chooseQuestion}</div>
        <div className={colorStyles.options}>
          <button className={`${colorStyles.option} ${colorStyles.optionGold}`} onClick={() => handleColorPicked(Player.P1)}>
            <span className={colorStyles.optionDot} style={{ background: 'var(--gold)', boxShadow: '0 0 10px rgba(201,168,76,0.8)' }} />
            <span className={colorStyles.optionName}>{t.game.gold}</span>
            <span className={colorStyles.optionDesc}>{t.game.goldDesc}</span>
          </button>
          <button className={`${colorStyles.option} ${colorStyles.optionSilver}`} onClick={() => handleColorPicked(Player.P2)}>
            <span className={colorStyles.optionDot} style={{ background: 'var(--silver)', boxShadow: '0 0 10px rgba(168,180,192,0.8)' }} />
            <span className={colorStyles.optionName}>{t.game.silver}</span>
            <span className={colorStyles.optionDesc}>{t.game.silverDesc}</span>
          </button>
          <button className={`${colorStyles.option} ${colorStyles.optionRandom}`} onClick={() => handleColorPicked('random')}>
            <span className={colorStyles.optionDot} style={{ background: 'linear-gradient(135deg, var(--gold), var(--silver))' }} />
            <span className={colorStyles.optionName}>{t.game.random}</span>
            <span className={colorStyles.optionDesc}>{t.game.randomDesc}</span>
          </button>
        </div>
        <button className={colorStyles.backBtn} onClick={() => setShowColorPick(false)}>
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

  // Custom game sub-screen (create room or join by code)
  if (showCustom) {
    return (
      <div className={styles.card}>
        <div className={styles.title}>{t.online.customGame}</div>

        {online.error && <div className={styles.error}>{online.error}</div>}

        <button
          className={styles.timerToggle}
          onClick={() => setTimerEnabled(v => !v)}
          type="button"
        >
          <span className={`${styles.timerDot} ${timerEnabled ? styles.timerDotOn : ''}`} />
          <span>Chrono 10 min + 10s/coup</span>
          <span className={`${styles.timerBadge} ${timerEnabled ? styles.timerBadgeOn : ''}`}>{timerEnabled ? 'ON' : 'OFF'}</span>
        </button>

        <button className={styles.btnPrimary} onClick={() => setShowColorPick(true)} disabled={isLoading}>
          {t.online.createRoom}
        </button>

        <div className={styles.orDivider}><span>{t.online.orDivider}</span></div>

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
            className={`${styles.btnSecondary} ${styles.joinBtn}`}
            style={{ padding: '0.8rem 1.2rem' }}
            onClick={handleJoin}
            disabled={isLoading || joinCode.length < 6}
          >
            {t.online.joinRoom}
          </button>
        </div>

        <button className={styles.btnGhost} onClick={() => { setShowCustom(false); online.reset(); }}>
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
        <p className={styles.subtitle}>{t.online.searchingOpponent}</p>
        <button className={styles.btnGhost} onClick={handleCancelMatchmaking}>
          <svg viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {t.online.cancelSearch}
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

  // Default lobby — 3 buttons
  return (
    <div className={styles.card}>
      <div className={styles.title}>ONLINE</div>

      {online.error && <div className={styles.error}>{online.error}</div>}

      <button className={styles.btnRanked} onClick={() => handleMatchmaking(true)} disabled={isLoading}>
        <span>{t.online.rankedMode}</span>
        <span className={styles.eloTag}>
          {user.rank?.isInPlacement
            ? `Placement ${10 - (user.rank.provisionalGamesLeft ?? 10)}/10`
            : `${user.elo} ELO`}
        </span>
      </button>

      <button className={styles.btnCasual} onClick={() => handleMatchmaking(false)} disabled={isLoading}>
        {t.online.casualMode}
      </button>

      <button className={styles.btnCustom} onClick={() => setShowCustom(true)} disabled={isLoading}>
        {t.online.customGame}
      </button>

      <button className={styles.btnGhost} onClick={onBack}>
        <svg viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        {t.aiConfig.back}
      </button>
    </div>
  );
}
