import { useCustomStore, HEX_THEMES, BOARD_BGS, UNIT_SKINS } from '@/store/customStore';
import type { HexThemeId, BoardBgId } from '@/store/customStore';
import { useLangStore } from '@/store/langStore';
import styles from './CustomPanel.module.css';

interface CustomPanelProps {
  open: boolean;
  onClose: () => void;
}

export function CustomPanel({ open, onClose }: CustomPanelProps) {
  const lang = useLangStore(s => s.lang);
  const { hexTheme, boardBg, unitSkin, setHexTheme, setBoardBg, setUnitSkin } = useCustomStore();

  return (
    <>
      {open && <div className={styles.backdrop} onClick={onClose} />}
      <div className={`${styles.panel} ${open ? styles.open : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title}>{lang === 'fr' ? 'PERSONNALISATION' : 'CUSTOMIZATION'}</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.body}>

          {/* ── Hex theme ── */}
          <section className={styles.section}>
            <div className={styles.sectionLabel}>
              {lang === 'fr' ? 'COULEUR DU PLATEAU' : 'BOARD COLOR'}
            </div>
            <div className={styles.swatchGrid}>
              {(Object.entries(HEX_THEMES) as [HexThemeId, typeof HEX_THEMES[HexThemeId]][]).map(([id, preset]) => (
                <button
                  key={id}
                  className={`${styles.swatch} ${hexTheme === id ? styles.swatchActive : ''}`}
                  onClick={() => setHexTheme(id)}
                  title={lang === 'fr' ? preset.labelFr : preset.labelEn}
                  aria-label={lang === 'fr' ? preset.labelFr : preset.labelEn}
                >
                  <span
                    className={styles.swatchInner}
                    style={{
                      background: preset.swatchFill,
                      boxShadow: `inset 0 0 0 1.5px ${preset.swatchStroke}`,
                    }}
                  />
                  <span className={styles.swatchLabel}>{lang === 'fr' ? preset.labelFr : preset.labelEn}</span>
                </button>
              ))}
            </div>
          </section>

          <div className={styles.divider} />

          {/* ── Board background ── */}
          <section className={styles.section}>
            <div className={styles.sectionLabel}>
              {lang === 'fr' ? 'FOND DU PLATEAU' : 'BOARD BACKGROUND'}
            </div>
            <div className={styles.bgGrid}>
              {(Object.entries(BOARD_BGS) as [BoardBgId, typeof BOARD_BGS[BoardBgId]][]).map(([id, preset]) => (
                <button
                  key={id}
                  className={`${styles.bgOption} ${boardBg === id ? styles.bgOptionActive : ''}`}
                  onClick={() => setBoardBg(id)}
                >
                  <span
                    className={styles.bgSwatch}
                    style={{ background: preset.color }}
                  />
                  <span className={styles.bgLabel}>{lang === 'fr' ? preset.labelFr : preset.labelEn}</span>
                </button>
              ))}
            </div>
          </section>

          <div className={styles.divider} />

          {/* ── Unit skin ── */}
          <section className={styles.section}>
            <div className={styles.sectionLabel}>
              {lang === 'fr' ? 'SKIN DES UNITÉS' : 'UNIT SKIN'}
            </div>
            <div className={styles.skinGrid}>
              {Object.entries(UNIT_SKINS).map(([id, preset]) => (
                <button
                  key={id}
                  className={`${styles.skinOption} ${!preset.available ? styles.skinLocked : ''} ${unitSkin === id && preset.available ? styles.skinActive : ''}`}
                  onClick={() => preset.available && setUnitSkin(id as 'classic')}
                  disabled={!preset.available}
                >
                  <span className={styles.skinName}>{lang === 'fr' ? preset.labelFr : preset.labelEn}</span>
                  {!preset.available && (
                    <span className={styles.skinSoon}>{lang === 'fr' ? 'Bientôt' : 'Soon'}</span>
                  )}
                  {unitSkin === id && preset.available && (
                    <svg className={styles.skinCheck} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
