import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ──────────────────────────────────────────────────────────────────────

export type HexThemeId = 'dark' | 'slate' | 'forest' | 'crimson' | 'sand';
export type BoardBgId  = 'default' | 'void' | 'dusk' | 'ember' | 'frost';
export type UnitSkinId = 'classic';

export interface HexThemePreset {
  labelFr: string; labelEn: string;
  fill: string; stroke: string;
  swatchFill: string; swatchStroke: string;
}

export interface BoardBgPreset {
  labelFr: string; labelEn: string;
  color: string;
}

export interface UnitSkinPreset {
  labelFr: string; labelEn: string;
  available: boolean;
}

// ── Presets ────────────────────────────────────────────────────────────────────

export const HEX_THEMES: Record<HexThemeId, HexThemePreset> = {
  dark:    { labelFr: 'Nuit',     labelEn: 'Night',   fill: 'rgba(16,16,16,0.82)',  stroke: 'rgba(150,150,150,0.18)', swatchFill: '#141414', swatchStroke: 'rgba(180,180,180,0.5)' },
  slate:   { labelFr: 'Ardoise',  labelEn: 'Slate',   fill: 'rgba(22,26,32,0.88)',  stroke: 'rgba(120,140,160,0.3)',  swatchFill: '#161a20', swatchStroke: 'rgba(120,160,200,0.7)' },
  forest:  { labelFr: 'Forêt',    labelEn: 'Forest',  fill: 'rgba(10,18,14,0.88)',  stroke: 'rgba(60,120,80,0.35)',   swatchFill: '#0a120e', swatchStroke: 'rgba(60,160,80,0.7)'  },
  crimson: { labelFr: 'Cramoisi', labelEn: 'Crimson', fill: 'rgba(20,8,8,0.88)',    stroke: 'rgba(140,40,40,0.35)',   swatchFill: '#140808', swatchStroke: 'rgba(200,50,50,0.7)'  },
  sand:    { labelFr: 'Sable',    labelEn: 'Sand',    fill: 'rgba(22,18,10,0.88)',  stroke: 'rgba(160,130,60,0.35)',  swatchFill: '#16120a', swatchStroke: 'rgba(200,160,60,0.7)' },
};

export const BOARD_BGS: Record<BoardBgId, BoardBgPreset> = {
  default: { labelFr: 'Défaut',     labelEn: 'Default', color: '#0a0a0a' },
  void:    { labelFr: 'Abîme',      labelEn: 'Void',    color: '#000000' },
  dusk:    { labelFr: 'Crépuscule', labelEn: 'Dusk',    color: '#06040e' },
  ember:   { labelFr: 'Braise',     labelEn: 'Ember',   color: '#0e0602' },
  frost:   { labelFr: 'Givre',      labelEn: 'Frost',   color: '#030b10' },
};

export const UNIT_SKINS: Record<string, UnitSkinPreset> = {
  classic: { labelFr: 'Classique', labelEn: 'Classic', available: true  },
  royal:   { labelFr: 'Royal',     labelEn: 'Royal',   available: false },
  shadow:  { labelFr: 'Ombre',     labelEn: 'Shadow',  available: false },
};

// ── CSS application ────────────────────────────────────────────────────────────

export function applyCustomVars(hexTheme: HexThemeId, boardBg: BoardBgId) {
  const theme = HEX_THEMES[hexTheme];
  const bg    = BOARD_BGS[boardBg];
  const root  = document.documentElement;
  root.style.setProperty('--hex-fill',   theme.fill);
  root.style.setProperty('--hex-stroke', theme.stroke);
  root.style.setProperty('--board-bg',   bg.color);
}

// ── Store ──────────────────────────────────────────────────────────────────────

interface CustomStore {
  hexTheme: HexThemeId;
  boardBg:  BoardBgId;
  unitSkin: UnitSkinId;
  setHexTheme: (id: HexThemeId) => void;
  setBoardBg:  (id: BoardBgId)  => void;
  setUnitSkin: (id: UnitSkinId) => void;
}

export const useCustomStore = create<CustomStore>()(
  persist(
    (set, get) => ({
      hexTheme: 'dark',
      boardBg:  'default',
      unitSkin: 'classic',
      setHexTheme: (id) => { set({ hexTheme: id }); applyCustomVars(id, get().boardBg);  },
      setBoardBg:  (id) => { set({ boardBg:  id }); applyCustomVars(get().hexTheme, id); },
      setUnitSkin: (id) => set({ unitSkin: id }),
    }),
    {
      name: 'thrones-custom',
      onRehydrateStorage: () => (state) => {
        if (state) applyCustomVars(state.hexTheme, state.boardBg);
      },
    }
  )
);
