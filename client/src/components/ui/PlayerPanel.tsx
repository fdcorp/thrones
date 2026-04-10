import { Player, UnitType, TowerState } from '@/engine/types';
import type { GameState, Unit } from '@/engine/types';
import { useUIStore } from '@/store/uiStore';
import { getLegalRespawnHexes } from '@/engine/respawn';
import { useLang } from '@/i18n';
import styles from './PlayerPanel.module.css';

const UNIT_ICONS: Record<UnitType, string> = {
  [UnitType.SHIELD]:  '/assets/units/Bouclier.svg',
  [UnitType.RAM]:     '/assets/units/Belier.svg',
  [UnitType.WARRIOR]: '/assets/units/Guerrier.svg',
  [UnitType.HOOK]:    '/assets/units/Grappin.svg',
};

interface PlayerPanelProps {
  player: Player;
  gameState: GameState;
  isActive: boolean;
}

export function PlayerPanel({ player, gameState, isActive }: PlayerPanelProps) {
  const ui = useUIStore();
  const t = useLang();
  const isP1 = player === Player.P1;
  const capturedMine = gameState.capturedUnits.filter(cu => cu.unit.owner === player);
  const capturedRespawnable = capturedMine.filter(cu => cu.unit.type !== UnitType.HOOK);
  const capturedHooks = capturedMine.filter(cu => cu.unit.type === UnitType.HOOK);
  const canRespawn = isActive && getLegalRespawnHexes(gameState.board, player).length > 0;
  const hasCapturedRespawnable = capturedRespawnable.length > 0;
  const playerTowers = gameState.board.towers.filter(t => t.owner === player);
  const legalRespawnHexes = getLegalRespawnHexes(gameState.board, player);
  const allTowersBlocked = hasCapturedRespawnable && playerTowers.length > 0 && playerTowers.every(t => t.state === TowerState.BLOCKED);
  const showRespawnAvailable = hasCapturedRespawnable && legalRespawnHexes.length > 0;
  const towersAllBlocked = isActive && allTowersBlocked;

  const handleRespawnClick = (unit: Unit) => {
    if (!canRespawn) return;
    const hexes = getLegalRespawnHexes(gameState.board, player);
    ui.setRespawnMode(unit.id, hexes);
  };

  return (
    <div className={`${styles.panel} ${isP1 ? styles.p1 : styles.p2} ${isActive ? styles.active : ''}`}>
      <div className={styles.header}>
        <span className={styles.dot} />
        <span className={styles.name}>
          {isP1 ? t.panel.player1 : t.panel.player2}
        </span>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <span className={styles.label}>
          {t.panel.captured(capturedMine.length)}
        </span>
        <div className={styles.units}>
          {capturedRespawnable.map(({ unit }) => (
            <div
              key={unit.id}
              className={`${styles.unitSlot} ${canRespawn ? styles.respawnable : ''}`}
              title={t.units[unit.type]}
              onClick={() => handleRespawnClick(unit)}
            >
              <img
                src={UNIT_ICONS[unit.type]}
                alt={t.units[unit.type]}
                className={`${styles.unitIcon} ${isP1 ? styles.unitP1 : styles.unitP2}`}
              />
            </div>
          ))}
          {capturedHooks.map(({ unit }) => (
            <div
              key={unit.id}
              className={`${styles.unitSlot} ${styles.hookDead}`}
              title={`${t.units[unit.type]} ${t.panel.hookLost}`}
            >
              <img
                src={UNIT_ICONS[unit.type]}
                alt={t.units[unit.type]}
                className={`${styles.unitIcon} ${isP1 ? styles.unitP1 : styles.unitP2}`}
              />
              <div className={styles.hookStrike} />
            </div>
          ))}
        </div>
      </div>

      {(showRespawnAvailable || towersAllBlocked) && (
        <>
          <div className={styles.divider} />
          <div className={`${styles.respawnHint} ${isP1 ? styles.respawnHintP1 : styles.respawnHintP2} ${towersAllBlocked ? styles.respawnHintBlocked : ''}`}>
            {showRespawnAvailable ? t.panel.respawnAvailable : t.panel.towersBlocked}
          </div>
        </>
      )}
    </div>
  );
}
