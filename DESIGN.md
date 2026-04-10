# DESIGN.md — Système de design · THRONES v1
*Référence complète pour l'Agent UI — source de vérité visuelle*

> Ce document définit l'intégralité du système de design de Thrones.
> Toute décision visuelle non documentée ici doit s'inspirer de l'esprit défini dans la Section 1.
> Référencé par : `CLAUDE.md` Section 3, `AGENTS.md` Agent 3.

---

## 1. Direction artistique

### Concept
**Dark luxury medieval.** Austère, noble, sans fioritures. Chaque élément de l'interface doit sembler gravé dans la pierre ou fondu dans le métal — pas collé sur un écran. L'interface ne doit jamais être criarde ni décorative pour l'être. Chaque ornement doit avoir une raison fonctionnelle.

### Références
- **Lichess.org** — clarté absolue du plateau, lisibilité des pièces, log de partie épuré
- **Chess.com** — hiérarchie visuelle claire, confort d'utilisation sur longues sessions
- **Landing page Thrones existante** — palette exacte, typographie, ambiance — à respecter fidèlement
- **Esprit général** : ce que serait une interface de jeu d'échecs si elle avait été conçue pour un jeu de trônes médiéval

### Ce que l'interface n'est PAS
- Pas de gradients criards
- Pas d'effets de lumière excessifs
- Pas de couleurs vives (pas de bleu électrique, pas de vert fluo)
- Pas d'animations > 300ms
- Pas de typographie décorative sur les éléments fonctionnels

---

## 2. Typographie

### Import
```css
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@100;200;300;400;500;600;700;800;900&display=swap');
```

### Lexend — Police unique, hiérarchie par graisse
Une seule famille de police pour toute l'interface. La hiérarchie visuelle est créée exclusivement par les variations de graisse (100–900).
```css
font-family: 'Lexend', sans-serif;
```

| Usage | Taille | Graisse | Lettre-spacing |
|---|---|---|---|
| Titre principal (THRONES, EndScreen) | `clamp(3rem, 8vw, 7rem)` | **800** | `0.15em` |
| Titre de section, noms d'unités | `clamp(1.4rem, 3vw, 2.2rem)` | **700** | `0.08em` |
| Label UI primaire, nom joueur | `0.9–1.25rem` | **700** | `0.18em` |
| CTA bouton primaire | `0.8rem` | **700** | `0.16em` |
| Bouton secondaire / ghost | `0.8rem` | **600** | `0.16em` |
| Label secondaire | `0.75–0.9rem` | **600** | `0.06em` |
| Corps principal, log de partie | `0.9–0.95rem` | **300** | — |
| Texte muted, descriptions | `0.75–0.88rem` | **300** | — |
| Mentions de version | `0.7rem` | **200** | — |

### Règle générale
- `text-transform: uppercase` sur tous les labels de navigation et labels primaires
- `letter-spacing` systématique sur les éléments uppercase
- Jamais de `font-style: italic` dans l'interface de jeu (sauf log vide)

---

## 3. Palette de couleurs

### Variables CSS — à définir dans `globals.css`
```css
:root {
  /* ── Fonds ── */
  --bg:            #0a0a0f;   /* Fond principal — noir absolu */
  --bg2:           #0e0e16;   /* Surfaces secondaires */
  --bg3:           #131320;   /* Cartes, panneaux, overlays */

  /* ── Joueur 1 — Or ── */
  --gold:          #c9a84c;   /* Accent principal J1 */
  --gold-light:    #e8c96a;   /* Hover, focus J1 */
  --gold-dim:      #7a6030;   /* Or atténué, textes secondaires J1 */

  /* ── Joueur 2 — Argent ── */
  --silver:        #a8b4c0;   /* Accent principal J2 */
  --silver-light:  #cdd6de;   /* Hover, focus J2 */
  --silver-dim:    #5a6470;   /* Argent atténué, textes secondaires J2 */

  /* ── Textes ── */
  --white:         #f0ece4;   /* Textes principaux */
  --muted:         #6b6760;   /* Textes secondaires, labels inactifs */

  /* ── Bordures ── */
  --border:        rgba(255,255,255,0.08);   /* Bordures subtiles */
  --border-hex:    rgba(255,255,255,0.15);   /* Bordures hexagones */
  --border-bright: rgba(255,255,255,0.28);   /* Bordures actives */

  /* ── États de jeu (dans themes/default.css) ── */
  --legal-move-p1:   rgba(201,168,76,0.18);    /* Hex mouvement légal J1 */
  --legal-move-p2:   rgba(168,180,192,0.18);   /* Hex mouvement légal J2 */
  --attack-range:    rgba(180,30,30,0.28);      /* Hex attaque possible */
  --selected-hex:    rgba(255,255,255,0.12);    /* Hex sélectionné */
  --tower-halo:      rgba(60,90,160,0.18);      /* Tour (tous états — couleur unique) */
  --throne-glow:     rgba(201,168,76,0.15);     /* Halo Trône J1 */
  --throne-glow-p2:  rgba(168,180,192,0.15);    /* Halo Trône J2 */
}
```

### Utilisation des couleurs par contexte
| Contexte | Couleur |
|---|---|
| Texte principal | `var(--white)` |
| Texte secondaire | `var(--muted)` |
| Fond de page | `var(--bg)` |
| Fond panneau latéral | `var(--bg2)` |
| Fond carte / overlay | `var(--bg3)` |
| Joueur 1 (unités, highlights, indicateurs) | `var(--gold)` |
| Joueur 2 (unités, highlights, indicateurs) | `var(--silver)` |
| Danger / attaque | teinte rouge `rgba(180,30,30,…)` |
| Succès / tour active | teinte verte `rgba(80,200,120,…)` |

---

## 4. Système de thèmes (architecture extensible)

### `styles/themes/default.css`
Ce fichier contient **uniquement** les variables visuelles du plateau et des unités. Il est conçu pour être remplacé par un autre fichier de thème sans toucher au reste du CSS.

```css
/* THÈME DÉFAUT — Dark Luxury Medieval */
:root {
  /* Plateau */
  --hex-fill:             #1c1c2e;
  --hex-stroke:           rgba(255,255,255,0.22);
  --hex-stroke-width:     1px;
  --hex-fill-selected:    rgba(255,255,255,0.14);
  --hex-stroke-selected:  rgba(255,255,255,0.7);
  --board-bg:             #0f0f1c;

  /* Mouvements légaux */
  --hex-fill-legal-p1: rgba(201,168,76,0.18);
  --hex-fill-legal-p2: rgba(168,180,192,0.18);
  --hex-stroke-legal:  rgba(255,255,255,0.25);

  /* Attaques */
  --hex-fill-attack:   rgba(180,30,30,0.28);
  --hex-stroke-attack: rgba(220,60,60,0.5);

  /* Tours — couleur unique pour tous les états */
  --tower-halo-active:   rgba(60,90,160,0.18);
  --tower-halo-blocked:  rgba(60,90,160,0.18);
  --tower-halo-inactive: rgba(255,255,255,0.04);

  /* Trônes */
  --throne-halo-p1: rgba(201,168,76,0.15);
  --throne-halo-p2: rgba(168,180,192,0.15);

  /* Unités */
  --unit-fill-p1:      #c9a84c;
  --unit-fill-p2:      #a8b4c0;
  --unit-opacity-stun: 0.45;
}
```

> **Note feature v2 :** Un thème alternatif s'implémente en créant un nouveau fichier `themes/[nom].css` avec les mêmes variables et en le swappant dynamiquement via JavaScript. Ne pas hardcoder les couleurs du plateau dans les composants.

---

## 5. Plateau hexagonal

### Géométrie
- **61 hexagones** en grille, rayon 4 depuis le centre
- Orientation **pointy-top** (sommet vers le haut)
- SVG responsive avec `viewBox` calculé dynamiquement selon la taille du plateau
- Taille d'un hexagone (`size`) : ajustée pour que le plateau remplisse 80% de la hauteur disponible

### États visuels des hexagones
| État | Fill | Stroke | Stroke-width |
|---|---|---|---|
| Normal | `var(--hex-fill)` | `var(--hex-stroke)` | `1px` |
| Sélectionné | `var(--hex-fill-selected)` | `var(--hex-stroke-selected)` | `1.5px` |
| Mouvement légal J1 | `var(--hex-fill-legal-p1)` | `var(--hex-stroke-legal)` | `1px` |
| Mouvement légal J2 | `var(--hex-fill-legal-p2)` | `var(--hex-stroke-legal)` | `1px` |
| Attaque possible | `var(--hex-fill-attack)` | `var(--hex-stroke-attack)` | `1.5px` |
| Tour Active | `var(--tower-halo-active)` ← bleu discret | — | — |
| Tour Bloquée | `var(--tower-halo-blocked)` ← même bleu | — | — |
| Tour Inactive | `var(--tower-halo-inactive)` ← quasi-transparent | — | — |

### Hex Trône
- Même base que les autres hexagones
- `stroke-width: 2px`, stroke couleur joueur (or ou argent)
- Halo radial très subtil (`var(--throne-halo-p1)` ou `var(--throne-halo-p2)`)
- SVG du Trône (`Trone.svg`) centré dans l'hex, légèrement plus grand que les unités normales

### Hex Tour
- Pas d'icône SVG rendue sur le hex — la Tour est indiquée uniquement par la couleur de fond du hex
- Couleur de fond : `rgba(60,90,160,0.18)` (bleu discret) pour tous les états visibles (active, bloquée)
- État inactive : `rgba(255,255,255,0.04)` (quasi-transparent)
- Les unités peuvent occuper les hexes Tour librement

---

## 6. Unités

### SVGs fournis
Les fichiers SVG sont fournis par le créateur du jeu. Ils sont géométriques, épurés, viewBox 240×240.
```
public/assets/units/
├── Bouclier.svg
├── Belier.svg
├── Guerrier.svg
├── Grappin.svg
├── Tour.svg
└── Trone.svg
```

### Coloration dynamique par joueur
Les SVGs sont tous en `fill` noir par défaut. La couleur est appliquée via CSS :
```css
/* Joueur 1 */
.unit-p1 { fill: var(--unit-fill-p1); /* #c9a84c */ }

/* Joueur 2 */
.unit-p2 { fill: var(--unit-fill-p2); /* #a8b4c0 */ }
```
> Important : les SVGs utilisent `fill-rule: evenodd`. Les parties blanches dans le logo sont codées avec `fill: #fff` dans le SVG — ne pas les écraser. Pour les unités (Bouclier, Bélier, Guerrier, Grappin), le `fill` est uniforme et peut être coloré via CSS.

### États visuels des unités
| État | Traitement visuel |
|---|---|
| Normal | Couleur joueur, opacité 1 |
| Sélectionné | `transform: scale(1.08)` + glow coloré (or ou argent) |
| Stunné | `opacity: 0.45` + overlay token stun |
| Capturé (panel latéral) | Même SVG, `opacity: 0.3`, taille réduite (~40%) |

### Glow sélection
```css
.unit-selected {
  filter: drop-shadow(0 0 6px var(--gold));   /* J1 */
  filter: drop-shadow(0 0 6px var(--silver)); /* J2 */
  transform: scale(1.08);
  transition: transform 180ms ease, filter 180ms ease;
}
```

### Token stun
- Overlay centré sur l'unité stunnée
- Icône simple (symbole ⚡ ou texte "·") en Lexend 700, couleur `--muted`
- `opacity: 0` → `opacity: 1` en 200ms à l'apparition
- Disparaît en 200ms quand le stun est retiré

---

## 7. Animations

> Règle absolue : **aucune animation > 300ms**. Fluidité avant spectacle.

### Catalogue d'animations
| Événement | Animation | Durée | Easing |
|---|---|---|---|
| Déplacement d'unité | Slide de la position initiale à la finale | `150ms` | `ease-out` |
| Capture | Flash blanc sur le hex + fade-out de l'unité | `200ms` | `ease-in` |
| Sélection d'unité | Scale 1.08 + glow | `180ms` | `ease` |
| Désélection | Scale 1.0 + suppression glow | `150ms` | `ease` |
| Apparition stun token | Fade-in | `200ms` | `ease` |
| Disparition stun token | Fade-out | `200ms` | `ease` |
| Changement de tour | Transition TurnIndicator | `250ms` | `ease` |
| Apparition EndScreen | Fade-in overlay | `300ms` | `ease-out` |
| Highlight hexes légaux | Fade-in simultané | `120ms` | `ease` |

### Animations CSS globales
```css
/* Grille hex background — Home page uniquement */
@keyframes gridDrift {
  0%   { background-position: 0 0; }
  100% { background-position: 56px 56px; }
}

/* Pulse hexagones décoratifs */
@keyframes hexPulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50%       { opacity: 0.9; transform: scale(1.15); }
}

/* Apparition élément */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

---

## 8. Layout de la page de jeu

```
┌─────────────────────────────────────────────────────┐
│  LOGO          THRONES           [Tour N] [Quitter] │  ← Nav / Header
├──────────┬──────────────────────────────┬───────────┤
│          │                              │           │
│  PANEL   │                              │   PANEL   │
│ Joueur 2 │       HEX BOARD (SVG)        │ Joueur 1  │
│ (argent) │                              │  (or)     │
│          │                              │           │
│ Unités   │                              │ Unités    │
│ capturées│                              │ capturées │
│          │                              │           │
├──────────┴──────────────────────────────┴───────────┤
│                   TURN INDICATOR                    │  ← "Tour du Joueur X"
├─────────────────────────────────────────────────────┤
│  GAME LOG (scrollable, rétractable)                 │  ← Log des actions
└─────────────────────────────────────────────────────┘
```

### Proportions
- Plateau : occupe l'espace central disponible, centré
- Panel joueurs (gauche) : largeur fixe **300px**
- Panel log (droite) : largeur fixe **340px**
- Log : hauteur totale du panneau droit, scrollable

### Responsive
- L'interface est **desktop-first** pour la v1.
- Breakpoint minimum : 1024px de large.
- Pas de version mobile pour la v1.

---

## 9. Composants UI — Spécifications visuelles

### TurnIndicator
```
┌────────────────────────────────────┐
│  ●  JOUEUR 1 — Tour 14             │
└────────────────────────────────────┘
```
- Fond : `var(--bg3)`, bordure : `var(--border)`
- Dot coloré selon le joueur actif (or ou argent)
- Typographie : Lexend 700 pour le nom du joueur, Lexend 300 pour le numéro de tour

### PlayerPanel
```
┌──────────────────┐
│  ⬡ JOUEUR 1      │  ← nom + couleur
│  ─────────────   │
│  Capturés (3)    │  ← section capturés
│  [🛡][🛡][⚔]    │  ← SVGs miniatures, opacité 0.3
│  ─────────────   │
│  Respawn dispo   │  ← si tour actif + Tour Active
│  [🛡] ← click   │
└──────────────────┘
```
- Fond : `var(--bg2)`, bordure : `var(--border)`, largeur **300px**
- Nom du joueur : Lexend 700, 1.25rem
- Labels : Lexend 600, 0.9rem
- Unités : SVGs **70×70px** (icône 58px), fill couleur joueur, opacité 0.45 si capturées

### GameLog
```
[T.12] Guerrier J1 → F3 capture Bélier J2
[T.11] Bouclier J2 → E4
[T.10] Grappin J1 · stun Guerrier J2
```
- Fond : `var(--bg)`, bordure top : `var(--border)`
- Fond : `var(--bg2)`, largeur **340px**
- Typographie : Lexend 300, 0.95rem, `--muted`
- Header : Lexend 700, 0.85rem, uppercase
- Préfixe tour : Lexend 600, `--gold-dim` ou `--silver-dim`
- Scroll automatique vers le bas

### MainMenu
- Logo centré, taille 120px
- Titre "THRONES" en Lexend 800, très grand
- Boutons en colonne, espacés
- Bouton principal : fond `--gold`, texte `#000`, Lexend 700
- Bouton secondaire : bordure `--border-bright`, texte `--gold`, fond transparent
- Bouton désactivé (Online) : opacité 0.35, cursor `not-allowed`

### EndScreen
- Overlay `rgba(10,10,15,0.92)` sur le plateau
- Titre victoire : Lexend 800, très grand, couleur joueur gagnant (or ou argent)
- Sous-titre : Lexend 300, `--muted`
- Deux boutons : "Rejouer" (primaire) + "Menu" (secondaire)
- Apparition : `fadeIn` 300ms

---

## 10. Logo

Fichier : `public/assets/logo/LOGO_JEU_THRONES.svg`

- Utilisé tel quel dans la nav et les écrans de menu.
- Dans la nav : hauteur 32px, fill `var(--white)`.
- Dans le menu principal : hauteur 120px, fill `var(--white)`.
- Ne jamais modifier le SVG source.
- Ne jamais appliquer de filtre coloré sur le logo — il reste blanc.

---

## 11. Boutons — Système

```css
/* Bouton primaire */
.btn-primary {
  background: var(--gold);
  color: #000;
  font-family: 'Lexend', sans-serif;
  font-size: 0.8rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 0.88rem 2.4rem;
  border: none;
  cursor: pointer;
  transition: background 0.25s, transform 0.25s, box-shadow 0.25s;
}
.btn-primary:hover {
  background: var(--gold-light);
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(201,168,76,0.28);
}

/* Bouton ghost */
.btn-ghost {
  background: transparent;
  border: 1px solid var(--border-bright);
  color: var(--gold);
  font-family: 'Lexend', sans-serif;
  font-size: 0.8rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 0.88rem 2rem;
  cursor: pointer;
  transition: background 0.25s, transform 0.25s;
}
.btn-ghost:hover {
  background: rgba(201,168,76,0.08);
  transform: translateY(-2px);
}

/* Bouton désactivé */
.btn-disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}
```

---

*THRONES · DESIGN.md · v1 · Dark Luxury Medieval Design System*
