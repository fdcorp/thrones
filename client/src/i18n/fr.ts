import type { Translation } from './index';

export const fr: Translation = {
  lang: 'fr',

  menu: {
    playLocal:    'Jouer en local',
    playAI:       "Jouer contre l'IA",
    tutorial:     'Tutoriel',
    playOnline:   'Jouer en ligne — bientôt',
    copyright:    '© 2026 David Fernandez · Thrones v1 · Tous droits réservés',
  },

  aiConfig: {
    title:      'Niveau de difficulté',
    easy:       'Facile',
    easyDesc:   'Coups aléatoires — pour apprendre',
    medium:     'Moyen',
    mediumDesc: 'Stratégie heuristique — défi modéré',
    hard:       'Difficile',
    hardDesc:   'Minimax profondeur 3 — adversaire sérieux',
    back:       'Retour',
    play:       'Jouer',
  },

  game: {
    quit:           'Quitter',
    chooseSide:     'Choisir votre camp',
    chooseQuestion: 'Quel joueur souhaitez-vous incarner ?',
    gold:           'OR',
    goldDesc:       'Joueur 1 — commence en premier',
    silver:         'ARGENT',
    silverDesc:     'Joueur 2 — joue en second',
    random:         'HASARD',
    randomDesc:     'Camp tiré aléatoirement',
    mute:           'Couper le son',
    unmute:         'Activer le son',
    customize:      'Personnaliser',
    undo:           'ANNULER',
    undoTitle:      'Annuler le dernier coup',
    surrender:      'ABANDONNER',
    surrenderTitle: 'Abandonner la partie',
  },

  panel: {
    player1:        'JOUEUR 1',
    player2:        'JOUEUR 2',
    captured:       (n) => `Capturés (${n})`,
    hookLost:       '— perdu définitivement',
    respawnAvailable: 'Respawn disponible',
    towersBlocked:  'Tours assiégées, respawn indisponible',
  },

  turn: {
    aiThinking:   'IA RÉFLÉCHIT...',
    player1Turn:  '● JOUEUR 1 — À TOI DE JOUER',
    player2Turn:  '● JOUEUR 2 — À TOI DE JOUER',
    turnLabel:    (n) => `Tour ${n}`,
  },

  log: {
    title:           'LOG DE PARTIE',
    turnBadge:       (n) => `Tour ${n}`,
    empty:           'La partie commence…',
    combatReminder:  'Logique de combat',
  },

  end: {
    draw:           'MATCH NUL',
    mutualAgreement:'Accord mutuel',
    conquered:      'a conquis le trône',
    replay:         'Rejouer',
    menu:           'Menu',
    drawReasons: {
      repetition: 'Répétition de position (×3)',
      stagnation: 'Règle des 40 tours sans progression',
    },
  },

  units: {
    SHIELD:  'Bouclier',
    RAM:     'Bélier',
    WARRIOR: 'Guerrier',
    HOOK:    'Grappin',
  },

  playerLabel: {
    P1: 'J1',
    P2: 'J2',
  },

  logEntries: {
    move:        (unit, pl, q, r) => `${unit} ${pl} déplacé vers (${q},${r})`,
    capture:     (atk, ap, tgt, tp) => `${atk} ${ap} capture ${tgt} ${tp}`,
    throneKill:  (unit, pl) => `${unit} ${pl} détruit le Trône ennemi !`,
    respawn:     (unit, pl, q, r) => `Respawn : ${unit} ${pl} en (${q},${r})`,
    grappleStun: (tgt, tp) => `Grappin attrape ${tgt} ${tp} — STUN`,
    grappleAlly: (tgt, tp) => `Grappin tire ${tgt} ${tp} (allié)`,
  },

  tutorial: {
    howToPlay:      'Comment jouer à',
    objective:      "L'objectif",
    objectiveText:  'Détruire le Trône ennemi avec votre Guerrier. Seul le Guerrier peut attaquer le Trône.',
    oneActionPerTurn: 'Une action par tour',
    move:           'Déplacer',
    or:             'OU',
    attack:         'Attaquer',
    respawn:        'Réapparaître',
    units:          'Les unités',

    shieldRole:     'Élimine le Guerrier & le Grappin',
    shieldMove:     '1 case · toutes directions',
    shieldZoc:      'Bloque les ennemis adjacents',
    shieldWeakness: 'Tué par le Bélier',

    ramRole:        'Élimine le Bouclier & le Grappin',
    ramMove:        '1 à 2 cases · ligne droite uniquement',
    ramJump:        'Peut sauter par-dessus les unités',
    ramWeakness:    'Tué par le Guerrier',

    warriorRole:    'Élimine le Bélier & le Trône',
    warriorMove:    '1 case ou 2 en L',
    warriorSpecial: 'Seul à pouvoir détruire le Trône ennemi',
    warriorWeakness:'Tué par le Bouclier',

    hookRole:       'Ne tue pas · Mort permanente',
    hookMove:       '1 case · toutes directions',
    hookAbility:    "Attire un ennemi (2 à 7 cases) et l'étourdit",
    hookWeakness:   'Tué par Bouclier ou Bélier, ne réapparaît jamais',

    stunTitle:  "L'étourdissement du grappin",
    stunText1:  'Toute unité attrapée par le Grappin est étourdie et passe son prochain tour.',
    stunText2:  "L'étourdissement se dissipe automatiquement au tour suivant.",

    towersTitle: 'Les Tours',
    towersIntro: 'Chaque joueur possède 2 tours, lui permettant de faire réapparaître des unités tombées au combat. Il y a 3 états à connaître.',
    towerActive:       'ACTIVE',
    towerActiveDesc:   'Un allié est adjacent, aucun ennemi. Respawn disponible.',
    towerBlocked:      'BLOQUÉE',
    towerBlockedDesc:  'Un ennemi est adjacent. Inutilisable ce tour.',
    towerInactive:     'INACTIVE',
    towerInactiveDesc: 'Aucun allié à côté. Inutilisable.',
    towerNote: "Pour réapparaître, placez l'unité directement sur le hex de la Tour (doit être libre). Le Grappin ne réapparaît jamais. Sa destruction est définitive.",

    drawTitle:           'Conditions de nul',
    drawRepetitionLabel: 'Répétition ×3 :',
    drawRepetitionBody:  'si la même position de plateau exacte se répète trois fois, la partie est nulle.',
    drawStagnationLabel: '40 tours sans capture + Guerrier stagnant :',
    drawStagnationBody:  "si aucune capture n'a eu lieu depuis 40 tours et qu'aucun Guerrier ne s'est rapproché du Trône ennemi, la partie est nulle.",
    drawMutualLabel:     'Accord mutuel :',
    drawMutualBody:      "les deux joueurs peuvent s'accorder sur un nul à tout moment.",

    playNow:        'Jouer maintenant',
    backToMenu:     '← Menu principal',
    chooseMode:     'Choisir un mode',
    playLocal:      'Jouer en local',
    playAI:         "Jouer contre l'IA",
    playOnlineSoon: 'En ligne — bientôt disponible',
    cancel:         'Annuler',
  },

  tutorial_header: {
    back:  '← Menu',
    title: 'TUTORIEL',
  },
};
