# IMPLEMENTATION PLAN : THRONES (v1)

---

## 0. Fichiers complémentaires du projet

> Ce fichier est le **plan d'implémentation central**. Il est complété par quatre fichiers spécialisés. Chaque agent doit lire les fichiers correspondants à son périmètre avant d'écrire la moindre ligne de code.

| Fichier | Rôle | À lire pour |
|---|---|---|
| [`AGENTS.md`](./AGENTS.md) | Orchestration de l'équipe — périmètres, séquence, handoffs | Avant tout — donne la vue d'ensemble d'exécution |
| [`RULES.md`](./RULES.md) | Règles officielles du jeu en format technique optimisé | Phase 2 — Moteur de jeu (Agent Engine) |
| [`DESIGN.md`](./DESIGN.md) | Système de design complet — tokens, composants, animations | Phase 3 — UI / Frontend (Agent UI + Agent Integration) |
| [`TESTING.md`](./TESTING.md) | Protocoles de test, 9 scénarios, checklist de validation | Phase 4 — Testing & Validation (Agent QA) |

### Ordre de lecture par agent

| Agent | Lire en priorité |
|---|---|
| **Agent 1 — Architect** | `CLAUDE.md` sections 2, 4, Phase 1 + `DESIGN.md` sections 2–4 |
| **Agent 2 — Engine** | `RULES.md` complet + `CLAUDE.md` Phase 2 |
| **Agent 3 — UI** | `DESIGN.md` complet + `CLAUDE.md` Phase 3 |
| **Agent 4 — Integration** | `CLAUDE.md` Phase 3 (stores/hooks) + `DESIGN.md` section 7 |
| **Agent 5 — QA** | `TESTING.md` complet + `RULES.md` + `DESIGN.md` |
| **Agent 6 — Server** | `CLAUDE.md` Phase 5 uniquement |

### Priorité en cas de contradiction
- Sur les règles du jeu → **`RULES.md` a priorité** sur ce fichier
- Sur les décisions de design → **`DESIGN.md` a priorité** sur ce fichier
- Sur les critères de test → **`TESTING.md` a priorité** sur ce fichier

---

## 1. Project Context

**Thrones** est un jeu de stratégie 2 joueurs au tour par tour, joué sur un plateau hexagonal de 37 cases (rayon 3). Chaque joueur dispose d'un Trône (icône couronne), 2 Tours et 8 unités (Bouclier ×3, Bélier ×2, Guerrier ×2, Grappin ×1) avec une dynamique Pierre-Feuille-Ciseaux. L'objectif est de détruire le Trône adverse via un Guerrier.

**Vibe général :** Dark luxury medieval. Interface sobre, élégante, jamais criarde. Inspiré de Lichess et Chess.com dans le fond (clarté fonctionnelle, lisibilité du plateau), mais avec l'identité visuelle Thrones : noir profond, or, argent, typographie Lexend (toutes graisses).

**Cible utilisateur (v1) :** Usage personnel — le créateur du jeu et son cercle proche. Pas de déploiement public à ce stade. L'app tourne en local.

**Note de vigilance :** Le jeu peut souffrir d'une tactique de "tortue passive" (jeu défensif sans progression). Les règles actuelles gèrent le nul via répétition de position ×3 et accord mutuel. À surveiller lors des tests — les règles sont volontairement gardées telles quelles pour la v1.

---

## 2. Tech Stack

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **SVG natif** pour le rendu du plateau hexagonal et des unités
- **Zustand** pour le state management (game state, UI state, auth state)
- **CSS Modules** + variables CSS globales (architecture prête pour les thèmes futurs)
- **Google Fonts CDN** : Lexend (graisses 100–900)

### Backend (Phase 2 uniquement)
- **Node.js** + **Express** + **ws** (WebSocket natif)
- **SQLite** via `better-sqlite3` (auth simple + historique de parties)
- **JWT** pour l'authentification

### Shared
- Dossier `shared/types.ts` contenant les types communs client/serveur (GameState, messages WebSocket)

### Contraintes
- Phase 1 : client uniquement, zéro serveur requis. `vite dev` suffit.
- Phase 2 : serveur Node.js à lancer en local. Testable via réseau local ou ngrok.
- Pas de déploiement cloud prévu à ce stade.
- Node.js 18+, navigateurs modernes (Chrome, Firefox, Safari).

---

## 3. Design & UX Guidelines

### Direction visuelle
Dark luxury medieval. Austère, noble, sans fioritures. Chaque élément UI doit sembler gravé, pas collé.

### Typographies
```
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@100;200;300;400;500;600;700;800;900&display=swap');
```
- **Lexend** : police unique pour toute l'interface. Hiérarchie par graisse uniquement.
  - Titres / labels primaires / boutons : graisses **700–800**
  - Labels secondaires / boutons ghost : graisse **600**
  - Corps de texte / logs / descriptions : graisse **300**
  - Mentions discrètes : graisse **200**

### Palette de couleurs
```css
:root {
  /* Fonds */
  --bg:          #0a0a0f;
  --bg2:         #0e0e16;
  --bg3:         #131320;

  /* Joueur 1 — Or */
  --gold:        #c9a84c;
  --gold-light:  #e8c96a;
  --gold-dim:    #7a6030;

  /* Joueur 2 — Argent */
  --silver:      #a8b4c0;
  --silver-light:#cdd6de;
  --silver-dim:  #5a6470;

  /* Textes */
  --white:       #f0ece4;
  --muted:       #6b6760;

  /* Bordures */
  --border:      rgba(255,255,255,0.08);
  --border-hex:  rgba(255,255,255,0.15);
  --border-bright: rgba(255,255,255,0.28);

  /* États jeu */
  --legal-move-p1:  rgba(201,168,76,0.18);
  --legal-move-p2:  rgba(168,180,192,0.18);
  --attack-range:   rgba(180,30,30,0.28);
  --tower-halo:     rgba(60,90,160,0.18);   /* Tour — couleur unique tous états */
}
```

### Plateau hexagonal
- Hexagones SVG avec bordures blanches fines (`--border-hex`) sur fond `--bg`
- Hex sélectionné : bordure blanche pleine + légère surbrillance de fond
- Mouvements légaux : teinte or (J1) ou argent (J2) subtile
- Attaques possibles : teinte rouge sang
- Tours : halo bleu discret (`rgba(60,90,160,0.18)`) — même couleur pour tous les états. Pas d'icône SVG rendue sur le hex. Les unités peuvent occuper les hexes Tour.
- Trône : traitement visuel légèrement plus imposant (scale + bordure dédiée)

### Unités
- SVGs fournis par le créateur, colorés dynamiquement par joueur via `fill` CSS :
  - Joueur 1 : `fill: var(--gold)`
  - Joueur 2 : `fill: var(--silver)`
- Unité stunnée : opacité 0.55 + hachage diagonal SVG (pattern 45°, barres noires semi-transparentes)
- Unité sélectionnée : scale 1.08 + glow coloré (or ou argent)
- Unité capturée (panel latéral) : même SVG, opacité 0.3, petit format

### Animations (niveau subtil)
- Déplacement d'unité : slide fluide 150ms ease-out
- Capture : flash bref sur la case + fade-out 200ms de l'unité capturée
- Sélection : scale 1.08 + glow doux 180ms
- Changement de tour : transition discrète sur l'indicateur de tour
- Stun token : fade-in 200ms sur l'unité concernée
- Aucune animation > 300ms — fluidité avant spectacle

### Références
- Lichess.org / Chess.com : clarté du plateau, lisibilité des pièces, log de partie
- Landing page Thrones existante : palette, typographie, ambiance — à respecter fidèlement
- Logo LOGO_JEU_THRONES.svg : intégrer tel quel dans la nav et les écrans de menu

### Architecture CSS — thèmes futurs
Toutes les couleurs du plateau doivent passer par des variables CSS dans `styles/themes/default.css`. La feature "choix de thème de plateau" est prévue en v2 — préparer le terrain dès maintenant en isolant ces variables dans un fichier dédié swappable.

---

## 4. File Structure

```
thrones/
│
├── client/
│   ├── public/
│   │   └── assets/
│   │       ├── units/
│   │       │   ├── Bouclier.svg
│   │       │   ├── Belier.svg
│   │       │   ├── Guerrier.svg
│   │       │   ├── Grappin.svg
│   │       │   ├── Tour.svg
│   │       │   └── Trone.svg
│   │       └── logo/
│   │           └── LOGO_JEU_THRONES.svg
│   │
│   ├── src/
│   │   ├── main.tsx                    # Entry point React
│   │   ├── App.tsx                     # Router principal (react-router-dom v6)
│   │   │
│   │   ├── engine/                     # Moteur de jeu pur — zéro dépendance UI
│   │   │   ├── types.ts                # Tous les types TypeScript du jeu
│   │   │   ├── hex.ts                  # Grille hex : coordonnées cube, voisins, distance
│   │   │   ├── board.ts                # État du plateau, placement initial des unités
│   │   │   ├── moves.ts                # Calcul des mouvements légaux par type d'unité
│   │   │   ├── combat.ts               # Logique de capture, RPS, Throne kill
│   │   │   ├── tower.ts                # États des Tours (Active / Bloquée / Inactive)
│   │   │   ├── zoc.ts                  # Zone de Contrôle du Bouclier
│   │   │   ├── respawn.ts              # Logique de respawn via Tour Active
│   │   │   ├── hook.ts                 # Logique du Grappin (pull, stun, contraintes)
│   │   │   ├── gameState.ts            # Machine d'état globale de la partie
│   │   │   ├── victory.ts              # Détection victoire / nul / répétition ×3
│   │   │   └── ai/
│   │   │       ├── index.ts            # Interface IA — dispatch selon niveau
│   │   │       ├── random.ts           # Niveau Facile — coups aléatoires valides
│   │   │       ├── heuristic.ts        # Niveau Moyen — scoring heuristique
│   │   │       ├── minimax.ts          # Niveau Difficile — minimax + alpha-beta pruning
│   │   │       └── evaluate.ts         # Fonction d'évaluation du plateau (score)
│   │   │
│   │   ├── store/
│   │   │   ├── gameStore.ts            # State Zustand de la partie en cours
│   │   │   ├── uiStore.ts              # State UI : hex sélectionné, highlights, panels
│   │   │   └── authStore.ts            # State utilisateur connecté (Phase 2)
│   │   │
│   │   ├── components/
│   │   │   ├── board/
│   │   │   │   ├── HexBoard.tsx        # Conteneur SVG principal du plateau
│   │   │   │   ├── HexCell.tsx         # Hexagone individuel SVG avec états visuels
│   │   │   │   ├── UnitPiece.tsx       # Rendu d'une unité sur le plateau (SVG inline)
│   │   │   │   ├── TowerHex.tsx        # Hex Tour avec halo d'état
│   │   │   │   └── ThroneHex.tsx       # Hex Trône avec traitement visuel renforcé
│   │   │   │
│   │   │   ├── ui/
│   │   │   │   ├── GameLog.tsx         # Log textuel scrollable des actions de la partie
│   │   │   │   ├── PlayerPanel.tsx     # Infos joueur : unités capturées, disponibles au respawn
│   │   │   │   ├── TurnIndicator.tsx   # Indicateur du joueur actif + numéro de tour
│   │   │   │   ├── StunToken.tsx       # Overlay visuel sur une unité stunnée
│   │   │   │   └── EndScreen.tsx       # Écran de fin de partie (victoire / nul)
│   │   │   │
│   │   │   ├── lobby/
│   │   │   │   ├── MainMenu.tsx        # Menu principal avec logo et options de jeu
│   │   │   │   ├── ModeSelect.tsx      # Sélection : Local / IA / Online
│   │   │   │   ├── AIConfig.tsx        # Sélection du niveau de difficulté IA
│   │   │   │   ├── CreateRoom.tsx      # Créer une room online + affichage du code (Phase 2)
│   │   │   │   └── JoinRoom.tsx        # Rejoindre une room avec code (Phase 2)
│   │   │   │
│   │   │   ├── tutorial/
│   │   │   │   ├── TutorialFlow.tsx    # Orchestrateur du tutoriel (étapes séquentielles)
│   │   │   │   └── TutorialStep.tsx    # Étape individuelle : plateau + texte guidé
│   │   │   │
│   │   │   └── auth/
│   │   │       ├── LoginForm.tsx       # Formulaire login (Phase 2)
│   │   │       └── RegisterForm.tsx    # Formulaire inscription (Phase 2)
│   │   │
│   │   ├── hooks/
│   │   │   ├── useGame.ts              # Hook principal : actions jeu, sélection, tour
│   │   │   ├── useSocket.ts            # Hook WebSocket pour le mode online (Phase 2)
│   │   │   └── useAI.ts                # Hook déclenchement et gestion du coup IA
│   │   │
│   │   ├── styles/
│   │   │   ├── globals.css             # Reset, import fonts, variables globales
│   │   │   ├── tokens.css              # Design tokens (couleurs, spacing, shadows)
│   │   │   └── themes/
│   │   │       └── default.css         # Thème plateau par défaut — variables swappables
│   │   │
│   │   └── pages/
│   │       ├── Home.tsx                # Page d'accueil / menu principal
│   │       ├── Game.tsx                # Page de jeu (plateau + panels)
│   │       ├── Tutorial.tsx            # Page tutoriel interactif
│   │       └── Auth.tsx                # Page login / register (Phase 2)
│   │
│   ├── index.html
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── server/                             # PHASE 2 UNIQUEMENT — ne pas implémenter en Phase 1
│   ├── src/
│   │   ├── index.ts                    # Entry point serveur Express
│   │   ├── config.ts                   # Variables d'environnement (.env)
│   │   ├── ws/
│   │   │   ├── wsServer.ts             # Serveur WebSocket principal
│   │   │   ├── roomManager.ts          # Gestion des rooms (create / join / leave)
│   │   │   └── gameSession.ts          # Session de jeu online — synchronisation d'état
│   │   ├── api/
│   │   │   ├── auth.ts                 # Routes POST /login, POST /register
│   │   │   └── game.ts                 # Routes historique de parties
│   │   ├── db/
│   │   │   ├── database.ts             # Init SQLite + better-sqlite3
│   │   │   ├── schema.sql              # Schéma DB : tables users, games, game_moves
│   │   │   └── queries.ts              # Requêtes préparées (CRUD users, games)
│   │   └── middleware/
│   │       └── auth.ts                 # Middleware JWT — vérification token
│   ├── package.json
│   └── tsconfig.json
│
├── shared/
│   └── types.ts                        # Types partagés client/serveur : GameState, WS messages
│
├── package.json                        # Workspace racine (workspaces: client, server)
└── README.md
```

---

## 5. Execution Plan for Claude Code

> **RÈGLE ABSOLUE :** Ne jamais écrire de code spéculatif ou anticiper les phases suivantes. Chaque phase doit être complète et fonctionnelle avant de passer à la suivante. Le moteur de jeu (`engine/`) est le cœur du projet — il doit être parfait avant que l'UI soit construite dessus.

---

### PHASE 1 — ENVIRONMENT & SETUP
*Agent responsable : **Agent 1 — Architect** (voir [`AGENTS.md`](./AGENTS.md))*
*Référence design CSS : [`DESIGN.md`](./DESIGN.md) — sections 2, 3, 4*

**Objectif :** Projet opérationnel, plateau visible, aucune logique de jeu encore.

#### Commandes d'initialisation
```bash
# Structure workspace
mkdir thrones && cd thrones
npm init -y

# Client
npm create vite@latest client -- --template react-ts
cd client
npm install zustand react-router-dom

# Dépendances dev
npm install -D @types/react @types/react-dom

cd ..
```

#### Actions
- Créer la structure de dossiers complète telle que définie en section 4
- Copier les SVGs d'unités dans `client/public/assets/units/`
- Copier le logo dans `client/public/assets/logo/`
- Configurer `vite.config.ts` (alias `@/` → `src/`)
- Mettre en place `styles/globals.css` avec l'import Google Fonts Lexend, le reset CSS et toutes les variables CSS définies en section 3
- Mettre en place `styles/themes/default.css` avec les variables de thème plateau isolées
- Créer `App.tsx` avec react-router-dom v6 : routes `/`, `/game`, `/tutorial`
- Valider que `vite dev` démarre sans erreur et que les fonts se chargent

---

### PHASE 2 — CORE ENGINE (moteur de jeu)
*Agent responsable : **Agent 2 — Engine** (voir [`AGENTS.md`](./AGENTS.md))*
*Référence règles : [`RULES.md`](./RULES.md) — source de vérité absolue pour toute logique de jeu*

**Objectif :** Moteur de jeu 100% fonctionnel, testé, indépendant de toute UI.

> Implémenter les fichiers dans cet ordre précis. Chaque fichier dépend du précédent.

---

#### `engine/types.ts`
- **Purpose :** Définir tous les types TypeScript utilisés dans le moteur. C'est le contrat de tout le projet.
- **Contenu à définir :**
  - `HexCoord` : coordonnées cube `{ q: number, r: number, s: number }`
  - `UnitType` : enum `SHIELD | RAM | WARRIOR | HOOK`
  - `Player` : enum `P1 | P2`
  - `Unit` : `{ id, type, owner, hex, stunned, alive }`
  - `TowerState` : enum `ACTIVE | BLOCKED | INACTIVE`
  - `Tower` : `{ owner, hex, state }`
  - `Throne` : `{ owner, hex, alive }`
  - `BoardState` : `{ units: Unit[], towers: Tower[], thrones: Throne[] }`
  - `GamePhase` : enum `SETUP | PLAYING | ENDED`
  - `TurnAction` : union type de toutes les actions possibles (MOVE, ATTACK, RESPAWN, HOOK_PULL)
  - `GameState` : état complet de la partie (board, currentPlayer, turnNumber, phase, winner, positionHistory, capturedUnits)
  - `MoveResult` : résultat d'une action (newState, captured?, stunned?, winner?)

---

#### `engine/hex.ts`
- **Purpose :** Toute la géométrie hexagonale. Utilisé par tous les autres fichiers engine.
- **Logic Specs :**
  - Utiliser les **coordonnées cube** `(q, r, s)` avec invariant `q + r + s = 0`
  - Implémenter `getNeighbors(hex): HexCoord[]` — retourne les 6 voisins
  - Implémenter `hexDistance(a, b): number` — distance en nombre de cases
  - Implémenter `hexesInRange(center, min, max): HexCoord[]` — cases à distance [min, max]
  - Implémenter `hexesInLine(from, direction, length): HexCoord[]` — ligne droite hex (pour charge du Bélier)
  - Implémenter `getStraightLines(from): HexCoord[][]` — toutes les lignes droites depuis un hex (6 directions)
  - Implémenter `hexToPixel(hex, size): {x, y}` — conversion coordonnées → position SVG (layout pointy-top)
  - Implémenter `pixelToHex(x, y, size): HexCoord` — conversion position → hex (pour les clics)
  - Implémenter `generateBoard61(): HexCoord[]` — génère les 61 hexagones du plateau (rayon 4 depuis le centre)
  - Toutes les fonctions doivent être pures (pas de side effects)

---

#### `engine/board.ts`
- **Purpose :** Initialisation du plateau et accès aux éléments du board.
- **Logic Specs :**
  - Définir les positions de départ des 8 unités de chaque joueur selon les règles officielles
  - P1 commence en bas du plateau, P2 en haut — symétrie parfaite
  - Placement : Trône au centre-arrière, 2 Tours aux coins arrière, unités sur la rangée avant
  - Implémenter `createInitialBoard(): BoardState`
  - Implémenter `getUnitAt(board, hex): Unit | null`
  - Implémenter `getTowerAt(board, hex): Tower | null`
  - Implémenter `getThroneAt(board, hex): Throne | null`
  - Implémenter `isHexOccupied(board, hex): boolean`
  - Implémenter `getPlayerUnits(board, player): Unit[]`
  - Les hexagones Trône et Tour ne peuvent jamais être occupés par des unités (règle : units cannot land on Tower or Throne hexes)

---

#### `engine/zoc.ts`
- **Purpose :** Zone de Contrôle du Bouclier.
- **Logic Specs :**
  - Un Bouclier exerce sa ZoC sur tous ses hexagones adjacents
  - Une unité ennemie qui **commence** son mouvement sur un hex adjacent à un Bouclier ennemi doit dépenser son action entière pour quitter ce hex — elle ne peut ni attaquer ni faire autre chose
  - Implémenter `getZocHexes(board, player): HexCoord[]` — tous les hexes sous ZoC ennemie pour `player`
  - Implémenter `isUnderZoc(board, unit): boolean` — l'unité est-elle au départ de son tour sous ZoC ennemie ?
  - Implémenter `canOnlyEscape(board, unit): boolean` — si oui, l'unité ne peut que se déplacer, pas attaquer
  - La ZoC ne bloque pas le mouvement à travers — elle affecte uniquement l'action de l'unité qui **part** d'un hex contrôlé

---

#### `engine/moves.ts`
- **Purpose :** Calcul des mouvements légaux pour chaque type d'unité.
- **Logic Specs :**
  - Implémenter `getLegalMoves(board, unit, gameState): HexCoord[]`
  - **Bouclier :** 1 hex dans toutes les directions, destination libre (pas d'unité, pas de Trône)
  - **Bélier :** 1 ou 2 hexes en **ligne droite uniquement**. Peut **sauter par-dessus les unités** (mais pas les Trônes). Les Tours sont franchissables. Seule la case d'arrivée doit être libre. La charge (attaque) est séparée — voir `combat.ts`.
  - **Guerrier :** **1 hex dans toutes les directions** OU **2 hexes en L uniquement** (doit changer de direction entre le pas 1 et le pas 2 — impossible d'aller tout droit). Le chemin intermédiaire doit être libre pour les L-moves.
  - **Grappin :** 1 hex dans toutes les directions, SAUF s'il a utilisé son grappin ce tour
  - Aucune unité ne peut atterrir sur un hex **Trône**. Les hexagones **Tour sont librement occupables** par les unités.
  - Retourner un tableau vide si aucun mouvement légal disponible

---

#### `engine/combat.ts`
- **Purpose :** Résolution de tous les combats et captures.
- **Logic Specs :**
  - Implémenter `getLegalAttacks(board, unit, gameState): HexCoord[]` — cibles attaquables
  - **Bouclier attaque Guerrier ou Grappin :** cible adjacente, Bouclier se déplace sur le hex de la cible
  - **Bélier charge Bouclier ou Grappin :** ligne droite 1-2 hexes, aucune unité entre eux, Bélier se déplace sur le hex de la cible. Le Bélier ne peut pas charger et se déplacer séparément.
  - **Guerrier attaque Bélier ou Grappin :** cible à 1-2 hexes (chemin libre via `warriorCanReach`), Guerrier se déplace sur le hex de la cible
  - **Guerrier attaque Trône :** Trône ennemi à 1-2 hexes, chemin libre — EXCEPTION : le Guerrier reste sur son hex (ne se déplace pas sur le Trône). Le Trône est détruit. Partie terminée immédiatement.
  - **Seul le Guerrier peut attaquer le Trône.** Aucune autre unité.
  - **Le Grappin peut être tué par Bouclier, Bélier et Guerrier.** Sa capture est permanente — il ne peut pas respawn.
  - Implémenter `resolveAttack(board, attacker, targetHex): MoveResult`
  - Gérer la capture : l'unité capturée est retirée du board et ajoutée aux `capturedUnits` du joueur adverse
  - Retourner le nouveau `BoardState` après résolution

---

#### `engine/tower.ts`
- **Purpose :** Gestion des états des Tours.
- **Logic Specs :**
  - Implémenter `updateTowerStates(board): Tower[]` — recalculer les états après chaque action
  - **ACTIVE :** au moins 1 unité du propriétaire est adjacente ET aucune unité ennemie n'est adjacente
  - **BLOCKED :** au moins 1 unité ennemie est adjacente (peu importe si le propriétaire a aussi une unité là)
  - **INACTIVE :** aucune unité du propriétaire n'est adjacente
  - Cette fonction doit être appelée à la fin de chaque action avant de passer au tour suivant
  - Implémenter `getActiveTowers(board, player): Tower[]` — Tours disponibles pour respawn

---

#### `engine/respawn.ts`
- **Purpose :** Logique de respawn d'une unité capturée.
- **Logic Specs :**
  - Implémenter `getLegalRespawnHexes(board, player): HexCoord[]` — retourne le hex de la Tour Active si celui-ci est libre (respawn sur la Tour elle-même, pas sur les cases adjacentes)
  - Implémenter `resolveRespawn(board, unit, targetHex): BoardState` — place l'unité sur le plateau
  - Le respawn est une action complète (le joueur ne peut rien faire d'autre ce tour)
  - Maximum 1 respawn par tour
  - Le Grappin ne peut **jamais** respawn (destruction permanente)
  - L'unité respawnée peut agir normalement à partir du tour suivant
  - Erreurs à gérer : joueur sans Tour Active, Tour Active occupée, unité non capturée

---

#### `engine/hook.ts`
- **Purpose :** Logique du Grappin (unité spéciale).
- **Logic Specs :**
  - Implémenter `getLegalGrappleTargets(board, hook): HexCoord[]`
    - Cibles : **unités ennemies uniquement** (pas d'alliés, pas d'autres Grappins)
    - Portée : **2 à 7 hexes** en ligne droite (distance min = 2, impossible d'attraper une unité adjacente). Première unité ennemie visible dans chacune des 6 directions (ligne de vue — toute unité entre le Grappin et la cible bloque, qu'elle soit à dist 1 ou au-delà)
    - La destination (hex à 1 pas du Grappin) doit être libre et non spéciale
  - Implémenter `getLegalGrappleDestinations(board, hook, targetHex): HexCoord[]`
    - **Une seule destination possible :** le hex à 1 pas du Grappin dans la direction de la cible
    - Retourne `[]` si ce hex est occupé ou spécial
  - Implémenter `resolveGrapple(board, hook, target, destination): MoveResult`
  - **Cible ennemie tirée :** stunnée (passe son prochain tour entier)
  - Le Grappin ne tue pas — il déplace uniquement
  - Utiliser le grappin est l'action complète du Grappin — il ne peut pas se déplacer ce même tour
  - Le Grappin ne peut pas respawn — sa destruction est permanente
  - **UX :** le clic sur la cible dispatch le GRAPPLE directement (destination automatique, pas de 2e clic)

---

#### `engine/victory.ts`
- **Purpose :** Détection des conditions de fin de partie.
- **Logic Specs :**
  - Implémenter `checkVictory(gameState): { winner: Player | null, draw: boolean, reason?: string }`
  - **Victoire :** un Trône est `alive: false` → le joueur dont le Trône est détruit a perdu
  - **Nul par répétition :** si la même position de plateau exacte (toutes unités, positions, joueur actif) apparaît 3 fois dans `positionHistory` → nul
  - **Nul par accord mutuel :** géré au niveau UI, pas dans le moteur
  - Implémenter `serializePosition(gameState): string` — sérialisation déterministe du board pour comparaison
  - Implémenter `recordPosition(gameState): GameState` — ajoute la position courante à l'historique
  - Cette fonction doit être appelée après chaque action résolue

---

#### `engine/gameState.ts`
- **Purpose :** Machine d'état centrale — orchestre toutes les actions de jeu.
- **Logic Specs :**
  - Implémenter `surrender(): void` — concède la partie, donne la victoire à l'adversaire
  - Implémenter `undoLastMove(): void` — restaure l'état précédent (1 coup en arrière, utile contre l'IA)
  - Implémenter `initGame(mode: 'local' | 'ai', aiLevel?: 'easy' | 'medium' | 'hard'): GameState`
  - Implémenter `applyAction(gameState, action: TurnAction): GameState` — fonction principale, pure
    - Valide l'action (est-elle légale dans le contexte actuel ?)
    - Résout l'action via le module approprié (combat, moves, respawn, hook)
    - Met à jour les états des Tours
    - Vérifie la victoire
    - Enregistre la position
    - Passe au joueur suivant
    - Retourne le nouveau GameState
  - Implémenter `getLegalActions(gameState, player): TurnAction[]` — toutes les actions légales disponibles
  - Toutes les fonctions sont **pures** — elles reçoivent un state et retournent un nouveau state sans muter l'original
  - Pas de side effects dans le moteur

---

#### `engine/ai/evaluate.ts`
- **Purpose :** Fonction d'évaluation d'un état de plateau pour l'IA.
- **Logic Specs :**
  - Implémenter `evaluateBoard(gameState, player): number` — retourne un score (positif = avantage pour `player`)
  - Critères d'évaluation pondérés (implémentés) :
    - **Matériel** : valeurs BOUCLIER=3, BÉLIER=4, GUERRIER=6, GRAPPIN=10 (mort permanente)
    - **Pénalité capture** : Grappin perdu = -100%, autres = -50% (respawnable)
    - **Menace Trône** : Guerrier à ≤2 cases du Trône ennemi avec chemin libre = +80 (quasi-victoire). Symétrique pour la défense.
    - **Proximité Guerrier** : bonus `max(0, 8 - distance)` pour chaque Guerrier
    - **Tours** : Active=+5, Bloquée=-4, Tour ennemie Active=-2, Tour ennemie Bloquée=+3
    - **ZoC** : +1.5 par unité ennemie verrouillée par mes Boucliers
    - **Opportunités d'attaque** : +3 si mon Bouclier est adjacent à un Guerrier/Grappin ennemi, si mon Bélier est en ligne de charge d'un Bouclier/Grappin ennemi, si mon Guerrier est à portée d'un Bélier/Grappin ennemi. Pénalités symétriques.
    - **Grappin** : somme des valeurs des cibles grappables × 0.3 (pondéré par valeur)
    - **Stun** : +2 par ennemi stunné, -2 par allié stunné
  - Score de victoire/défaite : +Infinity / -Infinity

---

#### `engine/ai/random.ts`
- **Purpose :** IA niveau Facile — coups aléatoires parmi les actions légales.
- **Logic Specs :**
  - Implémenter `randomMove(gameState): TurnAction`
  - Récupérer toutes les actions légales via `getLegalActions`
  - Retourner une action choisie aléatoirement
  - Si aucune action légale : retourner null (cas théorique)

---

#### `engine/ai/heuristic.ts`
- **Purpose :** IA niveau Moyen — scoring heuristique sans tree search.
- **Logic Specs :**
  - Implémenter `heuristicMove(gameState): TurnAction`
  - Pour chaque action légale : simuler l'action, évaluer le board résultant avec `evaluateBoard`
  - Retourner l'action avec le meilleur score
  - Profondeur 1 (pas de look-ahead)
  - Bonus explicites empilés sur le score `evaluateBoard` :
    - Tuer le Trône : +1000 | Capturer Grappin : +20 | Capturer Guerrier : +10 | Autres captures : +5
    - Grappler un Guerrier menaçant le Trône allié : +15 | Grappler un Guerrier : +8 | Autres grappins : +3
    - Guerrier s'avançant vers le Trône ennemi : +4 par hex gagné
    - Bloquer une Tour ennemie : +4 | Activer sa propre Tour (Bouclier adjacent) : +3
    - Urgence défensive : si le Trône allié était menacé et que l'action neutralise la menace → +200

---

#### `engine/ai/minimax.ts`
- **Purpose :** IA niveau Difficile — minimax avec alpha-beta pruning et ordonnancement des coups.
- **Logic Specs :**
  - Implémenter `minimaxMove(gameState, depth?: number): TurnAction`
  - Depth par défaut : **4** (rendu possible par le move ordering)
  - **Move ordering** (`orderActions`) appliqué à chaque nœud de l'arbre avant la boucle minimax :
    - Priorité : victoire (Trône) > capture Grappin > capture Guerrier > capture Bélier/Bouclier > Grapple Guerrier > autres Grappins > Respawn > Mouvements offensifs (Guerrier vers Trône) > reste
    - Cette seule amélioration rend l'alpha-beta 3-5× plus efficace
  - Alpha-beta pruning sur l'arbre ordonné
  - Utiliser `evaluateBoard` pour les nœuds terminaux
  - Conditions d'arrêt : profondeur 0, victoire détectée, timeout (max 2.5s)
  - Si timeout : retourner le meilleur coup trouvé jusqu'ici

---

#### `engine/ai/index.ts`
- **Purpose :** Interface unifiée de l'IA.
- **Logic Specs :**
  - Implémenter `getAIMove(gameState, level: 'easy' | 'medium' | 'hard'): TurnAction`
  - Dispatcher vers `randomMove`, `heuristicMove`, ou `minimaxMove` selon `level`
  - Ajouter un délai artificiel minimal (300-600ms) pour que l'IA ne joue pas instantanément — meilleure UX

---

### PHASE 3 — UI / FRONTEND
*Agents responsables : **Agent 3 — UI** puis **Agent 4 — Integration** (voir [`AGENTS.md`](./AGENTS.md))*
*Référence design : [`DESIGN.md`](./DESIGN.md) — source de vérité visuelle*

**Objectif :** Interface de jeu complète, jouable en local 1v1 et contre l'IA.

> Construire l'UI sur le moteur validé. Ne jamais recoder de logique de jeu dans les composants — tout passe par le store Zustand qui appelle le moteur.

---

#### `styles/globals.css` + `styles/tokens.css` + `styles/themes/default.css`
- Mettre en place le système CSS complet tel que défini en section 3
- Import Google Fonts Lexend en premier
- Toutes les variables CSS des couleurs de plateau dans `themes/default.css` uniquement
- Reset CSS minimal (box-sizing, margin, padding)

---

#### `store/gameStore.ts`
- **Purpose :** State Zustand central du jeu — pont entre l'UI et le moteur.
- **Logic Specs :**
  - State : `gameState: GameState | null`, `mode`, `aiLevel`
  - Actions : `initGame()`, `applyAction()`, `resetGame()`
  - `applyAction` appelle `engine/gameState.applyAction` et met à jour le store
  - Si mode IA et c'est au tour de l'IA : déclencher `useAI` automatiquement après l'action du joueur humain

#### `store/uiStore.ts`
- State : `selectedHex`, `legalMoves`, `legalAttacks`, `highlightedHexes`, `showLog`
- Actions : `selectHex()`, `clearSelection()`, `toggleLog()`
- `selectHex` : si une unité du joueur actif est sur ce hex → calculer et stocker les mouvements légaux

---

#### `components/board/HexBoard.tsx`
- **Purpose :** Conteneur SVG principal du plateau — rendu de tous les hexagones.
- **Layout :** SVG responsive avec viewBox calculé pour les 61 hexagones. Orientation pointy-top.
- **Comportement :**
  - Rendre tous les hexagones via `HexCell`
  - Gérer les clics : clic sur hex → `uiStore.selectHex()` → si hex légal → `gameStore.applyAction()`
  - Passer les props d'état (selected, legalMove, legalAttack, towerState) à chaque `HexCell`
  - Les unités sont rendues par-dessus les hexagones via `UnitPiece`

#### `components/board/HexCell.tsx`
- SVG `<polygon>` ou `<path>` d'un hexagone individuel
- Props : `hex`, `isSelected`, `isLegalMove`, `isLegalAttack`, `isTowerHex`, `towerState`, `isThroneHex`
- Couleurs et bordures selon les variables CSS de thème
- Cursor pointer si hex cliquable

#### `components/board/UnitPiece.tsx`
- Rend le SVG de l'unité inline (importé depuis `public/assets/units/`)
- Props : `unit`, `isSelected`, `isStunned`
- Fill dynamique selon `unit.owner` : `var(--gold)` ou `var(--silver)`
- Scale 1.08 + glow si sélectionné
- Opacité 0.45 + overlay `StunToken` si stunné
- Transition CSS 150ms sur transform et opacity

#### `components/board/TowerHex.tsx` + `ThroneHex.tsx`
- Variantes de `HexCell` avec traitement visuel renforcé
- Tour : halo coloré selon `towerState` (active/blocked/inactive)
- Trône : bordure or ou argent plus épaisse, léger glow permanent

---

#### `components/ui/GameLog.tsx`
- Panel fixe à droite (260px), toujours visible
- Header : "LOG DE PARTIE" à gauche + **numéro de tour actuel** à droite (prop `turnNumber`)
- Contenu scrollable : actions du tour courant et des tours précédents
- Format : `[T.N] Joueur X : Guerrier → E4 capture Bélier`
- Typographie Lexend 300, taille petite, couleur `--muted`
- Scroll automatique vers le bas à chaque nouvelle entrée

#### `components/ui/PlayerPanel.tsx`
- Deux panels à gauche (P2 en haut, P1 en bas), largeur 260px
- Contenu : nom du joueur en gras (1rem), couleur (or/argent), unités capturées (slots 56×56px), disponibles au respawn
- Grappin capturé : affiché séparément en bas du panel, barré (hachures diagonales), non cliquable
- Indicateur visuel si c'est son tour

> **Note :** `TurnIndicator.tsx` supprimé du plateau — le numéro de tour est désormais dans le header du `GameLog`.

#### `components/ui/StunToken.tsx`
- Overlay visuel positionné sur l'unité stunnée (icône ou texte "STUNNED")
- Fade-in 200ms à l'apparition, fade-out à la suppression du stun

#### `components/ui/EndScreen.tsx`
- Overlay plein écran au-dessus du plateau
- Victoire : "JOUEUR X A GAGNÉ" + animation subtile
- Nul : "MATCH NUL — Répétition de position"
- Bouton "Rejouer" et "Menu principal"
- Design cohérent avec l'identité dark luxury medieval

---

#### `components/lobby/MainMenu.tsx`
- Logo LOGO_JEU_THRONES.svg centré
- Boutons : "Jouer en local", "Jouer contre l'IA", "Tutoriel", (grisé : "Jouer en ligne — bientôt")
- Design sobre, typographie Lexend 700 pour les CTAs

#### `components/lobby/ModeSelect.tsx` + `AIConfig.tsx`
- ModeSelect : Local / IA / Online (Online désactivé en Phase 1)
- AIConfig : 3 boutons niveau Facile / Moyen / Difficile avec description courte de chaque niveau

---

#### `components/tutorial/TutorialFlow.tsx` + `TutorialStep.tsx`
- Séquence d'étapes guidées sur un plateau simplifié
- Chaque étape : instruction textuelle + plateau avec unités positionnées + highlight des actions possibles
- Navigation : bouton "Suivant" pour valider chaque étape
- Étapes minimales à couvrir :
  1. Présentation du plateau et des pièces
  2. Le tour de jeu : une action par tour
  3. Le Bouclier — mouvement et ZoC
  4. Le Bélier — mouvement et charge
  5. Le Guerrier — mouvement et attaque du Trône
  6. Le Grappin — grappin et stun
  7. Les Tours — états et respawn
  8. Condition de victoire

---

#### `hooks/useGame.ts`
- Hook principal exposant les actions UI → jeu
- `selectUnit(hex)`, `moveUnit(from, to)`, `attackTarget(from, to)`, `respawnUnit(unit, hex)`, `useHook(from, target, dest)`
- Gère la logique de double-clic : premier clic = sélection, deuxième clic sur hex légal = action
- Appelle `gameStore.applyAction` avec l'action construite

#### `hooks/useAI.ts`
- Observe le `gameStore` — si c'est au tour de l'IA : appeler `engine/ai/index.getAIMove` dans un `setTimeout` (délai UX)
- Appeler `gameStore.applyAction` avec le coup de l'IA
- Désactiver les interactions utilisateur pendant le "réflexion" de l'IA (état `aiThinking` dans `uiStore`)

---

#### `pages/Home.tsx`
- Render `MainMenu` centré
- Background avec la grille hex animée de la landing (animation CSS, pas de JS)

#### `pages/Game.tsx`
- Layout : `HexBoard` central + `PlayerPanel` ×2 + `TurnIndicator` + `GameLog` rétractable
- `EndScreen` en overlay si la partie est terminée
- Bouton "Abandonner / Menu" en coin

#### `pages/Tutorial.tsx`
- Render `TutorialFlow`
- Bouton retour au menu

---

### PHASE 4 — TESTING & VALIDATION
*Agent responsable : **Agent 5 — QA** (voir [`AGENTS.md`](./AGENTS.md))*
*Référence complète : [`TESTING.md`](./TESTING.md) — protocoles exhaustifs, 9 scénarios, rapport de validation*

**Objectif :** Vérifier que le moteur est correct et que l'UI est jouable.

> Les scénarios ci-dessous sont un résumé. Les cas de test exhaustifs, les procédures de debug et le format du rapport de validation sont dans **`TESTING.md`**.

#### Tests moteur (manuels ou automatisés)

Créer un fichier `engine/__tests__/engine.test.ts` et couvrir les scénarios suivants :

- **Mouvement légal :** chaque type d'unité peut se déplacer sur ses hexes légaux uniquement
- **Blocage de chemin :** une unité ne peut pas traverser une autre unité
- **Combat RPS :** Bouclier capture Guerrier ✓, Bélier capture Bouclier ✓, Guerrier capture Bélier ✓, les inverses échouent ✓
- **Charge Bélier :** charge en ligne droite 1/2 hexes ✓, bloquée si unité entre eux ✓
- **Guerrier vs Trône :** Guerrier à 1-2 hexes capture le Trône et reste sur place ✓, aucune autre unité ne peut attaquer le Trône ✓
- **ZoC Bouclier :** unité ennemie adjacente au Bouclier ne peut que fuir ✓
- **Grappin :** tire ami (non stunné) ✓, tire ennemi (stunné) ✓, ne peut pas bouger s'il a grappé ✓, ne respawn jamais ✓
- **Tours :** états Active/Bloquée/Inactive correctement calculés ✓
- **Respawn :** unité placée directement sur le hex de la Tour Active (si libre) ✓, Grappin ne peut pas respawn ✓
- **Victoire :** Trône détruit → partie terminée immédiatement ✓
- **Nul :** même position ×3 → nul ✓
- **Stun :** unité stunnée passe son tour ✓, stun retiré au tour suivant ✓

#### Scénarios de jeu complets à tester manuellement

1. **Partie locale complète :** jouer une partie jusqu'à la victoire en mode Local 1v1
2. **Partie vs IA Facile :** vérifier que l'IA joue des coups valides sans crasher
3. **Partie vs IA Difficile :** vérifier que l'IA constitue un défi réel
4. **Test de la tortue :** un joueur joue défensivement — vérifier que la règle de répétition ×3 se déclenche correctement si applicable
5. **Test du Grappin :** vérifier le stun, le pull allié, l'impossibilité de se déplacer après grappin
6. **Test du respawn :** bloquer les deux Tours d'un joueur, vérifier qu'il ne peut pas respawn
7. **Tutoriel complet :** parcourir toutes les étapes du tutoriel sans erreur

#### Critères de validation finale Phase 1

- [ ] `vite dev` démarre sans erreur ni warning
- [ ] Le plateau de 61 hexagones s'affiche correctement
- [ ] Les SVGs d'unités s'affichent avec les bonnes couleurs or/argent
- [ ] On peut jouer une partie Local 1v1 complète sans crash
- [ ] On peut jouer contre l'IA aux 3 niveaux
- [ ] La détection de victoire fonctionne
- [ ] La détection de nul par répétition fonctionne
- [ ] Le tutoriel est jouable de bout en bout
- [ ] Les animations subtiles sont présentes et fluides
- [ ] La font Lexend (Google Fonts) se charge correctement avec toutes les graisses
- [ ] L'interface est cohérente avec l'identité dark luxury medieval

---

### PHASE 5 — SERVEUR & MODE ONLINE (Phase 2 — à implémenter après validation complète de la Phase 1)
*Agent responsable : **Agent 6 — Server** (voir [`AGENTS.md`](./AGENTS.md))*

> ⚠️ **Ne pas commencer cette phase tant que l'Agent 5 — QA n'a pas émis un statut global VALIDÉ.**

#### Setup serveur
```bash
mkdir server && cd server
npm init -y
npm install express ws better-sqlite3 jsonwebtoken bcrypt dotenv
npm install -D @types/express @types/ws @types/better-sqlite3 @types/jsonwebtoken @types/bcrypt typescript ts-node nodemon
```

#### Schéma DB réel (implémenté)

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  elo INTEGER NOT NULL DEFAULT 1000,
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  country TEXT,
  last_login TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- Glicko-2 (hidden — matchmaking only, not shown to users)
  hidden_mmr REAL NOT NULL DEFAULT 1500,
  rating_deviation REAL NOT NULL DEFAULT 350,
  volatility REAL NOT NULL DEFAULT 0.06,
  -- Visible rank fields (kept in DB for future use, not displayed)
  visible_tier TEXT NOT NULL DEFAULT 'PEASANT',
  visible_division TEXT,
  league_points INTEGER NOT NULL DEFAULT 0,
  season_number INTEGER NOT NULL DEFAULT 1,
  provisional_games_left INTEGER NOT NULL DEFAULT 10,
  total_ranked_games_played INTEGER NOT NULL DEFAULT 0,
  in_promotion_series INTEGER NOT NULL DEFAULT 0,
  promotion_wins INTEGER NOT NULL DEFAULT 0,
  promotion_losses INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player1_id INTEGER REFERENCES users(id),
  player2_id INTEGER REFERENCES users(id),
  winner_id INTEGER REFERENCES users(id),
  elo_change_p1 INTEGER NOT NULL DEFAULT 0,
  elo_change_p2 INTEGER NOT NULL DEFAULT 0,
  turns INTEGER,
  game_mode TEXT NOT NULL DEFAULT 'online_casual',
  mmr_change_p1 REAL,
  mmr_change_p2 REAL,
  lp_change_p1 INTEGER,
  lp_change_p2 INTEGER,
  ended_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE friends (
  user_id INTEGER REFERENCES users(id),
  friend_id INTEGER REFERENCES users(id),
  PRIMARY KEY (user_id, friend_id)
);
```

**Note sur le système de classement :**
- Seul l'**ELO** (formule K=32 standard) est affiché aux utilisateurs partout dans l'interface.
- Le système Glicko-2 (`shared/ranked.ts`) tourne en backend pour le hidden MMR (matchmaking), mais ses tiers/divisions/LP ne sont **pas affichés**.
- Un joueur est **UNRANKED** tant que `provisional_games_left > 0` (10 parties de placement). Il n'apparaît pas dans le leaderboard mais apparaît dans la page Players avec le label UNRANKED.
- Tout le monde commence à ELO 1000. L'ELO est affiché à côté du pseudo sur le profil.

#### `server/src/ws/roomManager.ts` (implémenté)
- Rooms en mémoire : `Map<roomCode, Room>`
- `Room` : `{ code, players: RoomPlayer[], gameState, status: 'waiting'|'playing'|'finished', ranked?: boolean }`
- Matchmaking : files séparées `rankedQueue` et `casualQueue`
- Gestion déconnexion : victoire par forfait si partie en cours

#### `server/src/ws/gameSession.ts` (implémenté)
- `handleGameOver(room, winnerSlot, isDraw, turns, gameMode)`
- Ranked : calcule ELO (K=32) + Glicko-2 via `processMatchResult` → persiste avec `updateRankedFields` + `setEloOnly`
- Casual : sauvegarde partie, ELO inchangé
- Envoie `GAME_OVER` à chaque joueur avec `eloChangeMe`, `newEloMe`

#### `server/src/api/` (implémenté)
- `POST /api/register` — créer un compte
- `POST /api/login` — JWT 7 jours
- `GET /api/me` — profil du compte connecté
- `GET /api/profile/:username` — profil public
- `PUT /api/profile` — modifier le pays
- `GET /api/history/:username?page=N` — historique paginé (15/page)
- `GET /api/leaderboard` — top 50 joueurs **ayant terminé le placement**, triés par ELO DESC
- `GET /api/players` — **tous** les joueurs triés alphabétiquement, avec `isInPlacement` flag
- `POST /api/friends/:username` — ajouter un ami
- `DELETE /api/friends/:username` — retirer un ami
- `GET /api/friends` — liste d'amis
- `GET /api/friends/check/:username` — vérifier si ami

#### `client/src/hooks/useSocket.ts` (implémenté)
- Store Zustand `useOnlineStore` : `status`, `roomCode`, `playerSlot`, `opponentUsername`, `opponentElo`, `opponentInPlacement`, `isRanked`
- Gestion WebSocket : reconnexion, PING/PONG keepalive
- Messages : `ROOM_JOINED`, `GAME_STATE`, `GAME_OVER`, `PLAYER_DISCONNECTED`, `MATCHMAKING_JOIN/LEAVE`

#### Pages online implémentées
- `/leaderboard` — Ranking par ELO (joueurs ayant terminé le placement uniquement)
- `/players` — Tous les joueurs alphabétiques + champ de recherche + UNRANKED pour ceux en placement
- `/profile/:username` — Profil avec ELO affiché à côté du pseudo, historique paginé, amis, pays

---

---

## 6. Fichiers du Projet — Index Complet

```
thrones/
├── CLAUDE.md       ← Ce fichier — plan d'implémentation central
├── AGENTS.md       ← Orchestration des agents — périmètres, séquence, handoffs
├── RULES.md        ← Règles officielles du jeu en format technique
├── DESIGN.md       ← Système de design complet — tokens, composants, animations
├── TESTING.md      ← Protocoles de test, 9 scénarios, checklist de validation
├── client/         ← Frontend React + Vite + TypeScript (Phase 1)
├── server/         ← Backend Node.js + WebSocket + SQLite (Phase 2)
└── shared/         ← Types partagés client/serveur
```

### Responsabilités par fichier

| Fichier | Créé par | Utilisé par |
|---|---|---|
| `CLAUDE.md` | Architecte Vibe Coding | Tous les agents |
| `AGENTS.md` | Architecte Vibe Coding | Tous les agents — lire en premier |
| `RULES.md` | Architecte Vibe Coding | Agent 2 (Engine), Agent 5 (QA) |
| `DESIGN.md` | Architecte Vibe Coding | Agent 1 (CSS), Agent 3 (UI), Agent 4 (Integration) |
| `TESTING.md` | Architecte Vibe Coding | Agent 5 (QA) |

---

*THRONES · Implementation Plan v1 · First Edition 2026*
