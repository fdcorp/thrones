# TESTING.md — Protocoles de test & Validation · THRONES v1
*Référence complète pour l'Agent QA*

> Ce document définit tous les scénarios de test, critères de validation et procédures de debug.
> L'Agent QA doit traiter chaque section dans l'ordre. Aucun critère ne peut être ignoré.
> Référencé par : `CLAUDE.md` Section 5 Phase 4, `AGENTS.md` Agent 5.

---

## 1. Philosophie de test

Le moteur de jeu est le cœur du projet. Un bug dans `engine/` peut rendre le jeu injouable ou tricher les règles officielles. Les tests du moteur sont donc **prioritaires** et doivent être validés en isolation, avant que l'UI soit testée.

**Ordre de test :**
1. Tests unitaires du moteur (automatisés)
2. Tests d'intégration moteur → store (semi-automatisés)
3. Tests UI et visuels (manuels)
4. Tests de parties complètes (manuels)
5. Tests de régression (après chaque correction)

---

## 2. Tests unitaires — Moteur de jeu

Fichier : `client/src/engine/__tests__/engine.test.ts`

> Utiliser **Vitest** (inclus dans Vite). Commande : `cd client && npx vitest run`

### 2.1 — `hex.ts`

```
✅ getNeighbors() retourne exactement 6 voisins pour un hex central
✅ getNeighbors() retourne < 6 voisins pour un hex de bord
✅ hexDistance(A, A) === 0
✅ hexDistance(A, B) === hexDistance(B, A) (symétrie)
✅ hexDistance entre deux hexes adjacents === 1
✅ hexesInRange(center, 0, 0) retourne [center]
✅ hexesInRange(center, 1, 1) retourne les 6 voisins
✅ generateBoard61() retourne exactement 61 hexes uniques
✅ generateBoard61() : tous les hexes respectent q + r + s === 0
✅ hexesInLine() retourne les hexes dans la bonne direction, longueur correcte
✅ hexToPixel() → pixelToHex() round-trip donne le hex original (± epsilon)
```

### 2.2 — `board.ts`

```
✅ createInitialBoard() retourne 16 unités (8 par joueur)
✅ createInitialBoard() : P1 a 3 Boucliers, 2 Béliers, 2 Guerriers, 1 Grappin
✅ createInitialBoard() : P2 a 3 Boucliers, 2 Béliers, 2 Guerriers, 1 Grappin
✅ createInitialBoard() : 2 Tours et 1 Trône par joueur correctement placés
✅ createInitialBoard() : aucune unité sur un hex Tour ou Trône
✅ createInitialBoard() : positions P1 et P2 symétriques
✅ getUnitAt() retourne l'unité correcte à un hex donné
✅ getUnitAt() retourne null sur un hex vide
✅ isHexOccupied() : true si unité présente, false sinon
✅ getPlayerUnits() retourne exactement les unités du joueur demandé
```

### 2.3 — `zoc.ts`

```
✅ Un Bouclier P1 en position X exerce ZoC sur tous ses 6 hexes adjacents
✅ isUnderZoc() : unité P2 adjacente à un Bouclier P1 → true
✅ isUnderZoc() : unité P2 non adjacente à un Bouclier P1 → false
✅ isUnderZoc() : le Bouclier P1 lui-même n'est pas sous ZoC de ses propres Boucliers
✅ canOnlyEscape() : unité sous ZoC peut se déplacer (mouvement légal non vide)
✅ canOnlyEscape() : unité sous ZoC ne peut pas attaquer
✅ La ZoC ne bloque pas le passage — une unité peut traverser un hex sous ZoC si le mouvement est valide
```

### 2.4 — `moves.ts`

```
✅ Bouclier : mouvements légaux = hexes adjacents libres (max 6)
✅ Bouclier : ne peut pas se déplacer sur un hex occupé
✅ Bouclier : ne peut pas se déplacer sur un hex Tour ou Trône
✅ Bélier : peut se déplacer de 1 ou 2 hexes en LIGNE DROITE uniquement
✅ Bélier : ne peut pas se déplacer en diagonale (changement de direction interdit)
✅ Bélier : bloqué si une unité occupe la case intermédiaire (pour 2 hexes)
✅ Guerrier : peut se déplacer de 1 ou 2 hexes via chemin libre (toute direction)
✅ Guerrier : ne peut pas sauter par-dessus une unité (chemin intermédiaire doit être libre)
✅ Grappin : mouvement normal = 1 hex adjacent libre
✅ Grappin : ne peut pas se déplacer s'il a utilisé son grappin ce tour
✅ Toutes unités : aucun mouvement vers un hex occupé (amie ou ennemie)
✅ Toutes unités : aucun mouvement vers hex Tour ou Trône
✅ getLegalMoves() retourne [] si aucun mouvement possible
```

### 2.5 — `combat.ts`

**Chaîne de combat — captures légales**
```
✅ Bouclier peut attaquer un Guerrier adjacent
✅ Bouclier peut attaquer un Grappin adjacent
✅ Bouclier NE PEUT PAS attaquer un Bélier
✅ Bouclier NE PEUT PAS attaquer un autre Bouclier
✅ Bélier peut charger un Bouclier en ligne droite (distance 1, 2 et 3)
✅ Bélier peut charger un Grappin en ligne droite (distance 1, 2 et 3)
✅ Bélier NE PEUT PAS charger si une unité se trouve entre lui et la cible
✅ Bélier NE PEUT PAS attaquer un Guerrier
✅ Bélier NE PEUT PAS attaquer un autre Bélier
✅ Guerrier peut attaquer un Bélier à distance 1 ou 2 (chemin libre)
✅ Guerrier peut attaquer un Grappin à distance 1 ou 2 (chemin libre)
✅ Guerrier NE PEUT PAS attaquer à distance 2 si le chemin est bloqué
✅ Guerrier NE PEUT PAS attaquer un Bouclier
✅ Guerrier NE PEUT PAS attaquer un autre Guerrier
✅ Aucune unité ne peut attaquer un Grappin allié
```

**Déplacements post-capture**
```
✅ Après capture Bouclier→Guerrier : Bouclier est sur le hex du Guerrier capturé
✅ Après capture Bouclier→Grappin : Bouclier est sur le hex du Grappin capturé
✅ Après charge Bélier→Bouclier : Bélier est sur le hex du Bouclier capturé
✅ Après charge Bélier→Grappin : Bélier est sur le hex du Grappin capturé
✅ Après capture Guerrier→Bélier : Guerrier est sur le hex du Bélier capturé
✅ Après capture Guerrier→Grappin : Guerrier est sur le hex du Grappin capturé
```

**Attaque du Trône — cas unique**
```
✅ Guerrier à distance 1 du Trône ennemi peut l'attaquer
✅ Guerrier à distance 2 du Trône ennemi peut l'attaquer (chemin libre)
✅ Guerrier à distance 2 NE PEUT PAS attaquer si le chemin est bloqué
✅ Après kill du Trône : le Guerrier RESTE sur son hex (ne se déplace pas)
✅ Aucune autre unité (Bouclier, Bélier, Grappin) ne peut attaquer le Trône
✅ Trône détruit → état Throne.alive === false
```

**Gestion des capturés**
```
✅ Unité capturée retirée du board
✅ Unité capturée ajoutée aux capturedUnits du joueur adverse
✅ L'unité capturée n'apparaît plus dans getPlayerUnits()
```

### 2.6 — `tower.ts`

```
✅ Tour avec ≥1 unité amie adjacente et aucune ennemie → ACTIVE
✅ Tour avec ≥1 unité ennemie adjacente → BLOQUÉE (même si unité amie aussi adjacente)
✅ Tour sans unité amie adjacente → INACTIVE
✅ updateTowerStates() recalcule correctement après chaque mouvement
✅ getActiveTowers() ne retourne que les Tours à l'état ACTIVE
```

### 2.7 — `respawn.ts`

```
✅ getLegalRespawnHexes() retourne les hexes libres adjacents à une Tour Active
✅ getLegalRespawnHexes() retourne [] si aucune Tour Active disponible
✅ resolveRespawn() place l'unité sur le bon hex
✅ L'unité respawnée apparaît dans getPlayerUnits() avec alive: true
✅ Le Grappin ne peut JAMAIS respawn (rejeté même s'il est dans capturedUnits)
✅ Erreur si hex cible non adjacent à une Tour Active
✅ Erreur si hex cible occupé
```

### 2.8 — `hook.ts`

```
✅ getLegalGrappleTargets() retourne uniquement les ennemis (pas d'alliés, pas d'autre Grappin)
✅ getLegalGrappleTargets() : portée jusqu'à 4 hexes en ligne droite dans chaque direction
✅ getLegalGrappleTargets() : s'arrête à la première unité rencontrée (alliée bloque la ligne de vue)
✅ getLegalGrappleTargets() : exclut les cibles dont la case d'atterrissage est occupée ou spéciale
✅ getLegalGrappleDestinations() retourne exactement 1 hex (le hex entre Grappin et cible)
✅ getLegalGrappleDestinations() retourne [] si ce hex est occupé ou spécial
✅ Cible ennemie tirée → stunnée (stunned: true), passe son prochain tour entier
✅ La cible est bien déplacée sur le hex entre Grappin et cible (1 pas vers la cible)
✅ Le Grappin ne tue pas — l'unité cible reste alive: true
✅ Après grappin : getLegalMoves() pour ce Grappin retourne []
✅ Grappin ne peut pas attirer un autre Grappin ennemi
✅ Grappin ne peut pas attirer ses propres alliés
```

### 2.9 — `victory.ts`

```
✅ Trône P1 alive: false → winner: P2
✅ Trône P2 alive: false → winner: P1
✅ Aucun Trône détruit → winner: null
✅ Même position 3 fois dans positionHistory → draw: true, reason: 'repetition'
✅ Même position 2 fois → draw: false (pas encore nul)
✅ serializePosition() : deux états identiques donnent la même chaîne
✅ serializePosition() : deux états différents donnent des chaînes différentes
```

### 2.10 — `gameState.ts`

```
✅ initGame() retourne un GameState valide avec phase: PLAYING
✅ applyAction(MOVE) déplace l'unité correctement
✅ applyAction(ATTACK) résout le combat et met à jour le board
✅ applyAction(RESPAWN) place l'unité et passe le tour
✅ applyAction(HOOK_PULL) exécute le grappin correctement
✅ Après chaque applyAction : les états des Tours sont recalculés
✅ Après chaque applyAction : la victoire est vérifiée
✅ Après chaque applyAction : la position est enregistrée dans positionHistory
✅ Après chaque applyAction : le tour passe au joueur suivant
✅ applyAction() est une fonction pure — ne mute pas le state original
✅ Action illégale → erreur levée (pas de state corrompu)
✅ Unité stunnée : ne peut pas jouer pendant son tour (skippé)
✅ Stun retiré après que l'unité a passé son tour (au début du tour suivant du joueur)
✅ Unité grapplée → stunnée → passe un tour → retrouve son comportement normal
```

### 2.11 — `ai/` — Tests de sanité

```
✅ randomMove() retourne une TurnAction valide (incluse dans getLegalActions())
✅ heuristicMove() retourne une TurnAction valide
✅ minimaxMove() retourne une TurnAction valide
✅ Aucune fonction IA ne mute le GameState reçu en entrée
✅ minimaxMove() termine en < 3 secondes sur un plateau de départ
✅ L'IA ne joue jamais sur un hex occupé par une unité amie
✅ L'IA préfère l'attaque du Trône quand elle est possible (niveau Difficile)
```

---

## 3. Tests d'intégration — Store + Moteur

> Tests manuels dans la console du navigateur (`vite dev`).

### 3.1 — gameStore
```
✅ initGame('local') initialise le state correctement
✅ applyAction() dans le store met à jour le gameState dans Zustand
✅ Le store notifie les composants React abonnés après chaque applyAction()
✅ resetGame() remet le store à son état initial
```

### 3.2 — uiStore
```
✅ selectHex() sur un hex avec unité alliée → legalMoves calculés et stockés
✅ selectHex() sur un hex vide → legalMoves = []
✅ clearSelection() remet selectedHex et legalMoves à null/[]
✅ legalMoves mis à jour correctement après chaque applyAction()
```

### 3.3 — useGame hook
```
✅ Premier clic sur une unité alliée → sélection (selectedHex mis à jour)
✅ Deuxième clic sur un hex de mouvement légal → applyAction(MOVE) déclenché
✅ Deuxième clic sur un hex d'attaque légal → applyAction(ATTACK) déclenché
✅ Clic hors hexes légaux → désélection
✅ Clic sur une unité adverse sans unité sélectionnée → rien
```

---

## 4. Tests UI — Visuels (manuels)

> Ouvrir l'app dans Chrome (`vite dev`), inspecter visuellement chaque point.

### 4.1 — Fonts et CSS
```
✅ La font Stardom s'affiche correctement sur les titres et labels
✅ La font Switzer s'affiche correctement sur les corps de texte et logs
✅ Les variables CSS sont correctement chargées (inspecter :root dans DevTools)
✅ Les couleurs or (#c9a84c) et argent (#a8b4c0) correspondent exactement
✅ Le fond de page est bien #0a0a0f (quasi-noir)
```

### 4.2 — Plateau hexagonal
```
✅ 61 hexagones affichés, aucun doublon visible
✅ Les hexagones ont des bordures blanches fines (rgba(255,255,255,0.15))
✅ La grille est bien centrée dans son conteneur SVG
✅ Pas de hex qui dépasse du viewBox
✅ Le plateau est responsive (se redimensionne avec la fenêtre)
```

### 4.3 — Unités
```
✅ Les SVGs des unités s'affichent correctement (pas de fichier manquant)
✅ Les unités P1 ont la couleur or (#c9a84c)
✅ Les unités P2 ont la couleur argent (#a8b4c0)
✅ Les parties blanches du logo SVG ne sont pas écrasées par le fill CSS
✅ Les unités sont bien centrées dans leur hex respectif
✅ Le logo LOGO_JEU_THRONES.svg s'affiche dans le menu et la nav
```

### 4.4 — États visuels interactifs
```
✅ Clic sur une unité alliée → scale 1.08 + glow visible
✅ Les hexes de mouvement légaux s'illuminent (teinte or ou argent)
✅ Les hexes d'attaque légale s'illuminent (teinte rouge)
✅ Clic ailleurs → désélection, highlights disparaissent
✅ Tour Active : halo vert visible
✅ Tour Bloquée : halo rouge visible
✅ Tour Inactive : pas de halo visible
✅ Unité stunnée : opacité réduite + hachage diagonal visible sur l'unité
```

### 4.5 — Animations
```
✅ Déplacement d'unité : smooth slide, pas de téléportation instantanée
✅ Capture : flash sur le hex + fade-out de l'unité capturée
✅ Aucune animation ne dure plus de 300ms
✅ Pas de jank ou de freeze lors des animations
```

### 4.6 — Composants UI
```
✅ TurnIndicator affiche le bon joueur actif
✅ TurnIndicator se met à jour après chaque action
✅ PlayerPanel affiche les unités capturées correctement
✅ GameLog enregistre toutes les actions
✅ GameLog scroll automatiquement vers le bas
✅ EndScreen s'affiche en overlay quand la partie est terminée
✅ EndScreen affiche le bon gagnant
✅ Bouton "Rejouer" relance une nouvelle partie
✅ Bouton "Menu" retourne au menu principal
```

---

## 5. Tests de parties complètes (manuels)

> Jouer des parties entières en vérifiant chaque règle.

### Scénario 1 — Partie locale 1v1 jusqu'à la victoire
**Procédure :**
1. Lancer une partie en mode Local
2. Jouer alternativement J1 et J2
3. Amener un Guerrier à portée du Trône adverse
4. Exécuter l'attaque du Trône

**Critères :**
```
✅ Chaque joueur ne peut jouer qu'une action par tour
✅ Le Guerrier reste sur son hex après kill du Trône
✅ EndScreen s'affiche immédiatement avec le bon gagnant
✅ Plus aucune interaction n'est possible après la fin
```

### Scénario 2 — Test de la ZoC
**Procédure :**
1. Placer un Bouclier J1 sur le plateau
2. Amener une unité J2 sur un hex adjacent
3. Tenter d'attaquer avec l'unité J2

**Critères :**
```
✅ L'unité J2 ne peut que se déplacer (pas attaquer) pour quitter le hex sous ZoC
✅ Après avoir quitté le hex sous ZoC, l'unité J2 peut attaquer normalement au tour suivant
✅ La ZoC ne bloque pas le mouvement — l'unité peut quitter le hex sous ZoC
```

### Scénario 3 — Test du Bélier (mouvement + charge)
**Procédure :**
1. Positionner un Bélier J1
2. Tester le mouvement libre (1 ou 2 hexes en ligne droite)
3. Tenter de se déplacer en diagonale ou de changer de direction mid-move
4. Placer un Bouclier J2 à 1, 2 et 3 hexes en ligne droite → charger
5. Placer un Grappin J2 en ligne droite → charger
6. Intercaler une unité entre Bélier et cible

**Critères :**
```
✅ Le mouvement est limité à 1-2 hexes en ligne droite uniquement
✅ Aucun mouvement possible hors axe droit (diagonale = impossible)
✅ La charge est disponible sur Bouclier à distance 1, 2 et 3
✅ La charge est disponible sur Grappin à distance 1, 2 et 3
✅ La charge est bloquée si une unité se trouve entre eux
✅ Le Bélier se déplace bien sur le hex de la cible après la charge
```

### Scénario 4 — Test du Grappin
**Procédure :**
1. Sélectionner le Grappin → les cibles valides s'illuminent en rouge (ennemis en ligne droite ≤4 hexes)
2. Cliquer sur une cible → le grappin s'exécute immédiatement (pas de 2e clic pour la destination)
3. Vérifier la position de la cible tirée
4. Vérifier que le Grappin ne peut plus bouger ce tour
5. Vérifier que la cible passe son prochain tour (stun)
6. Tenter d'utiliser le Grappin sur un allié → impossible
7. Tenter de grappler l'autre Grappin → impossible

**Critères :**
```
✅ Seuls les ennemis en ligne droite (≤4 hexes, vue dégagée) apparaissent comme cibles
✅ Le Grappin ennemi n'est jamais une cible valide
✅ Les alliés ne sont jamais des cibles valides
✅ La cible est déposée sur le hex directement entre Grappin et cible (1 pas)
✅ Si ce hex est occupé, la cible ne peut pas être grappée dans cette direction
✅ L'ennemi grapplé est stunné (hachage diagonal visible, ne joue pas son prochain tour)
✅ Le stun se retire après que l'unité a passé son tour
✅ Le Grappin ne peut pas se déplacer ce même tour
```

### Scénario 5 — Test du respawn
**Procédure :**
1. Faire capturer plusieurs unités J1
2. Positionner une unité J1 adjacente à sa Tour
3. Utiliser l'option Respawn

**Critères :**
```
✅ L'option Respawn n'est disponible que si une Tour Active existe
✅ L'unité respawnée apparaît sur le hex adjacent à la Tour
✅ L'unité respawnée ne peut pas agir ce tour (seulement au suivant)
✅ Le Grappin n'est jamais disponible dans la liste de respawn
```

### Scénario 6 — Test du blocage de Tour
**Procédure :**
1. Amener une unité J2 adjacente à la Tour J1
2. Tenter d'utiliser le Respawn J1

**Critères :**
```
✅ La Tour J1 passe en état BLOQUÉE (halo rouge)
✅ Le Respawn J1 est refusé / indisponible
✅ Si J1 repousse l'unité J2, la Tour repasse en ACTIVE
```

### Scénario 7 — Test du nul par répétition
**Procédure :**
1. Créer une séquence de coups répétitifs (A→B→A→B→A→B)
2. Vérifier le décompte des positions dans le state

**Critères :**
```
✅ Après 3 répétitions de la même position, la partie se termine en nul
✅ Le EndScreen affiche "MATCH NUL — Répétition de position"
```

### Scénario 8 — Test de l'IA (3 niveaux)
**Procédure :**
1. Lancer une partie contre l'IA Facile
2. Lancer une partie contre l'IA Moyenne
3. Lancer une partie contre l'IA Difficile

**Critères :**
```
✅ L'IA Facile joue des coups légaux (jamais de mouvement illégal)
✅ L'IA Moyenne joue de façon cohérente (pas de coups suicidaires évidents)
✅ L'IA Difficile constitue un challenge réel
✅ Aucune des 3 IA ne crash ou ne gèle l'interface
✅ Le délai artificiel de l'IA (300-600ms) est visible et naturel
✅ L'interface est bien désactivée pendant la "réflexion" de l'IA
```

### Scénario 9 — Tutoriel complet
**Procédure :**
Parcourir toutes les 8 étapes du tutoriel dans l'ordre.

**Critères :**
```
✅ Étape 1 : Le plateau et les pièces s'affichent correctement
✅ Étape 2 : La règle "1 action par tour" est illustrée
✅ Étape 3 : La ZoC du Bouclier est bien démontrée
✅ Étape 4 : La charge du Bélier est bien démontrée
✅ Étape 5 : L'attaque du Trône par le Guerrier est démontrée
✅ Étape 6 : Le stun du Grappin est démontré
✅ Étape 7 : Les états des Tours et le respawn sont démontrés
✅ Étape 8 : La condition de victoire est clairement expliquée
✅ Navigation "Suivant" fonctionne à chaque étape
✅ Retour au menu en fin de tutoriel
```

---

## 6. Checklist de validation finale — Phase 1

### Environnement
```
✅ vite dev démarre sans erreur ni warning dans la console
✅ Aucune erreur TypeScript (npx tsc --noEmit retourne 0 erreur)
✅ Aucune erreur ESLint critique
✅ Les fonts Stardom et Switzer se chargent (Network tab : statut 200)
✅ Les SVGs d'unités se chargent (Network tab : statut 200)
```

### Moteur
```
✅ Tous les tests unitaires Vitest passent (0 failure)
✅ Aucune exception levée lors d'une partie normale
✅ La fonction applyAction() est pure (jamais de mutation)
```

### Interface
```
✅ Le plateau de 61 hexagones s'affiche sans débordement
✅ Les unités P1 sont or (#c9a84c), les unités P2 sont argent (#a8b4c0)
✅ Les highlights de mouvements légaux sont visibles et corrects
✅ Les animations sont fluides (< 300ms, pas de jank)
✅ L'interface est cohérente avec l'identité Dark Luxury Medieval
```

### Gameplay
```
✅ Partie Local 1v1 complète jouable sans crash
✅ Partie vs IA aux 3 niveaux jouable sans crash
✅ Détection de victoire fonctionnelle
✅ Détection de nul par répétition fonctionnelle
✅ Tutoriel jouable de bout en bout
```

---

## 7. Procédures de debug

### L'IA gèle l'interface
- Vérifier que `minimaxMove()` est appelé dans un `setTimeout` ou `Web Worker`
- Ajouter un timeout de sécurité (max 3s) dans `minimax.ts`
- Réduire la profondeur de recherche si nécessaire

### Le plateau ne s'affiche pas correctement
- Vérifier `generateBoard61()` : exactement 61 hexes, aucun doublon
- Vérifier `hexToPixel()` : les valeurs x/y sont dans le bon range pour le viewBox
- Inspecter le SVG dans DevTools → vérifier que tous les `<polygon>` ont des points valides

### Les SVGs d'unités ont la mauvaise couleur
- Vérifier que le `fill` CSS est bien appliqué sur l'élément SVG (pas sur un `<g>` intérieur)
- Vérifier que les SVGs n'ont pas de `fill` hardcodé dans leurs paths
- Exception : `LOGO_JEU_THRONES.svg` contient des `fill:#fff` sur certains paths — ne pas les écraser

### Un mouvement légal incorrect est calculé
- Logger `getLegalMoves(board, unit, gameState)` dans la console
- Vérifier que `isHexOccupied()` fonctionne correctement
- Vérifier la détection ZoC dans `zoc.ts`
- Vérifier le pathfinding du Guerrier (hex intermédiaire doit être libre)

### Le nul par répétition ne se déclenche pas
- Logger `positionHistory` dans le gameStore
- Vérifier `serializePosition()` : deux états visuellement identiques doivent donner la même chaîne
- Vérifier que le joueur actif est inclus dans la sérialisation (un même board avec J1 à jouer ≠ J2 à jouer)

### L'état des Tours est incorrect
- Appeler `updateTowerStates()` manuellement dans la console avec le board courant
- Vérifier que `getNeighbors()` retourne bien les bons voisins pour les hexes de Tour

---

## 8. Rapport de validation

À la fin des tests, l'Agent QA produit un rapport au format suivant :

```markdown
# Rapport de validation — THRONES v1
Date : [DATE]

## Tests unitaires
- Total : X tests
- Passés : X
- Échoués : X
- Détail des échecs : [liste]

## Tests manuels
- Scénarios validés : X/9
- Scénarios en échec : [liste avec description du bug]

## Checklist finale
- Environnement : X/5 ✅
- Moteur : X/3 ✅
- Interface : X/5 ✅
- Gameplay : X/5 ✅

## Statut global
[ ] VALIDÉ — Phase 1 prête pour utilisation
[ ] EN COURS — Bugs critiques à corriger avant validation
[ ] BLOQUÉ — Bug majeur empêchant les tests

## Bugs identifiés (si applicable)
| ID | Sévérité | Description | Fichier concerné | Statut |
|---|---|---|---|---|
| BUG-001 | Critique | ... | engine/moves.ts | Ouvert |
```

---

*THRONES · TESTING.md · v1 · Protocoles de test et validation*
