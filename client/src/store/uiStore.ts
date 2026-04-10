import { create } from 'zustand';
import type { HexCoord, Unit } from '@/engine/types';

export type InteractionMode = 'idle' | 'unit-selected' | 'respawn-select' | 'grapple-target' | 'grapple-dest';

export interface UIStore {
  selectedHex: HexCoord | null;
  selectedUnitId: string | null;
  legalMoveHexes: HexCoord[];
  legalAttackHexes: HexCoord[];
  legalRespawnHexes: HexCoord[];
  grappleTargetHex: HexCoord | null;
  grappleDestHexes: HexCoord[];
  showLog: boolean;
  interactionMode: InteractionMode;
  pendingRespawnUnitId: string | null;
  boardFlipped: boolean;

  selectHex: (hex: HexCoord | null) => void;
  selectUnit: (unitId: string | null, moveHexes: HexCoord[], attackHexes: HexCoord[]) => void;
  clearSelection: () => void;
  toggleLog: () => void;
  setRespawnMode: (unitId: string, hexes: HexCoord[]) => void;
  setGrappleTargetMode: (hookUnitId: string, targetHexes: HexCoord[]) => void;
  setGrappleDestMode: (targetHex: HexCoord, destHexes: HexCoord[]) => void;
  setBoardFlipped: (flipped: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedHex: null,
  selectedUnitId: null,
  legalMoveHexes: [],
  legalAttackHexes: [],
  legalRespawnHexes: [],
  grappleTargetHex: null,
  grappleDestHexes: [],
  showLog: true,
  interactionMode: 'idle',
  pendingRespawnUnitId: null,
  boardFlipped: false,

  selectHex: (hex) => set({ selectedHex: hex }),

  selectUnit: (unitId, moveHexes, attackHexes) => set({
    selectedUnitId: unitId,
    legalMoveHexes: moveHexes,
    legalAttackHexes: attackHexes,
    interactionMode: unitId ? 'unit-selected' : 'idle',
    grappleTargetHex: null,
    grappleDestHexes: [],
    pendingRespawnUnitId: null,
  }),

  clearSelection: () => set({
    selectedHex: null,
    selectedUnitId: null,
    legalMoveHexes: [],
    legalAttackHexes: [],
    legalRespawnHexes: [],
    grappleTargetHex: null,
    grappleDestHexes: [],
    interactionMode: 'idle',
    pendingRespawnUnitId: null,
  }),

  toggleLog: () => set(s => ({ showLog: !s.showLog })),
  setBoardFlipped: (flipped) => set({ boardFlipped: flipped }),

  setRespawnMode: (unitId, hexes) => set({
    pendingRespawnUnitId: unitId,
    legalRespawnHexes: hexes,
    interactionMode: 'respawn-select',
    selectedUnitId: null,
    legalMoveHexes: [],
    legalAttackHexes: [],
  }),

  setGrappleTargetMode: (hookUnitId, targetHexes) => set({
    selectedUnitId: hookUnitId,
    legalAttackHexes: targetHexes, // reuse attack hexes for grapple targets
    interactionMode: 'grapple-target',
    legalMoveHexes: [],
  }),

  setGrappleDestMode: (targetHex, destHexes) => set({
    grappleTargetHex: targetHex,
    grappleDestHexes: destHexes,
    interactionMode: 'grapple-dest',
    legalAttackHexes: [],
  }),
}));
