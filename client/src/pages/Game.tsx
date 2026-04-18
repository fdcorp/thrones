import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { useUIStore } from '@/store/uiStore';
import { useAI } from '@/hooks/useAI';
import { useSounds } from '@/hooks/useSounds';
import { HexBoard } from '@/components/board/HexBoard';
import { AshParticles } from '@/components/board/AshParticles';
import { PlayerPanel } from '@/components/ui/PlayerPanel';
import { GameLog } from '@/components/ui/GameLog';
import { GameChat } from '@/components/ui/GameChat';
import { EndScreen } from '@/components/ui/EndScreen';
import { MatchIntro } from '@/components/ui/MatchIntro';
import { CustomPanel } from '@/components/ui/CustomPanel';
import { AIConfig } from '@/components/lobby/AIConfig';
import { OnlineLobby } from './OnlineLobby';
import { useSocket, useOnlineStore } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/authStore';
import { Player, GamePhase } from '@/engine/types';
import type { AILevel, GameMode, TurnAction } from '@/engine/types';
import { isMuted, setMuted, playMatchFound } from '@/utils/sounds';
import { useLang } from '@/i18n';
import colorStyles from './ColorSelect.module.css';
import { PageLogo } from '@/components/ui/PageLogo';
import styles from './Game.module.css';

export function Game() {
  const [params] = useSearchParams();
  const mode = (params.get('mode') ?? 'local') as GameMode;

  const [soundOn, setSoundOn] = useState(!isMuted());
  const [aiLevel, setAiLevel] = useState<AILevel | null>(null);
  const [humanPlayer, setHumanPlayer] = useState<Player | null>(null);
  const [showColorSelect, setShowColorSelect] = useState(mode !== 'online');
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [showOnlineLobby, setShowOnlineLobby] = useState(mode === 'online');
  const [showMobileLog, setShowMobileLog] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const gameState      = useGameStore(s => s.gameState);
  const startGame      = useGameStore(s => s.startGame);
  const resetGame      = useGameStore(s => s.resetGame);
  const surrender      = useGameStore(s => s.surrender);
  const undoLastMove   = useGameStore(s => s.undoLastMove);
  const previousState  = useGameStore(s => s.previousState);
  const aiThinking     = useGameStore(s => s.aiThinking);
  const clearSel        = useUIStore(s => s.clearSelection);
  const setBoardFlipped = useUIStore(s => s.setBoardFlipped);
  const boardFlipped    = useUIStore(s => s.boardFlipped);
  const autoRotate      = useUIStore(s => s.autoRotate);
  const setAutoRotate   = useUIStore(s => s.setAutoRotate);
  const navigate   = useNavigate();
  const t = useLang();

  const user   = useAuthStore(s => s.user);
  const online = useOnlineStore();
  const { setOnlineState, setOnlineDispatch } = useGameStore();

  // Chat — incoming message handler ref (set by GameChat)
  const chatHandlerRef = useRef<((username: string, text: string, timestamp: number) => void) | null>(null);
  const registerChatHandler = useCallback((fn: (username: string, text: string, timestamp: number) => void) => {
    chatHandlerRef.current = fn;
  }, []);

  // Socket lives here so it persists after OnlineLobby unmounts
  const { createRoom, joinRoom, joinQueue, leaveQueue, sendAction, sendSurrender, sendChatMessage, disconnect } = useSocket({
    onRoomJoined: (code, slot, opponentUsername, opponentElo, opponentInPlacement, ranked) => {
      online.setRoom(code, slot);
      online.setIsRanked(ranked ?? false);
      if (opponentUsername) {
        online.setOpponent(opponentUsername, opponentElo, opponentInPlacement);
        playMatchFound();
        // Trigger intro immediately on ROOM_JOINED — both players have slot + opponent info here
        useOnlineStore.getState().setShowIntro(true);
        setTimeout(() => useOnlineStore.getState().setShowIntro(false), 5000);
      } else {
        online.setStatus('waiting');
      }
    },
    onOpponentJoined: (opponentUsername) => {
      online.setOpponent(opponentUsername);
    },
    onGameState: (state) => {
      setOnlineState(state as Parameters<typeof setOnlineState>[0]);
      if (online.status === 'waiting' || online.status === 'creating' || online.status === 'searching') {
        online.setStatus('playing');
      }
      setShowOnlineLobby(false);
    },
    onError: (msg) => {
      online.setError(msg);
      // If error happens during lobby phase, return to lobby so the error is visible
      const s = useOnlineStore.getState().status;
      if (s !== 'playing') {
        useOnlineStore.getState().setStatus('idle');
      }
    },
    onPlayerDisconnected: () => {
      online.setStatus('disconnected');
    },
    onGameOver: (_winner, _isDraw, eloChange, newElo) => {
      online.setGameOver(eloChange, newElo);
      // Refresh full user profile so header shows updated ELO, rank, placement counter
      useAuthStore.getState().refreshMe();
    },
    onChatMessage: (username, text, timestamp) => {
      chatHandlerRef.current?.(username, text, timestamp);
    },
  });

  // Wire sendAction into game store — must be in useEffect, never during render
  useEffect(() => {
    if (mode !== 'online') return;
    setOnlineDispatch((action: TurnAction) => sendAction(action));
    return () => setOnlineDispatch(null);
  }, [mode, sendAction]);

  // Activate AI hook
  useAI();
  useSounds();

  const isOnlineMatch = !!gameState && gameState.phase === GamePhase.PLAYING;

  // Block browser back button during active match
  useEffect(() => {
    if (!isOnlineMatch) return;
    window.history.pushState(null, '', window.location.href);
    function handlePopState() {
      window.history.pushState(null, '', window.location.href);
      setShowLeaveConfirm(true);
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOnlineMatch]);

  // Block F5 / tab close
  useEffect(() => {
    if (!isOnlineMatch) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = ''; // required by Chrome/Firefox to show native dialog
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOnlineMatch]);

  // Flip board for P2 in online mode once slot is known
  useEffect(() => {
    if (mode === 'online' && online.mySlot) {
      setBoardFlipped(online.mySlot === Player.P2);
    }
  }, [mode, online.mySlot]);

  useEffect(() => {
    return () => {
      resetGame();
      clearSel();
    };
  }, []);

  // autoRotate is handled purely in HexBoard/UnitPiece — no board flip needed here

  const handleColorSelect = (choice: Player | 'random') => {
    const picked = choice === 'random'
      ? (Math.random() < 0.5 ? Player.P1 : Player.P2)
      : choice;
    setHumanPlayer(picked);
    setShowColorSelect(false);
    setBoardFlipped(picked === Player.P2);
    if (mode === 'ai') {
      setShowAIConfig(true);
    } else {
      startGame('local', undefined, picked);
    }
  };

  const handleAIConfirm = () => {
    if (!aiLevel || !humanPlayer) return;
    setShowAIConfig(false);
    startGame('ai', aiLevel, humanPlayer);
  };

  const handleReplay = () => {
    clearSel();
    setBoardFlipped(false);
    setAutoRotate(false);
    setShowColorSelect(true);
    setShowAIConfig(false);
    setAiLevel(null);
    setHumanPlayer(null);
    resetGame();
  };

  const handleFindMatch = () => {
    const wasRanked = useOnlineStore.getState().isRanked;
    resetGame();
    clearSel();
    online.reset();
    online.setStatus('searching');
    setShowOnlineLobby(true);
    joinQueue(wasRanked);
  };

  // Online lobby screen
  if (showOnlineLobby) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <PageLogo />
        </header>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <OnlineLobby
            onGameReady={() => setShowOnlineLobby(false)}
            onBack={() => navigate('/')}
            createRoom={createRoom}
            joinRoom={joinRoom}
            joinQueue={joinQueue}
            leaveQueue={leaveQueue}
          />
        </div>
      </div>
    );
  }

  // Color select screen
  if (showColorSelect) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <PageLogo />
        </header>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className={colorStyles.card}>
            <div className={colorStyles.title}>{t.game.chooseSide}</div>
            <div className={colorStyles.subtitle}>{t.game.chooseQuestion}</div>
            <div className={colorStyles.options}>
              <button className={`${colorStyles.option} ${colorStyles.optionGold}`} onClick={() => handleColorSelect(Player.P1)}>
                <span className={colorStyles.optionDot} style={{ background: 'var(--gold)', boxShadow: '0 0 10px rgba(201,168,76,0.8)' }} />
                <span className={colorStyles.optionName}>{t.game.gold}</span>
                <span className={colorStyles.optionDesc}>{t.game.goldDesc}</span>
              </button>
              <button className={`${colorStyles.option} ${colorStyles.optionSilver}`} onClick={() => handleColorSelect(Player.P2)}>
                <span className={colorStyles.optionDot} style={{ background: 'var(--silver)', boxShadow: '0 0 10px rgba(168,180,192,0.8)' }} />
                <span className={colorStyles.optionName}>{t.game.silver}</span>
                <span className={colorStyles.optionDesc}>{t.game.silverDesc}</span>
              </button>
              <button className={`${colorStyles.option} ${colorStyles.optionRandom}`} onClick={() => handleColorSelect('random')}>
                <span className={colorStyles.optionDot} style={{ background: 'linear-gradient(135deg, var(--gold), var(--silver))' }} />
                <span className={colorStyles.optionName}>{t.game.random}</span>
                <span className={colorStyles.optionDesc}>{t.game.randomDesc}</span>
              </button>
            </div>
            {mode === 'local' && (
              <button
                className={`${colorStyles.rotateToggle} ${autoRotate ? colorStyles.rotateToggleOn : ''}`}
                onClick={() => setAutoRotate(!autoRotate)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6"/>
                  <path d="M2.5 12a10 10 0 0 1 17-7.1L21.5 8"/>
                  <path d="M2.5 22v-6h6"/>
                  <path d="M21.5 12a10 10 0 0 1-17 7.1L2.5 16"/>
                </svg>
                <span>Rotation auto</span>
                <span className={colorStyles.rotateToggleBadge}>{autoRotate ? 'ON' : 'OFF'}</span>
              </button>
            )}
            <button className={colorStyles.backBtn} onClick={() => navigate('/')}>
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t.aiConfig.back}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // AI config screen
  if (showAIConfig) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
            <svg viewBox="0 0 1191 216" aria-label="THRONES" className={styles.headerTitle} fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M115.59,65.086l0,128.078l-50.717,0l0,-128.078l-46.861,0l0,-39.499l145.023,0l0,39.499l-47.445,0Z"/>
              <path d="M291.581,193.165l0,-62.52l-57.963,0l0,62.52l-50.483,0l0,-167.577l50.483,0l0,62.053l57.963,0l0,-62.053l50.483,0l0,167.577l-50.483,0Z"/>
              <path d="M462.079,193.165l-12.504,-36.11c-2.415,-7.09 -5.551,-12.66 -9.407,-16.711c-3.856,-4.051 -8.044,-6.077 -12.562,-6.077l-1.987,0l0,58.897l-50.483,0l0,-167.577l67.078,0c23.45,0 40.765,3.837 51.944,11.511c11.18,7.674 16.769,19.185 16.769,34.532c0,11.53 -3.253,21.191 -9.758,28.981c-6.505,7.791 -16.185,13.439 -29.04,16.945l0,0.467c7.09,2.181 12.991,5.726 17.704,10.634c4.713,4.908 8.94,12.192 12.679,21.853l16.477,42.654l-56.911,0Zm-4.791,-114.406c0,-5.609 -1.714,-10.05 -5.142,-13.322c-3.428,-3.272 -8.803,-4.908 -16.127,-4.908l-10.401,0l0,38.33l9.115,0c6.778,0 12.231,-1.909 16.36,-5.726c4.129,-3.817 6.194,-8.609 6.194,-14.374Z"/>
              <path d="M697.786,108.909c0,16.828 -3.623,31.883 -10.868,45.166c-7.245,13.283 -17.373,23.606 -30.384,30.968c-13.01,7.362 -27.579,11.043 -43.706,11.043c-15.737,0 -30.052,-3.564 -42.946,-10.693c-12.894,-7.128 -22.924,-17.139 -30.091,-30.033c-7.167,-12.894 -10.751,-27.482 -10.751,-43.764c0,-17.062 3.623,-32.409 10.868,-46.043c7.245,-13.634 17.412,-24.171 30.5,-31.611c13.088,-7.44 27.968,-11.16 44.64,-11.16c16.049,0 30.403,3.564 43.063,10.693c12.66,7.128 22.437,17.295 29.332,30.5c6.895,13.205 10.342,28.183 10.342,44.933Zm-48.166,41.864l11.854,-78.091l-31.116,33.698l-16.945,-42.256l-16.945,42.256l-31.116,-33.698l11.854,78.091l72.414,0Z"/>
              <path d="M838.602,193.165l-59.131,-80.867c-4.674,-6.388 -8.492,-12.153 -11.452,-17.295l-0.467,0c0.467,8.258 0.701,17.529 0.701,27.813l0,70.35l-46.744,0l0,-167.577l47.679,0l56.677,76.894c0.701,1.013 1.558,2.22 2.571,3.623c1.013,1.402 2.026,2.844 3.038,4.324c1.013,1.48 1.967,2.921 2.863,4.324c0.896,1.402 1.578,2.649 2.045,3.74l0.467,0c-0.467,-3.428 -0.701,-9.349 -0.701,-17.763l0,-75.141l46.744,0l0,167.577l-44.29,0Z"/>
              <path d="M915.846,193.165l0,-167.577l104.356,0l0,39.499l-53.872,0l0,24.424l50.6,0l0,39.499l-50.6,0l0,24.657l57.729,0l0,39.499l-108.212,0Z"/>
              <path d="M1164.291,142.447c0,11.141 -2.98,20.84 -8.94,29.098c-5.96,8.258 -14.315,14.413 -25.066,18.464c-10.751,4.051 -23.684,6.077 -38.797,6.077c-17.529,0 -33.578,-2.96 -48.146,-8.881l0,-45.926c7.012,5.142 14.763,9.29 23.255,12.446c8.492,3.155 16.399,4.733 23.723,4.733c5.531,0 9.816,-0.993 12.855,-2.98c3.038,-1.987 4.558,-4.889 4.558,-8.706c0,-2.727 -0.76,-5.122 -2.279,-7.187c-1.519,-2.065 -3.817,-3.993 -6.895,-5.785c-3.077,-1.792 -8.784,-4.246 -17.12,-7.362c-26.956,-10.362 -40.434,-27.112 -40.434,-50.25c0,-16.205 6.155,-29.157 18.464,-38.856c12.309,-9.699 28.825,-14.549 49.549,-14.549c5.843,0 11.219,0.234 16.127,0.701c4.908,0.467 9.368,1.052 13.38,1.753c4.012,0.701 9.641,2.026 16.886,3.973l0,42.654c-14.101,-7.713 -27.968,-11.569 -41.602,-11.569c-5.609,0 -10.128,1.052 -13.556,3.155c-3.428,2.103 -5.142,4.986 -5.142,8.648c0,3.506 1.383,6.408 4.149,8.706c2.766,2.298 8.55,5.278 17.354,8.94c17.373,7.012 29.663,14.685 36.869,23.021c7.206,8.336 10.81,18.23 10.81,29.682Z"/>
            </svg>
        </header>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AIConfig
            selected={aiLevel}
            onSelect={setAiLevel}
            onConfirm={handleAIConfirm}
            onBack={() => navigate('/')}
          />
        </div>
      </div>
    );
  }

  if (!gameState) return null;

  const isEnded = gameState.phase === GamePhase.ENDED;
  // In online mode use mySlot, otherwise use humanPlayer choice
  const effectiveHuman = mode === 'online' ? (online.mySlot ?? Player.P1) : (humanPlayer ?? Player.P1);
  const topPlayer    = effectiveHuman === Player.P2 ? Player.P1 : Player.P2;
  const bottomPlayer = effectiveHuman === Player.P2 ? Player.P2 : Player.P1;

  // Online player names
  const myName       = user?.username ?? undefined;
  const opponentName = online.opponentUsername ?? undefined;
  const mySlot       = online.mySlot;
  const nameForPlayer = (p: Player): string | undefined => {
    if (mode !== 'online') return undefined;
    // Fall back to effectiveHuman if mySlot hasn't been set yet
    const resolvedSlot = mySlot ?? effectiveHuman;
    return p === resolvedSlot ? myName : opponentName;
  };
  const eloForPlayer = (p: Player): number | null => {
    if (mode !== 'online') return null;
    const resolvedSlot = mySlot ?? effectiveHuman;
    return p === resolvedSlot ? (user?.elo ?? null) : (online.opponentElo ?? null);
  };
  const inPlacementForPlayer = (p: Player): boolean => {
    if (mode !== 'online') return false;
    const resolvedSlot = mySlot ?? effectiveHuman;
    return p === resolvedSlot ? (user?.rank?.isInPlacement ?? false) : online.opponentInPlacement;
  };

  return (
    <div className={styles.page}>

      {/* Pre-match intro — overlay for 3s when online game starts */}
      {mode === 'online' && online.showIntro && user && online.opponentUsername && (
        <MatchIntro
          myUsername={user.username}
          myElo={user.elo}
          myInPlacement={user.rank?.isInPlacement ?? false}
          mySlot={mySlot ?? Player.P1}
          opponentUsername={online.opponentUsername}
          opponentElo={online.opponentElo}
          opponentInPlacement={online.opponentInPlacement}
        />
      )}

      <header className={styles.header}>
        <svg viewBox="0 0 1191 216" aria-label="THRONES" className={styles.headerTitle} fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M115.59,65.086l0,128.078l-50.717,0l0,-128.078l-46.861,0l0,-39.499l145.023,0l0,39.499l-47.445,0Z"/>
          <path d="M291.581,193.165l0,-62.52l-57.963,0l0,62.52l-50.483,0l0,-167.577l50.483,0l0,62.053l57.963,0l0,-62.053l50.483,0l0,167.577l-50.483,0Z"/>
          <path d="M462.079,193.165l-12.504,-36.11c-2.415,-7.09 -5.551,-12.66 -9.407,-16.711c-3.856,-4.051 -8.044,-6.077 -12.562,-6.077l-1.987,0l0,58.897l-50.483,0l0,-167.577l67.078,0c23.45,0 40.765,3.837 51.944,11.511c11.18,7.674 16.769,19.185 16.769,34.532c0,11.53 -3.253,21.191 -9.758,28.981c-6.505,7.791 -16.185,13.439 -29.04,16.945l0,0.467c7.09,2.181 12.991,5.726 17.704,10.634c4.713,4.908 8.94,12.192 12.679,21.853l16.477,42.654l-56.911,0Zm-4.791,-114.406c0,-5.609 -1.714,-10.05 -5.142,-13.322c-3.428,-3.272 -8.803,-4.908 -16.127,-4.908l-10.401,0l0,38.33l9.115,0c6.778,0 12.231,-1.909 16.36,-5.726c4.129,-3.817 6.194,-8.609 6.194,-14.374Z"/>
          <path d="M697.786,108.909c0,16.828 -3.623,31.883 -10.868,45.166c-7.245,13.283 -17.373,23.606 -30.384,30.968c-13.01,7.362 -27.579,11.043 -43.706,11.043c-15.737,0 -30.052,-3.564 -42.946,-10.693c-12.894,-7.128 -22.924,-17.139 -30.091,-30.033c-7.167,-12.894 -10.751,-27.482 -10.751,-43.764c0,-17.062 3.623,-32.409 10.868,-46.043c7.245,-13.634 17.412,-24.171 30.5,-31.611c13.088,-7.44 27.968,-11.16 44.64,-11.16c16.049,0 30.403,3.564 43.063,10.693c12.66,7.128 22.437,17.295 29.332,30.5c6.895,13.205 10.342,28.183 10.342,44.933Zm-48.166,41.864l11.854,-78.091l-31.116,33.698l-16.945,-42.256l-16.945,42.256l-31.116,-33.698l11.854,78.091l72.414,0Z"/>
          <path d="M838.602,193.165l-59.131,-80.867c-4.674,-6.388 -8.492,-12.153 -11.452,-17.295l-0.467,0c0.467,8.258 0.701,17.529 0.701,27.813l0,70.35l-46.744,0l0,-167.577l47.679,0l56.677,76.894c0.701,1.013 1.558,2.22 2.571,3.623c1.013,1.402 2.026,2.844 3.038,4.324c1.013,1.48 1.967,2.921 2.863,4.324c0.896,1.402 1.578,2.649 2.045,3.74l0.467,0c-0.467,-3.428 -0.701,-9.349 -0.701,-17.763l0,-75.141l46.744,0l0,167.577l-44.29,0Z"/>
          <path d="M915.846,193.165l0,-167.577l104.356,0l0,39.499l-53.872,0l0,24.424l50.6,0l0,39.499l-50.6,0l0,24.657l57.729,0l0,39.499l-108.212,0Z"/>
          <path d="M1164.291,142.447c0,11.141 -2.98,20.84 -8.94,29.098c-5.96,8.258 -14.315,14.413 -25.066,18.464c-10.751,4.051 -23.684,6.077 -38.797,6.077c-17.529,0 -33.578,-2.96 -48.146,-8.881l0,-45.926c7.012,5.142 14.763,9.29 23.255,12.446c8.492,3.155 16.399,4.733 23.723,4.733c5.531,0 9.816,-0.993 12.855,-2.98c3.038,-1.987 4.558,-4.889 4.558,-8.706c0,-2.727 -0.76,-5.122 -2.279,-7.187c-1.519,-2.065 -3.817,-3.993 -6.895,-5.785c-3.077,-1.792 -8.784,-4.246 -17.12,-7.362c-26.956,-10.362 -40.434,-27.112 -40.434,-50.25c0,-16.205 6.155,-29.157 18.464,-38.856c12.309,-9.699 28.825,-14.549 49.549,-14.549c5.843,0 11.219,0.234 16.127,0.701c4.908,0.467 9.368,1.052 13.38,1.753c4.012,0.701 9.641,2.026 16.886,3.973l0,42.654c-14.101,-7.713 -27.968,-11.569 -41.602,-11.569c-5.609,0 -10.128,1.052 -13.556,3.155c-3.428,2.103 -5.142,4.986 -5.142,8.648c0,3.506 1.383,6.408 4.149,8.706c2.766,2.298 8.55,5.278 17.354,8.94c17.373,7.012 29.663,14.685 36.869,23.021c7.206,8.336 10.81,18.23 10.81,29.682Z"/>
        </svg>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Log toggle — visible on mobile only via CSS */}
          <button
            className={styles.logToggleBtn}
            onClick={() => setShowMobileLog(v => !v)}
            aria-label="Toggle log"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            LOG
          </button>
          {mode === 'local' && (
            <button
              className={`${styles.muteBtn} ${autoRotate ? styles.muteBtnActive : ''}`}
              onClick={() => setAutoRotate(!autoRotate)}
              title={autoRotate ? 'Désactiver la rotation auto' : 'Activer la rotation auto'}
              aria-label="Rotation auto"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6"/>
                <path d="M2.5 12a10 10 0 0 1 17-7.1L21.5 8"/>
                <path d="M2.5 22v-6h6"/>
                <path d="M21.5 12a10 10 0 0 1-17 7.1L2.5 16"/>
              </svg>
            </button>
          )}
          <button
            className={styles.muteBtn}
            onClick={() => setShowCustom(v => !v)}
            title={t.game.customize}
            aria-label="Customize"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          <button
            className={styles.muteBtn}
            onClick={() => { const next = !soundOn; setSoundOn(next); setMuted(!next); }}
            title={soundOn ? t.game.mute : t.game.unmute}
          >
            {soundOn ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      <div className={styles.gameArea}>
        {/* Left column: opponent on top, human on bottom */}
        <div className={styles.sideLeft}>
          <PlayerPanel
            player={topPlayer}
            gameState={gameState}
            isActive={gameState.currentPlayer === topPlayer && !aiThinking}
            playerName={nameForPlayer(topPlayer)}
            playerElo={eloForPlayer(topPlayer)}
            playerInPlacement={inPlacementForPlayer(topPlayer)}
          />
          {/* ── Action buttons ── */}
          <div className={styles.actionZone}>
            <button
              className={styles.actionBtn}
              onClick={undoLastMove}
              disabled={!previousState || aiThinking}
              title={t.game.undoTitle}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9h13a5 5 0 0 1 0 10H9" />
                <polyline points="3 5 3 9 7 9" />
              </svg>
              <span>{t.game.undo}</span>
            </button>
            <button
              className={`${styles.actionBtn} ${styles.abandonBtn}`}
              onClick={() => {
                if (gameState.phase !== GamePhase.PLAYING) return;
                setShowSurrenderConfirm(true);
              }}
              disabled={aiThinking}
              title={t.game.surrenderTitle}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="3" x2="4" y2="21" />
                <path d="M4 4h12l-3.5 4.5L16 13H4" />
              </svg>
              <span>{t.game.surrender}</span>
            </button>

            {showSurrenderConfirm && (
              <div className={styles.surrenderOverlay} onClick={() => setShowSurrenderConfirm(false)}>
                <div className={styles.surrenderDialog} onClick={e => e.stopPropagation()}>
                  <p className={styles.surrenderQuestion}>Êtes-vous sûr de vouloir abandonner ?</p>
                  <div className={styles.surrenderActions}>
                    <button
                      className={`${styles.surrenderBtn} ${styles.surrenderBtnConfirm}`}
                      onClick={() => {
                        setShowSurrenderConfirm(false);
                        if (mode === 'online') sendSurrender(); else surrender();
                      }}
                    >
                      Abandonner
                    </button>
                    <button
                      className={`${styles.surrenderBtn} ${styles.surrenderBtnCancel}`}
                      onClick={() => setShowSurrenderConfirm(false)}
                    >
                      Continuer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <PlayerPanel
            player={bottomPlayer}
            gameState={gameState}
            isActive={gameState.currentPlayer === bottomPlayer && !aiThinking}
            playerName={nameForPlayer(bottomPlayer)}
            playerElo={eloForPlayer(bottomPlayer)}
            playerInPlacement={inPlacementForPlayer(bottomPlayer)}
          />
        </div>

        {/* Leave confirmation — triggered by browser back / router navigation */}
        {showLeaveConfirm && (
          <div className={styles.surrenderOverlay} onClick={() => setShowLeaveConfirm(false)}>
            <div className={styles.surrenderDialog} onClick={e => e.stopPropagation()}>
              <p className={styles.surrenderQuestion}>
                ⚠️ Vous êtes sur le point de quitter la partie.<br />
                <span style={{ fontWeight: 300, fontSize: '0.78rem', opacity: 0.7 }}>
                  Votre adversaire sera déclaré vainqueur.
                </span>
              </p>
              <div className={styles.surrenderActions}>
                <button
                  className={`${styles.surrenderBtn} ${styles.surrenderBtnConfirm}`}
                  onClick={() => { setShowLeaveConfirm(false); sendSurrender(); navigate('/'); }}
                >
                  Quitter
                </button>
                <button
                  className={`${styles.surrenderBtn} ${styles.surrenderBtnCancel}`}
                  onClick={() => setShowLeaveConfirm(false)}
                >
                  Rester
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Board */}
        <div className={`${styles.boardWrapper} ${
          !boardFlipped
            ? (gameState.currentPlayer === Player.P1 ? styles.boardWrapperP1 : styles.boardWrapperP2)
            : (gameState.currentPlayer === Player.P1 ? styles.boardWrapperP1Flipped : styles.boardWrapperP2Flipped)
        }`}>
          <AshParticles player={gameState.currentPlayer} flipped={boardFlipped} />
          {/* Rappel hover button */}
          <div className={styles.rappelBtn}>
            <span>?</span>
            <img
              src="/assets/fight_logic_vertical_white.png"
              className={styles.rappelPopup}
              alt="Rappel des règles"
            />
          </div>
          {isEnded && (
            <EndScreen
              winner={gameState.winner}
              isDraw={gameState.isDraw}
              drawReason={gameState.drawReason}
              mySlot={mode === 'online' ? online.mySlot : null}
              winnerName={
                gameState.winner == null ? undefined :
                mode === 'online'
                  ? (gameState.winner === online.mySlot ? (user?.username ?? undefined) : (online.opponentUsername ?? undefined))
                  : (gameState.winner === Player.P1 ? t.panel.player1 : t.panel.player2)
              }
              winnerLabel={(() => {
                if (mode !== 'ai' || gameState.winner == null) return undefined;
                const botPlayer = humanPlayer === Player.P1 ? Player.P2 : Player.P1;
                if (gameState.winner !== botPlayer) return undefined;
                const labels: Record<string, string> = {
                  easy: 'BOT FACILE', medium: 'BOT MOYEN',
                  hard: 'BOT DIFFICILE', expert: 'BOT EXPERT',
                };
                return aiLevel ? labels[aiLevel] : 'BOT';
              })()}
              onReplay={handleReplay}
              onFindMatch={mode === 'online' ? handleFindMatch : undefined}
              isRanked={online.isRanked}
              eloChange={mode === 'online' ? online.eloChange : null}
            />
          )}
          <HexBoard localPlayer={mode === 'online' ? online.mySlot : null} />
        </div>

        {/* Right column: Game Log + Chat (online only) */}
        <div className={styles.rightCol}>
          <GameLog
            entries={gameState.log}
            turnNumber={gameState.turnNumber}
            mobileOpen={showMobileLog}
            onClose={() => setShowMobileLog(false)}
            hideRappel={mode === 'online'}
          />
          {mode === 'online' && user && (
            <GameChat
              myUsername={user.username}
              sendChatMessage={sendChatMessage}
              onMessage={registerChatHandler}
            />
          )}
        </div>
      </div>

      <CustomPanel open={showCustom} onClose={() => setShowCustom(false)} />
    </div>
  );
}
