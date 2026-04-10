# AGENTS.md — Équipe d'agents · THRONES v1
*Orchestration multi-agents pour Claude Code*

> Ce fichier définit l'équipe d'agents spécialisés chargés d'implémenter le projet Thrones.
> Chaque agent a un périmètre strict, des inputs définis et des outputs vérifiables.
> **Un agent ne commence jamais tant que l'agent précédent n'a pas livré ses outputs validés.**

---

## Fichiers de référence du projet

| Fichier | Rôle | Consulté par |
|---|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | Plan d'implémentation complet — source de vérité technique | Tous les agents |
| [`RULES.md`](./RULES.md) | Règles officielles du jeu — référence moteur | Agent 2 (Engine) |
| [`DESIGN.md`](./DESIGN.md) | Système de design complet — référence visuelle | Agent 3 (UI), Agent 4 (Integration) |
| [`TESTING.md`](./TESTING.md) | Protocoles de test et critères de validation | Agent 5 (QA) |
| [`AGENTS.md`](./AGENTS.md) | Ce fichier — orchestration de l'équipe | Tous les agents |

---

## Vue d'ensemble de l'équipe

```
┌─────────────────────────────────────────────────────────────────┐
│                    THRONES — AGENT TEAM v1                      │
├──────────┬──────────────────┬───────────────────────────────────┤
│ AGENT 1  │  Architect       │  Setup, structure, CSS            │
│ AGENT 2  │  Engine          │  Moteur de jeu, IA                │
│ AGENT 3  │  UI              │  Composants, plateau, pages       │
│ AGENT 4  │  Integration     │  Assemblage, store, hooks, polish │
│ AGENT 5  │  QA              │  Tests, validation, debug         │
│ AGENT 6  │  Server          │  Backend, WebSocket, online       │
└──────────┴──────────────────┴───────────────────────────────────┘

Phase 1 (client seul)  : Agents 1 → 2 → 3 → 4 → 5
Phase 2 (serveur)      : Agent 6 (après validation complète Phase 1)
```

---

## AGENT 1 — Architect
### Périmètre : Setup, structure du projet, système CSS

**Objectif :** Livrer un projet qui démarre proprement avec `vite dev`, la bonne structure de fichiers, et le système de design CSS complet en place.

**Lire avant de commencer :**
- `CLAUDE.md` → Section 2 (Tech Stack), Section 4 (File Structure), Section 5 Phase 1
- `DESIGN.md` → Sections 2, 3, 4 (typographie, palette, thèmes)

**Instructions :**

1. Créer le workspace racine et initialiser le client Vite :
```bash
mkdir thrones && cd thrones
npm init -y
npm create vite@latest client -- --template react-ts
cd client
npm install zustand react-router-dom
npm install -D @types/react @types/react-dom
```

2. Créer **l'intégralité** de l'arborescence définie dans `CLAUDE.md` Section 4.
   Les fichiers vides que les agents suivants rempliront doivent contenir un commentaire indiquant quel agent les prendra en charge :
   ```ts
   // TODO: Agent 2 — Engine
   ```

3. Copier les SVGs dans leurs dossiers :
   - `client/public/assets/units/` : Bouclier.svg, Belier.svg, Guerrier.svg, Grappin.svg, Tour.svg, Trone.svg
   - `client/public/assets/logo/` : LOGO_JEU_THRONES.svg

4. Configurer `vite.config.ts` :
   - Alias `@/` → `src/`
   - Port de dev fixé à 5173

5. Implémenter les fichiers CSS complets (valeurs exactes dans `DESIGN.md`) :
   - `client/src/styles/globals.css` — reset, import Fontshare, variables `:root`
   - `client/src/styles/tokens.css` — design tokens (spacing, radius, shadows)
   - `client/src/styles/themes/default.css` — variables du plateau uniquement (architecture swappable v2)

6. Implémenter `client/index.html` avec title "Thrones", meta viewport, charset, lang="fr".

7. Implémenter `client/src/main.tsx` et `client/src/App.tsx` :
   - react-router-dom v6 avec `BrowserRouter`
   - Routes : `/` → `<Home />`, `/game` → `<Game />`, `/tutorial` → `<Tutorial />`
   - Pages en stub (composant vide avec un `<h1>` titre)

8. Valider : `vite dev` démarre sans erreur, fonts Stardom + Switzer chargées (onglet Network).

**Outputs à livrer :**
- [ ] Structure complète des dossiers créée
- [ ] SVGs en place dans `public/assets/`
- [ ] Les 3 fichiers CSS complets et fonctionnels
- [ ] `vite dev` démarre sans erreur ni warning
- [ ] Fonts Stardom et Switzer chargées (vérifiable dans DevTools → Network)

**Handoff vers Agent 2 :** Confirmer que le projet démarre. Transmettre le chemin racine du projet.

---

## AGENT 2 — Engine
### Périmètre : Moteur de jeu pur (zéro UI), Intelligence Artificielle

**Objectif :** Livrer un moteur de jeu 100% fonctionnel, pure TypeScript, sans aucune dépendance React ou UI. Tous les tests unitaires doivent passer.

**Lire avant de commencer :**
- `CLAUDE.md` → Section 5 Phase 2 (Core Engine) — specs détaillées de chaque fichier
- `RULES.md` → Document complet — source de vérité absolue pour toutes les règles du jeu

**Principe fondamental :**
> Le moteur est une bibliothèque de fonctions pures. Chaque fonction prend un état en entrée et retourne un nouvel état. Zéro mutation. Zéro side effect. Zéro dépendance React.

**Ordre d'implémentation strict :**

```
engine/types.ts          ← En premier. Tout dépend de ces types.
engine/hex.ts            ← Géométrie hexagonale pure
engine/board.ts          ← Plateau initial, accesseurs
engine/zoc.ts            ← Zone de Contrôle Bouclier (dépend de hex + board)
engine/moves.ts          ← Mouvements légaux (dépend de zoc)
engine/combat.ts         ← Résolution des combats (dépend de moves)
engine/tower.ts          ← États des Tours (dépend de board + hex)
engine/respawn.ts        ← Respawn (dépend de tower)
engine/hook.ts           ← Logique Grappin (dépend de hex + board)
engine/victory.ts        ← Victoire / Nul / Répétition (dépend de board)
engine/gameState.ts      ← Orchestrateur central (dépend de tout)
engine/ai/evaluate.ts    ← Évaluation du plateau
engine/ai/random.ts      ← IA Facile — coups aléatoires valides
engine/ai/heuristic.ts   ← IA Moyen — scoring heuristique profondeur 1
engine/ai/minimax.ts     ← IA Difficile — minimax + alpha-beta pruning
engine/ai/index.ts       ← Interface unifiée IA (dispatcher)
```

**Règles de codage :**
- Types TypeScript explicites sur toutes les fonctions exportées (jamais de `any`)
- Commentaire JSDoc minimal sur chaque fonction exportée
- Commenter les décisions de règles avec une référence : `// RULES.md §5 — Guerrier reste sur place`
- Aucun `console.log` en production

**Tests :** Installer Vitest et écrire les tests au fil de l'implémentation.
```bash
cd client && npm install -D vitest
npx vitest run
```
Se référer à `TESTING.md` Section 2 pour les cas de test exacts à couvrir.

**Outputs à livrer :**
- [ ] Tous les fichiers `engine/` implémentés et fonctionnels
- [ ] Tous les fichiers `engine/ai/` implémentés
- [ ] `npx vitest run` : 0 test en échec
- [ ] `npx tsc --noEmit` : 0 erreur TypeScript
- [ ] Le moteur est entièrement isolé de toute logique UI

**Handoff vers Agent 3 :** Documenter les exports publics de `engine/gameState.ts` et `engine/types.ts`. Ce sont les interfaces que l'UI consommera.

---

## AGENT 3 — UI
### Périmètre : Composants React, plateau SVG, pages

**Objectif :** Livrer tous les composants visuels de l'application. Chaque composant doit être fonctionnel, stylé fidèlement à `DESIGN.md`, et prêt à être connecté aux stores par l'Agent 4.

**Lire avant de commencer :**
- `CLAUDE.md` → Section 5 Phase 3 (UI / Frontend) — specs de chaque composant
- `DESIGN.md` → Document complet — source de vérité visuelle
- Les exports de `engine/types.ts` (fournis par Agent 2)

**Ordre d'implémentation recommandé :**

```
1. Stores Zustand (stubs — structure et types seulement, logique par Agent 4)
   store/gameStore.ts
   store/uiStore.ts

2. Composants board (cœur de l'interface)
   components/board/HexCell.tsx
   components/board/TowerHex.tsx
   components/board/ThroneHex.tsx
   components/board/UnitPiece.tsx
   components/board/HexBoard.tsx    ← assemble les 4 précédents

3. Composants UI
   components/ui/StunToken.tsx
   components/ui/TurnIndicator.tsx
   components/ui/PlayerPanel.tsx
   components/ui/GameLog.tsx
   components/ui/EndScreen.tsx

4. Composants lobby
   components/lobby/AIConfig.tsx
   components/lobby/ModeSelect.tsx
   components/lobby/MainMenu.tsx

5. Composants tutoriel (structure, contenu par Agent 4)
   components/tutorial/TutorialStep.tsx
   components/tutorial/TutorialFlow.tsx

6. Pages assemblées
   pages/Home.tsx
   pages/Game.tsx
   pages/Tutorial.tsx
```

**Règles de codage :**
- CSS Modules pour le styling des composants (fichiers `.module.css` par composant)
- Jamais de couleur hardcodée dans les composants — toujours `var(--token-name)` depuis `DESIGN.md`
- Les composants board reçoivent leurs données exclusivement via props — zéro logique de jeu dedans
- Le plateau SVG doit être responsive (viewBox dynamique calculé depuis `hex.ts`)

**Point critique — SVGs des unités :**
Installer `vite-plugin-svgr` pour importer les SVGs comme composants React avec fill contrôlable via CSS :
```bash
npm install -D vite-plugin-svgr
```
Configurer dans `vite.config.ts`, puis importer :
```tsx
import { ReactComponent as BouclierIcon } from '@/assets/units/Bouclier.svg'
```
Le `fill` des SVGs d'unités est contrôlé par classe CSS (`.unit-p1` → `var(--unit-fill-p1)`).

**Outputs à livrer :**
- [ ] Tous les composants `board/` fonctionnels et stylés
- [ ] Tous les composants `ui/` fonctionnels et stylés
- [ ] Tous les composants `lobby/` fonctionnels et stylés
- [ ] Composants `tutorial/` en place (contenu stub)
- [ ] Pages `Home`, `Game`, `Tutorial` assemblées visuellement
- [ ] L'interface correspond à `DESIGN.md` (layout, couleurs, typographie)
- [ ] `npx tsc --noEmit` : 0 erreur TypeScript

**Handoff vers Agent 4 :** Documenter les props attendues par `HexBoard`, `HexCell`, `UnitPiece` pour que l'Agent 4 connecte les stores correctement.

---

## AGENT 4 — Integration
### Périmètre : Stores Zustand, hooks, connexion moteur ↔ UI, polish final

**Objectif :** Rendre le jeu jouable de bout en bout en connectant le moteur (Agent 2) à l'interface (Agent 3) via les stores Zustand et les hooks React. Puis polisher l'expérience.

**Lire avant de commencer :**
- `CLAUDE.md` → Section 5 Phase 3 (stores, hooks — détails)
- Les exports de `engine/gameState.ts` (Agent 2)
- Les props des composants (Agent 3)
- `DESIGN.md` → Section 7 (animations)

**Ordre d'implémentation :**

```
1. Finaliser les stores Zustand
   store/gameStore.ts    ← connecte engine/gameState.ts
   store/uiStore.ts      ← gère selectedHex, legalMoves, aiThinking

2. Implémenter les hooks
   hooks/useGame.ts      ← logique de clic, sélection, construction des actions
   hooks/useAI.ts        ← déclenchement IA, délai artificiel, désactivation UI

3. Connecter HexBoard aux stores
   — selectHex() sur clic d'unité alliée
   — applyAction() sur clic de hex légal
   — aiThinking désactive toutes les interactions

4. Connecter les composants UI aux stores
   — TurnIndicator ← gameStore.currentPlayer, turnNumber
   — PlayerPanel ← gameStore.capturedUnits
   — GameLog ← gameStore.actionLog
   — EndScreen ← gameStore.winner, gameStore.isDraw

5. Connecter le menu aux actions de jeu
   — MainMenu → initGame('local') ou initGame('ai', level)
   — ModeSelect / AIConfig → configurer le mode avant de lancer

6. Implémenter le contenu du tutoriel (8 étapes)
   — BoardState préconfigurée par étape
   — Texte guidé + highlights des actions possibles

7. Polish des animations
   — Vérifier toutes les transitions CSS (DESIGN.md Section 7)
   — Vérifier le délai IA (300-600ms)
   — Vérifier le scroll automatique du GameLog
   — Vérifier la désactivation UI pendant le tour IA
```

**Logique de `useGame.ts` :**
```
Premier clic sur hex avec unité alliée :
  → uiStore.selectHex(hex)
  → calcule getLegalMoves() + getLegalAttacks() via moteur
  → stocke dans uiStore.legalMoves / legalAttacks

Deuxième clic sur hex de mouvement légal :
  → construit TurnAction de type MOVE
  → gameStore.applyAction(action)
  → uiStore.clearSelection()

Deuxième clic sur hex d'attaque légal :
  → construit TurnAction de type ATTACK (ou HOOK_PULL)
  → gameStore.applyAction(action)
  → uiStore.clearSelection()

Clic hors hexes légaux :
  → uiStore.clearSelection()
```

**Logique de `useAI.ts` :**
```
Observer gameStore.currentPlayer
Si currentPlayer === AI_PLAYER && phase === PLAYING :
  1. uiStore.setAiThinking(true)       ← désactive tous les clics
  2. setTimeout(() => {                ← délai artificiel 400ms
       const action = getAIMove(gameState, level)
       gameStore.applyAction(action)
       uiStore.setAiThinking(false)
     }, 400)
```

**Outputs à livrer :**
- [ ] `gameStore.ts` complet et connecté au moteur
- [ ] `uiStore.ts` complet
- [ ] `useGame.ts` opérationnel (sélection + action en 2 clics)
- [ ] `useAI.ts` opérationnel (délai + désactivation UI)
- [ ] Partie Local 1v1 jouable de bout en bout sans crash
- [ ] Partie vs IA aux 3 niveaux jouable sans crash
- [ ] Tutoriel navigable (8 étapes)
- [ ] Animations conformes à `DESIGN.md` Section 7

**Handoff vers Agent 5 :** Confirmer que toutes les features Phase 1 sont fonctionnelles. Lister les edge cases connus ou comportements à surveiller.

---

## AGENT 5 — QA
### Périmètre : Tests, validation, debug, rapport final

**Objectif :** Valider que le jeu est correct (règles respectées), stable (zéro crash) et visuellement conforme. Produire le rapport de validation. Corriger les bugs critiques et majeurs.

**Lire avant de commencer :**
- `TESTING.md` → Document complet — protocoles de test exhaustifs
- `RULES.md` → Pour vérifier chaque règle du jeu
- `DESIGN.md` → Pour valider le rendu visuel

**Ordre d'exécution strict :**

```
Étape 1 — Tests unitaires automatisés (TESTING.md Section 2)
  cd client && npx vitest run
  → Corriger TOUS les tests en échec avant de continuer

Étape 2 — Tests d'intégration (TESTING.md Section 3)
  → Vérifier la connexion store + moteur dans la console navigateur

Étape 3 — Tests visuels (TESTING.md Section 4)
  → Inspecter l'UI point par point dans Chrome DevTools

Étape 4 — Scénarios de parties complètes (TESTING.md Section 5)
  → Jouer les 9 scénarios définis dans l'ordre

Étape 5 — Checklist finale (TESTING.md Section 6)
  → Valider chaque point de la checklist

Étape 6 — Rapport de validation (TESTING.md Section 8)
  → Produire le rapport complet avec statut global
```

**Règles de l'Agent QA :**
- Ne jamais modifier `engine/` sans vérifier `RULES.md` en premier
- Un bug de règle de jeu est toujours **critique** — corriger avant de continuer
- Ne pas introduire de nouvelles features — uniquement corriger

**Sévérité des bugs :**
| Niveau | Description | Action requise |
|---|---|---|
| **Critique** | Règle de jeu incorrecte, crash, freeze | Corriger immédiatement |
| **Majeur** | Feature manquante, comportement anormal | Corriger avant validation |
| **Mineur** | Bug visuel, texte incorrect | Corriger si rapide, sinon documenter |
| **Cosmétique** | Léger décalage visuel, animation imparfaite | Documenter pour itération suivante |

**Outputs à livrer :**
- [ ] `npx vitest run` : 0 test en échec
- [ ] Les 9 scénarios de parties validés
- [ ] Checklist finale Phase 1 : tous les points cochés
- [ ] Rapport de validation produit (format dans `TESTING.md` Section 8)
- [ ] Statut global : **VALIDÉ** — Phase 1 prête

---

## AGENT 6 — Server
### Périmètre : Backend Node.js, WebSocket, mode online (Phase 2)

> ⚠️ **NE PAS COMMENCER avant que l'Agent 5 ait émis un statut global VALIDÉ.**

**Objectif :** Implémenter le serveur Node.js permettant le mode online 1v1 via WebSocket. Testable en réseau local ou via ngrok pour un ami distant.

**Lire avant de commencer :**
- `CLAUDE.md` → Section 5 Phase 5 (Serveur & Mode Online) — specs complètes
- `CLAUDE.md` → Section 4 (File Structure — dossier `server/`)

**Instructions :**

1. Setup :
```bash
cd thrones/server
npm init -y
npm install express ws better-sqlite3 jsonwebtoken bcrypt dotenv
npm install -D @types/express @types/ws @types/better-sqlite3 @types/jsonwebtoken @types/bcrypt typescript ts-node nodemon
```

2. Ordre d'implémentation :
```
shared/types.ts               ← Types WS partagés client/serveur (en premier)
server/src/config.ts          ← Variables d'environnement (.env)
server/src/db/schema.sql      ← Schéma SQLite (users, games)
server/src/db/database.ts     ← Init DB + better-sqlite3
server/src/db/queries.ts      ← Requêtes préparées
server/src/middleware/auth.ts ← Middleware JWT
server/src/api/auth.ts        ← Routes /register, /login, /me
server/src/ws/roomManager.ts  ← Rooms en mémoire (Map)
server/src/ws/gameSession.ts  ← Sync état entre 2 clients
server/src/ws/wsServer.ts     ← Serveur WebSocket principal
server/src/index.ts           ← Entry point Express + WS
```

3. Côté client (à ajouter après le serveur) :
```
shared/types.ts → importer dans le client
store/authStore.ts
hooks/useSocket.ts
components/lobby/CreateRoom.tsx
components/lobby/JoinRoom.tsx
components/auth/LoginForm.tsx
components/auth/RegisterForm.tsx
pages/Auth.tsx
```

4. Activer les boutons Online (désactivés en Phase 1) dans `MainMenu.tsx` et `ModeSelect.tsx`.

5. Test réseau local :
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev

# Ouvrir 2 onglets sur localhost:5173
# Créer une room dans le 1er onglet → copier le code → rejoindre dans le 2e
```

6. Test ami distant :
```bash
ngrok http 5173
# Partager l'URL ngrok à l'ami
```

**Outputs à livrer :**
- [ ] Serveur démarre sans erreur (`npm run dev`)
- [ ] Auth register + login fonctionnelle (tester avec curl ou Postman)
- [ ] Création de room : code 6 caractères généré et affiché
- [ ] Rejoindre une room avec le code : connexion effective
- [ ] Partie online jouable de bout en bout (2 onglets)
- [ ] Synchronisation en temps réel correcte (les 2 joueurs voient le même état)
- [ ] Déconnexion d'un joueur : message affiché à l'autre

---

## Règles générales — Tous les agents

1. **Lire les fichiers de référence avant d'écrire la moindre ligne de code.** Ne pas partir d'hypothèses.

2. **Ne jamais implémenter la phase d'un autre agent.** Si un agent termine tôt, il documente et attend.

3. **Commenter les décisions non évidentes.** Référencer `RULES.md` ou `DESIGN.md` en commentaire quand une règle spécifique est implémentée.

4. **En cas d'ambiguïté :**
   - Sur une règle de jeu → `RULES.md` a priorité sur `CLAUDE.md`
   - Sur un design → `DESIGN.md` a priorité sur `CLAUDE.md`

5. **Aucune couleur hardcodée.** Toujours `var(--nom-du-token)`.

6. **Aucune logique de jeu dans les composants React.** Les composants affichent et capturent les interactions — le moteur calcule.

7. **Fonctions pures dans `engine/`.** Jamais de mutation directe d'un objet reçu en paramètre. Toujours retourner un nouvel objet.

---

*THRONES · AGENTS.md · v1 · Équipe d'agents Claude Code*
