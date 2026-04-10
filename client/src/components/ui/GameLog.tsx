import { useEffect, useRef } from 'react';
import { Player, UnitType } from '@/engine/types';
import type { LogEntry } from '@/engine/types';
import { useLang } from '@/i18n';
import styles from './GameLog.module.css';

interface GameLogProps {
  entries: LogEntry[];
  turnNumber: number;
  mobileOpen?: boolean;
  onClose?: () => void;
}

function renderLogEntry(entry: LogEntry, t: ReturnType<typeof useLang>): string {
  const unitName = t.units[entry.unitType as UnitType];
  const unitPl   = t.playerLabel[entry.unitOwner as keyof typeof t.playerLabel];
  const tgtName  = entry.targetType ? t.units[entry.targetType as UnitType] : '';
  const tgtPl    = entry.targetOwner ? t.playerLabel[entry.targetOwner as keyof typeof t.playerLabel] : '';
  const q = entry.q ?? 0;
  const r = entry.r ?? 0;

  switch (entry.key) {
    case 'move':        return t.logEntries.move(unitName, unitPl, q, r);
    case 'capture':     return t.logEntries.capture(unitName, unitPl, tgtName, tgtPl);
    case 'throne_kill': return t.logEntries.throneKill(unitName, unitPl);
    case 'respawn':     return t.logEntries.respawn(unitName, unitPl, q, r);
    case 'grapple_stun':return t.logEntries.grappleStun(tgtName, tgtPl);
    case 'grapple_ally':return t.logEntries.grappleAlly(tgtName, tgtPl);
    default: return '';
  }
}

function CombatReminder({ label }: { label: string }) {
  return (
    <div className={styles.reminderSection}>
      <span className={styles.reminderTitle}>RAPPEL</span>
      <img
        src="/assets/fight_logic_vertical_white.png"
        className={styles.fightLogicImg}
        alt={label}
      />
    </div>
  );
}

export function GameLog({ entries, turnNumber, mobileOpen, onClose }: GameLogProps) {
  const t = useLang();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <div className={`${styles.panel} ${mobileOpen ? styles.mobileOpen : ''}`}>
      {/* ── Top half: log ── */}
      <div className={styles.logSection}>
        <div className={styles.header}>
          <span>{t.log.title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={styles.turnBadge}>{t.log.turnBadge(turnNumber)}</span>
            {onClose && (
              <button className={styles.closeBtn} onClick={onClose} aria-label="Close log">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className={styles.log}>
          {entries.length === 0 && (
            <span className={styles.empty}>{t.log.empty}</span>
          )}
          {entries.map((entry, i) => (
            <div key={i} className={styles.entry}>
              <span className={entry.player === Player.P1 ? styles.prefixP1 : styles.prefixP2}>
                [T.{entry.turn}]
              </span>
              {' '}{renderLogEntry(entry, t)}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Bottom half: combat reminder ── */}
      <CombatReminder label={t.log.combatReminder} />
    </div>
  );
}
