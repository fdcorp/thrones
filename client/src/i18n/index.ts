import { useLangStore } from '@/store/langStore';
import { fr } from './fr';
import { en } from './en';
import type { UnitType } from '@/engine/types';

export interface Translation {
  lang: 'fr' | 'en';

  menu: {
    playLocal: string;
    playAI: string;
    tutorial: string;
    playOnline: string;
    copyright: string;
  };

  aiConfig: {
    title: string;
    easy: string;
    easyDesc: string;
    medium: string;
    mediumDesc: string;
    hard: string;
    hardDesc: string;
    back: string;
    play: string;
  };

  game: {
    quit: string;
    chooseSide: string;
    chooseQuestion: string;
    gold: string;
    goldDesc: string;
    silver: string;
    silverDesc: string;
    random: string;
    randomDesc: string;
    mute: string;
    unmute: string;
    customize: string;
    undo: string;
    undoTitle: string;
    surrender: string;
    surrenderTitle: string;
  };

  panel: {
    player1: string;
    player2: string;
    captured: (n: number) => string;
    hookLost: string;
    respawnAvailable: string;
    towersBlocked: string;
  };

  turn: {
    aiThinking: string;
    player1Turn: string;
    player2Turn: string;
    turnLabel: (n: number) => string;
  };

  log: {
    title: string;
    turnBadge: (n: number) => string;
    empty: string;
    combatReminder: string;
  };

  end: {
    draw: string;
    mutualAgreement: string;
    conquered: string;
    replay: string;
    menu: string;
    drawReasons: {
      repetition: string;
      stagnation: string;
    };
  };

  units: Record<UnitType, string>;

  playerLabel: {
    P1: string;
    P2: string;
  };

  logEntries: {
    move: (unit: string, playerLabel: string, q: number, r: number) => string;
    capture: (atk: string, ap: string, tgt: string, tp: string) => string;
    throneKill: (unit: string, playerLabel: string) => string;
    respawn: (unit: string, playerLabel: string, q: number, r: number) => string;
    grappleStun: (tgt: string, tp: string) => string;
    grappleAlly: (tgt: string, tp: string) => string;
  };

  tutorial: {
    howToPlay: string;
    objective: string;
    objectiveText: string;
    oneActionPerTurn: string;
    move: string;
    or: string;
    attack: string;
    respawn: string;
    units: string;
    shieldRole: string;
    shieldMove: string;
    shieldZoc: string;
    shieldWeakness: string;
    ramRole: string;
    ramMove: string;
    ramJump: string;
    ramWeakness: string;
    warriorRole: string;
    warriorMove: string;
    warriorSpecial: string;
    warriorWeakness: string;
    hookRole: string;
    hookMove: string;
    hookAbility: string;
    hookWeakness: string;
    stunTitle: string;
    stunText1: string;
    stunText2: string;
    towersTitle: string;
    towersIntro: string;
    towerActive: string;
    towerActiveDesc: string;
    towerBlocked: string;
    towerBlockedDesc: string;
    towerInactive: string;
    towerInactiveDesc: string;
    towerNote: string;
    drawTitle: string;
    drawRepetitionLabel: string;
    drawRepetitionBody: string;
    drawStagnationLabel: string;
    drawStagnationBody: string;
    drawMutualLabel: string;
    drawMutualBody: string;
    playNow: string;
    backToMenu: string;
    chooseMode: string;
    playLocal: string;
    playAI: string;
    playOnlineSoon: string;
    cancel: string;
  };

  tutorial_header: {
    back: string;
    title: string;
  };
}

const translations: Record<'fr' | 'en', Translation> = { fr, en };

export function useLang(): Translation {
  const lang = useLangStore(s => s.lang);
  return translations[lang];
}
