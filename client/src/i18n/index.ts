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
    play: string;
    community: string;
    friends: string;
    players: string;
    ranking: string;
    comingSoon: string;
  };

  aiConfig: {
    title: string;
    easy: string;
    easyDesc: string;
    medium: string;
    mediumDesc: string;
    hard: string;
    hardDesc: string;
    expert: string;
    expertDesc: string;
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
    victory: string;
    defeat: string;
    replay: string;
    menu: string;
    findRanked: string;
    findCasual: string;
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
    rankedTitle: string;
    rankedCounts: string;
    rankedCountsDesc: string;
    rankedNoCounts: string;
    rankedNoCountsDesc: string;
    eloWhat: string;
    eloWhatDesc: string;
    eloWin: string;
    eloWinDesc: string;
    eloLose: string;
    eloLoseDesc: string;
    eloNote: string;
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

  auth: {
    loginTitle: string;
    registerTitle: string;
    username: string;
    usernamePlaceholder: string;
    password: string;
    loginBtn: string;
    registerBtn: string;
    or: string;
    switchToRegister: string;
    switchToLogin: string;
    loggedInAs: string;
    logout: string;
    eloRating: string;
  };

  online: {
    createRoom: string;
    joinRoom: string;
    roomCode: string;
    copyCode: string;
    codeCopied: string;
    waitingForOpponent: string;
    opponentDisconnected: string;
    eloChange: (delta: number) => string;
    mustBeLoggedIn: string;
    roomNotFound: string;
    roomFull: string;
    chooseColor: string;
    colorGold: string;
    colorSilver: string;
    colorRandom: string;
    searchingOpponent: string;
    cancelSearch: string;
    orDivider: string;
  };

  leaderboard: {
    title: string;
    rank: string;
    player: string;
    elo: string;
    wins: string;
    losses: string;
    played: string;
    winRate: string;
    you: string;
    noGames: string;
    addFriend: string;
    added: string;
  };

  players: {
    title: string;
    player: string;
    elo: string;
    you: string;
    noPlayers: string;
    addFriend: string;
    friend: string;
  };

  profile: {
    editCountry: string;
    countryLabel: string;
    saveCountry: string;
    saved: string;
    memberSince: string;
    lastSeen: string;
    never: string;
    matchHistory: string;
    noHistory: string;
    win: string;
    loss: string;
    draw: string;
    modeOnline: string;
    modeOnlineCasual: string;
    modeAI: string;
    modeLocal: string;
    turns: (n: number) => string;
    eloChange: (d: number) => string;
    friends: string;
    friendsTab: string;
    requestsTab: string;
    noFriends: string;
    noRequests: string;
    addFriend: string;
    removeFriend: string;
    acceptFriend: string;
    declineFriend: string;
    requestSent: string;
    cancelRequest: string;
    friendAdded: string;
    friendRemoved: string;
    requestSentMsg: string;
    viewProfile: string;
    myProfile: string;
  };
}

const translations: Record<'fr' | 'en', Translation> = { fr, en };

export function useLang(): Translation {
  const lang = useLangStore(s => s.lang);
  return translations[lang];
}
