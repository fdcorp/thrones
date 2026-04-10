import type { Translation } from './index';

export const en: Translation = {
  lang: 'en',

  menu: {
    playLocal:  'Local play',
    playAI:     'Play vs AI',
    tutorial:   'Tutorial',
    playOnline: 'Play online — coming soon',
    copyright:  '© 2026 David Fernandez · Thrones v1 · All rights reserved',
  },

  aiConfig: {
    title:      'Difficulty level',
    easy:       'Easy',
    easyDesc:   'Random moves — to learn the game',
    medium:     'Medium',
    mediumDesc: 'Heuristic strategy — moderate challenge',
    hard:       'Hard',
    hardDesc:   'Minimax depth 3 — serious opponent',
    back:       'Back',
    play:       'Play',
  },

  game: {
    quit:           'Quit',
    chooseSide:     'Choose your side',
    chooseQuestion: 'Which player do you want to play?',
    gold:           'GOLD',
    goldDesc:       'Player 1 — goes first',
    silver:         'SILVER',
    silverDesc:     'Player 2 — goes second',
    random:         'RANDOM',
    randomDesc:     'Side drawn randomly',
    mute:           'Mute',
    unmute:         'Unmute',
    customize:      'Customize',
    undo:           'UNDO',
    undoTitle:      'Undo last move',
    surrender:      'SURRENDER',
    surrenderTitle: 'Surrender the game',
  },

  panel: {
    player1:          'PLAYER 1',
    player2:          'PLAYER 2',
    captured:         (n) => `Captured (${n})`,
    hookLost:         '— lost permanently',
    respawnAvailable: 'Respawn available',
    towersBlocked:    'Towers besieged, respawn unavailable',
  },

  turn: {
    aiThinking:  'AI IS THINKING...',
    player1Turn: '● PLAYER 1 — YOUR TURN',
    player2Turn: '● PLAYER 2 — YOUR TURN',
    turnLabel:   (n) => `Turn ${n}`,
  },

  log: {
    title:          'GAME LOG',
    turnBadge:      (n) => `Turn ${n}`,
    empty:          'Game is starting…',
    combatReminder: 'Combat logic',
  },

  end: {
    draw:           'DRAW',
    mutualAgreement:'Mutual agreement',
    conquered:      'has conquered the throne',
    replay:         'Play again',
    menu:           'Menu',
    drawReasons: {
      repetition: 'Position repetition (×3)',
      stagnation: '40-turn stagnation rule',
    },
  },

  units: {
    SHIELD:  'Shield',
    RAM:     'Ram',
    WARRIOR: 'Warrior',
    HOOK:    'Hook',
  },

  playerLabel: {
    P1: 'P1',
    P2: 'P2',
  },

  logEntries: {
    move:        (unit, pl, q, r) => `${unit} ${pl} moved to (${q},${r})`,
    capture:     (atk, ap, tgt, tp) => `${atk} ${ap} captures ${tgt} ${tp}`,
    throneKill:  (unit, pl) => `${unit} ${pl} destroys the enemy Throne!`,
    respawn:     (unit, pl, q, r) => `Respawn: ${unit} ${pl} at (${q},${r})`,
    grappleStun: (tgt, tp) => `Hook catches ${tgt} ${tp} — STUN`,
    grappleAlly: (tgt, tp) => `Hook pulls ${tgt} ${tp} (ally)`,
  },

  tutorial: {
    howToPlay:      'How to play',
    objective:      'Objective',
    objectiveText:  'Destroy the enemy Throne with your Warrior. Only the Warrior can attack the Throne.',
    oneActionPerTurn: 'One action per turn',
    move:           'Move',
    or:             'OR',
    attack:         'Attack',
    respawn:        'Respawn',
    units:          'Units',

    shieldRole:     'Eliminates Warrior & Hook',
    shieldMove:     '1 hex · all directions',
    shieldZoc:      'Locks adjacent enemies in place',
    shieldWeakness: 'Killed by the Ram',

    ramRole:        'Eliminates Shield & Hook',
    ramMove:        '1 to 2 hexes · straight line only',
    ramJump:        'Can jump over units',
    ramWeakness:    'Killed by the Warrior',

    warriorRole:    'Eliminates Ram & Throne',
    warriorMove:    '1 hex or 2 in L-shape',
    warriorSpecial: 'Only unit that can destroy the enemy Throne',
    warriorWeakness:'Killed by the Shield',

    hookRole:       'Does not kill · Permanent death',
    hookMove:       '1 hex · all directions',
    hookAbility:    'Pulls an enemy (2 to 7 hexes) and stuns it',
    hookWeakness:   'Killed by Shield or Ram, never respawns',

    stunTitle:  'Hook stun',
    stunText1:  'Any unit caught by the Hook is stunned and skips its next turn.',
    stunText2:  'The stun automatically wears off the following turn.',

    towersTitle: 'Towers',
    towersIntro: 'Each player has 2 towers, allowing fallen units to respawn. There are 3 states to know.',
    towerActive:       'ACTIVE',
    towerActiveDesc:   'An ally is adjacent, no enemy. Respawn available.',
    towerBlocked:      'BLOCKED',
    towerBlockedDesc:  'An enemy is adjacent. Unusable this turn.',
    towerInactive:     'INACTIVE',
    towerInactiveDesc: 'No ally nearby. Unusable.',
    towerNote: 'To respawn, place the unit directly on the Tower hex (must be free). The Hook never respawns. Its destruction is permanent.',

    drawTitle:           'Draw conditions',
    drawRepetitionLabel: 'Repetition ×3:',
    drawRepetitionBody:  'if the exact same board position repeats three times, the game is a draw.',
    drawStagnationLabel: '40 turns without capture + stagnant Warrior:',
    drawStagnationBody:  'if no capture has occurred in 40 turns and no Warrior has advanced toward the enemy Throne, the game is a draw.',
    drawMutualLabel:     'Mutual agreement:',
    drawMutualBody:      'both players can agree to a draw at any time.',

    playNow:        'Play now',
    backToMenu:     '← Main menu',
    chooseMode:     'Choose a mode',
    playLocal:      'Local play',
    playAI:         'Play vs AI',
    playOnlineSoon: 'Online — coming soon',
    cancel:         'Cancel',
  },

  tutorial_header: {
    back:  '← Menu',
    title: 'TUTORIAL',
  },
};
