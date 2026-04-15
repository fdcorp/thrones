// ============================================================================
// THRONES — Ranked System (Glicko-2 Hybrid)
// ============================================================================
//
// SCOPE: applies ONLY to online Ranked matches (isRankedMatch = true).
//   - Casual online matches  → zero impact on MMR / tier / LP
//   - AI / solo matches      → zero impact on MMR / tier / LP
//   - Ranked online matches  → full Glicko-2 update + LP progression
//
// ARCHITECTURE:
//   - hidden_mmr   : Glicko-2 rating (authoritative for matchmaking)
//   - rating_deviation (RD)  : Glicko-2 uncertainty
//   - volatility (σ)         : Glicko-2 consistency measure
//   - visible_tier + visible_division + league_points : player-facing rank
//
// UI INTEGRATION NOTES:
//   - Call getVisibleRank() to get the display object for the rank badge.
//   - Animate tier-up: compare old_tier vs new_tier before/after processMatchResult.
//   - Animate LP bar: lerp league_points from old to new value after each match.
//   - Show "PROVISIONAL" badge when provisional_games_left > 0.
//   - Crown icon for KING tier, no division label for MASTER / KING.
//   - During promotion series: show "X/3 wins" progress indicator.
//
// ============================================================================

// ─── CONFIGURABLE CONSTANTS ──────────────────────────────────────────────────

/** Glicko-2 system constant τ. Controls volatility change speed.
 *  Lower = more stable. Recommended range: 0.3–1.2. */
const GLICKO2_TAU = 0.5;

/** Glicko-2 internal rating scale divisor. Standard value — do not change. */
const GLICKO2_SCALE = 173.7178;

/** Starting hidden MMR for all new players. Glicko-2 default is 1500. */
const INITIAL_MMR = 1500;

/** Starting rating deviation. High = high uncertainty (new player). */
const INITIAL_RD = 350;

/** Minimum RD for experienced players (floor). */
const MIN_RD = 30;

/** Starting volatility σ. Standard Glicko-2 default. */
const INITIAL_VOLATILITY = 0.06;

/** RD added per inactive rating period (mild decay). Set to 0 to disable. */
const RD_DECAY_PER_PERIOD = 5;

/** Number of placement games. Big MMR swings during this period. */
const PLACEMENT_GAMES = 10;

/** Multiplier applied to Glicko-2 MMR delta during placement games. */
const PLACEMENT_MMR_MULTIPLIER = 2.5;

/** Games flagged "provisional" for anti-smurf protection. */
const PROVISIONAL_GAMES_THRESHOLD = 20;

/** Minimum LP gained per ranked win. */
const LP_GAIN_MIN = 20;

/** Maximum LP gained per ranked win. */
const LP_GAIN_MAX = 35;

/** Minimum LP lost per ranked loss. */
const LP_LOSS_MIN = 15;

/** Maximum LP lost per ranked loss. */
const LP_LOSS_MAX = 25;

/** LP needed in division I to trigger promotion series. */
const LP_PROMOTION_THRESHOLD = 100;

/** Wins required to pass a promotion series (best of 5). */
const PROMOTION_WINS_NEEDED = 3;

/** Losses allowed before failing promotion series (best of 5). */
const PROMOTION_LOSSES_ALLOWED = 2;

/** MMR difference where LP gain/loss is at its midpoint (linear interpolation). */
const LP_MMR_DIFF_SCALE = 300;

/** Convergence threshold for Glicko-2 volatility Illinois algorithm. */
const GLICKO2_EPSILON = 0.000001;

// ─── TIER BOUNDARIES (hidden MMR) ────────────────────────────────────────────
// These determine which tier a player's MMR "belongs to" for matchmaking.
// Visible rank can lag behind or ahead of these during LP accumulation.
//
// UI: Use these for displaying MMR progress bars in an admin/debug view.

export const TIER_MMR_BOUNDARIES: Record<string, [number, number]> = {
  PEASANT:   [0,    600],
  BRONZE:    [600,  950],
  SILVER:    [950,  1350],
  GOLD:      [1350, 1750],
  PLATINUM:  [1750, 2150],
  DIAMOND:   [2150, 2550],
  MASTER:    [2550, 2900],
  KING:      [2900, Infinity],
};

// ─── ENUMS ───────────────────────────────────────────────────────────────────

/** Visible rank tier. Thematically named — displayed with crown icons in UI. */
export enum Tier {
  PEASANT  = 'PEASANT',   // Unranked placeholder — no divisions
  BRONZE   = 'BRONZE',
  SILVER   = 'SILVER',
  GOLD     = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND  = 'DIAMOND',
  MASTER   = 'MASTER',    // No divisions
  KING     = 'KING',      // No divisions — highest tier, crown icon
}

/** Division within a tier. Only for BRONZE → DIAMOND. */
export enum Division {
  V   = 'V',
  IV  = 'IV',
  III = 'III',
  II  = 'II',
  I   = 'I',
}

// ─── DATA STRUCTURES ─────────────────────────────────────────────────────────

/** Full rank state for a player. Persisted to DB. */
export interface PlayerRank {
  /** Glicko-2 hidden rating. Used for matchmaking. Not shown to players directly. */
  hidden_mmr: number;

  /** Glicko-2 rating deviation. High = uncertain / new player. Decreases with play. */
  rating_deviation: number;

  /** Glicko-2 volatility σ. Measures consistency of performance. */
  volatility: number;

  /** Currently displayed tier (crown in UI). */
  visible_tier: Tier;

  /** Currently displayed division. null for MASTER and KING. */
  visible_division: Division | null;

  /** League Points within the current division (0–99).
   *  For MASTER / KING: represents "points above threshold" (no cap). */
  league_points: number;

  /** Current competitive season number. Resets visible rank on season change. */
  season_number: number;

  /** Remaining placement games. Large MMR swings while > 0. */
  provisional_games_left: number;

  /** Total ranked games played across all seasons. */
  total_ranked_games_played: number;

  /** Whether the player is in an active promotion series. */
  in_promotion_series: boolean;

  /** Wins accumulated in the current promotion series. */
  promotion_wins: number;

  /** Losses accumulated in the current promotion series. */
  promotion_losses: number;
}

/** Immutable display object returned to the UI layer. */
export interface VisibleRank {
  tier: Tier;
  division: Division | null;
  league_points: number;
  /** Formatted string: "Gold II", "Master", "King". */
  display: string;
  /** True during first PROVISIONAL_GAMES_THRESHOLD games — show anti-smurf badge. */
  is_provisional: boolean;
  /** True during first PLACEMENT_GAMES games — show "Placement X/10" in UI. */
  is_in_placement: boolean;
  in_promotion_series: boolean;
  promotion_wins: number;
  promotion_losses: number;
}

/** Result returned by processMatchResult — contains both updated ranks + LP deltas. */
export interface MatchResult {
  playerA: PlayerRank;
  playerB: PlayerRank;
  /** LP change for A (positive = gain, negative = loss). */
  lp_delta_a: number;
  /** LP change for B (positive = gain, negative = loss). */
  lp_delta_b: number;
  /** New MMR for A after Glicko-2 update. */
  new_mmr_a: number;
  /** New MMR for B after Glicko-2 update. */
  new_mmr_b: number;
}

/** JSON schema for database persistence. Mirrors PlayerRank exactly. */
export interface PlayerRankDbRow {
  hidden_mmr:               number;
  rating_deviation:         number;
  volatility:               number;
  visible_tier:             string;  // Tier enum value
  visible_division:         string | null;  // Division enum value or null
  league_points:            number;
  season_number:            number;
  provisional_games_left:   number;
  total_ranked_games_played:number;
  in_promotion_series:      0 | 1;   // SQLite boolean
  promotion_wins:           number;
  promotion_losses:         number;
}

// ─── TIER METADATA ────────────────────────────────────────────────────────────

const TIER_ORDER: Tier[] = [
  Tier.PEASANT,
  Tier.BRONZE,
  Tier.SILVER,
  Tier.GOLD,
  Tier.PLATINUM,
  Tier.DIAMOND,
  Tier.MASTER,
  Tier.KING,
];

const DIVISION_ORDER: Division[] = [
  Division.V,
  Division.IV,
  Division.III,
  Division.II,
  Division.I,
];

/** Tiers with no divisions. */
const DIVISIONLESS_TIERS = new Set([Tier.PEASANT, Tier.MASTER, Tier.KING]);

// ─── GLICKO-2 CORE ───────────────────────────────────────────────────────────

/** Convert a Glicko-2 rating to internal μ scale. */
function toMu(rating: number): number {
  return (rating - 1500) / GLICKO2_SCALE;
}

/** Convert internal μ to Glicko-2 rating. */
function fromMu(mu: number): number {
  return GLICKO2_SCALE * mu + 1500;
}

/** Convert RD to internal φ scale. */
function toPhi(rd: number): number {
  return rd / GLICKO2_SCALE;
}

/** Convert internal φ to RD. */
function fromPhi(phi: number): number {
  return GLICKO2_SCALE * phi;
}

/** g(φ) — Glicko-2 g function. Reduces impact of uncertain opponents. */
function g(phi: number): number {
  return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
}

/** E(μ, μj, φj) — expected score against opponent. */
function E(mu: number, muJ: number, phiJ: number): number {
  return 1 / (1 + Math.exp(-g(phiJ) * (mu - muJ)));
}

/**
 * Update volatility σ using the Illinois algorithm (Glicko-2 step 5).
 * Finds σ' such that the change is consistent with the observed performance.
 */
function updateVolatility(
  phi: number,
  sigma: number,
  delta: number,
  v: number,
): number {
  const tau = GLICKO2_TAU;
  const a   = Math.log(sigma * sigma);

  // Objective function f(x)
  const f = (x: number): number => {
    const ex     = Math.exp(x);
    const d2     = delta * delta;
    const phi2   = phi * phi;
    const denom1 = 2 * (phi2 + v + ex);
    return (ex * (d2 - phi2 - v - ex)) / (denom1 * denom1)
      - (x - a) / (tau * tau);
  };

  // Bracket [A, B]
  let A  = a;
  let B: number;

  if (delta * delta > phi * phi + v) {
    B = Math.log(delta * delta - phi * phi - v);
  } else {
    let k = 1;
    while (f(a - k * tau) < 0) k++;
    B = a - k * tau;
  }

  // Illinois refinement
  let fA = f(A);
  let fB = f(B);

  while (Math.abs(B - A) > GLICKO2_EPSILON) {
    const C  = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C);
    if (fC * fB <= 0) {
      A  = B;
      fA = fB;
    } else {
      fA = fA / 2;
    }
    B  = C;
    fB = fC;
  }

  return Math.exp(A / 2);
}

/**
 * Core Glicko-2 rating update for a single match.
 *
 * @param player  The player whose rating we're updating.
 * @param opponent The opponent's current rating state.
 * @param score   1 = win, 0 = loss, 0.5 = draw.
 * @param multiplier  Applied to the MMR delta (used during placement).
 * @returns Updated { hidden_mmr, rating_deviation, volatility }.
 */
function glicko2Update(
  player: Pick<PlayerRank, 'hidden_mmr' | 'rating_deviation' | 'volatility'>,
  opponent: Pick<PlayerRank, 'hidden_mmr' | 'rating_deviation'>,
  score: 0 | 0.5 | 1,
  multiplier = 1,
): Pick<PlayerRank, 'hidden_mmr' | 'rating_deviation' | 'volatility'> {
  const mu   = toMu(player.hidden_mmr);
  const phi  = toPhi(player.rating_deviation);
  const muJ  = toMu(opponent.hidden_mmr);
  const phiJ = toPhi(opponent.rating_deviation);

  const gPhiJ = g(phiJ);
  const eVal  = E(mu, muJ, phiJ);

  // Estimated variance v
  const v = 1 / (gPhiJ * gPhiJ * eVal * (1 - eVal));

  // Improvement Δ
  const delta = v * gPhiJ * (score - eVal);

  // Update volatility
  const newSigma = updateVolatility(phi, player.volatility, delta, v);

  // Pre-rating period RD: φ* = sqrt(φ² + σ'²)
  const phiStar = Math.sqrt(phi * phi + newSigma * newSigma);

  // New φ'
  const phiNew = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);

  // New μ' — apply multiplier to the delta, not the base rating
  const muDelta  = phiNew * phiNew * gPhiJ * (score - eVal);
  const muNew    = mu + multiplier * muDelta;

  return {
    hidden_mmr:       Math.max(100, fromMu(muNew)),
    rating_deviation: Math.max(fromPhi(MIN_RD / GLICKO2_SCALE), fromPhi(phiNew)),
    volatility:       newSigma,
  };
}

// ─── LP HELPERS ───────────────────────────────────────────────────────────────

/**
 * Calculate LP gain/loss based on MMR difference.
 *
 * If you beat someone 300+ MMR above you  → LP_GAIN_MAX (+35)
 * If you beat someone 300+ MMR below you  → LP_GAIN_MIN (+20)
 * Linear interpolation in between.
 *
 * Loss is the mirror: losing to someone much stronger = small LP loss.
 */
function calculateLpDelta(
  myMmr: number,
  opponentMmr: number,
  won: boolean,
): number {
  // Normalize diff to [-1, 1]
  const diff     = opponentMmr - myMmr;                // positive = opp is stronger
  const t        = Math.max(-1, Math.min(1, diff / LP_MMR_DIFF_SCALE));

  if (won) {
    // Stronger opponent → bigger gain
    return Math.round(LP_GAIN_MIN + ((LP_GAIN_MAX - LP_GAIN_MIN) * (t + 1)) / 2);
  } else {
    // Stronger opponent → smaller loss
    return -Math.round(LP_LOSS_MAX - ((LP_LOSS_MAX - LP_LOSS_MIN) * (t + 1)) / 2);
  }
}

// ─── TIER / DIVISION NAVIGATION ──────────────────────────────────────────────

function tierIndex(tier: Tier): number {
  return TIER_ORDER.indexOf(tier);
}

function divisionIndex(div: Division): number {
  return DIVISION_ORDER.indexOf(div);
}

function nextTier(tier: Tier): Tier | null {
  const idx = tierIndex(tier);
  return idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : null;
}

function previousTier(tier: Tier): Tier | null {
  const idx = tierIndex(tier);
  return idx > 0 ? TIER_ORDER[idx - 1] : null;
}

function nextDivision(div: Division): Division | null {
  const idx = divisionIndex(div);
  return idx < DIVISION_ORDER.length - 1 ? DIVISION_ORDER[idx + 1] : null;
}

function previousDivision(div: Division): Division | null {
  const idx = divisionIndex(div);
  return idx > 0 ? DIVISION_ORDER[idx - 1] : null;
}

/** Advance one division (or tier). Returns new { tier, division, lp }. */
function advanceDivision(tier: Tier, division: Division | null): {
  tier: Tier;
  division: Division | null;
} {
  if (DIVISIONLESS_TIERS.has(tier)) {
    // Master / King don't advance by division logic
    const next = nextTier(tier);
    return next ? { tier: next, division: null } : { tier, division: null };
  }

  const next = nextDivision(division!);
  if (next) {
    return { tier, division: next };
  }

  // Overflow division I → next tier
  const nextT = nextTier(tier);
  if (!nextT) return { tier, division: Division.I };

  const nextDiv = DIVISIONLESS_TIERS.has(nextT) ? null : Division.V;
  return { tier: nextT, division: nextDiv };
}

/** Drop one division (or tier). Returns new { tier, division, lp }. */
function dropDivision(tier: Tier, division: Division | null): {
  tier: Tier;
  division: Division | null;
} {
  if (tier === Tier.BRONZE && division === Division.V) {
    // Floor — cannot drop below Bronze V
    return { tier: Tier.BRONZE, division: Division.V };
  }

  if (DIVISIONLESS_TIERS.has(tier)) {
    const prev = previousTier(tier);
    if (!prev) return { tier, division: null };
    const prevDiv = DIVISIONLESS_TIERS.has(prev) ? null : Division.I;
    return { tier: prev, division: prevDiv };
  }

  const prev = previousDivision(division!);
  if (prev) return { tier, division: prev };

  // Drop to previous tier, division I
  const prevT = previousTier(tier);
  if (!prevT) return { tier, division: Division.V };

  const prevDiv = DIVISIONLESS_TIERS.has(prevT) ? null : Division.I;
  return { tier: prevT, division: prevDiv };
}

// ─── LP APPLICATION ───────────────────────────────────────────────────────────

/**
 * Apply an LP delta to a player's visible rank.
 * Handles division advancement, demotion, and promotion series entry.
 * Returns the updated rank fields.
 */
function applyLpDelta(rank: PlayerRank, lpDelta: number): PlayerRank {
  let { visible_tier, visible_division, league_points } = rank;
  let { in_promotion_series, promotion_wins, promotion_losses } = rank;

  // ── Promotion series active ──────────────────────────────────────
  if (in_promotion_series) {
    if (lpDelta > 0) {
      promotion_wins++;
      if (promotion_wins >= PROMOTION_WINS_NEEDED) {
        // Passed promotion!
        const next    = advanceDivision(visible_tier, visible_division);
        visible_tier     = next.tier;
        visible_division = next.division;
        league_points    = 0;
        in_promotion_series = false;
        promotion_wins      = 0;
        promotion_losses    = 0;
      }
    } else {
      promotion_losses++;
      if (promotion_losses > PROMOTION_LOSSES_ALLOWED) {
        // Failed promotion — drop back to 75 LP in division I
        league_points       = 75;
        in_promotion_series = false;
        promotion_wins      = 0;
        promotion_losses    = 0;
      }
    }
    return { ...rank, visible_tier, visible_division, league_points,
      in_promotion_series, promotion_wins, promotion_losses };
  }

  // ── Normal LP update ─────────────────────────────────────────────
  league_points += lpDelta;

  // ── Overflow: enter promotion or advance ─────────────────────────
  if (league_points >= LP_PROMOTION_THRESHOLD) {
    // Divisionless tiers (Master+) have no cap
    if (DIVISIONLESS_TIERS.has(visible_tier) && visible_tier !== Tier.PEASANT) {
      // Just accumulate points above threshold
      // King threshold already passed, keep going
      const next = nextTier(visible_tier);
      if (next && league_points >= LP_PROMOTION_THRESHOLD) {
        visible_tier     = next;
        visible_division = null;
        league_points    = 0;
      }
      // clamp to reasonable display value
      league_points = Math.min(league_points, 9999);
    } else if (visible_division === Division.I || !visible_division) {
      // Division I overflow → trigger promotion series
      league_points       = 100;
      in_promotion_series = true;
      promotion_wins      = 0;
      promotion_losses    = 0;
    } else {
      // Advance within tier
      const next    = advanceDivision(visible_tier, visible_division);
      visible_tier     = next.tier;
      visible_division = next.division;
      league_points    = league_points - LP_PROMOTION_THRESHOLD;
    }
  }

  // ── Underflow: demotion ──────────────────────────────────────────
  if (league_points < 0) {
    if (visible_tier === Tier.BRONZE && visible_division === Division.V) {
      league_points = 0; // Floor — no demotion from Bronze V
    } else {
      const prev    = dropDivision(visible_tier, visible_division);
      visible_tier     = prev.tier;
      visible_division = prev.division;
      league_points    = Math.max(0, 75 + league_points); // Land at 75 LP in new division
    }
  }

  return { ...rank, visible_tier, visible_division, league_points,
    in_promotion_series, promotion_wins, promotion_losses };
}

// ─── RANKED SYSTEM CLASS ─────────────────────────────────────────────────────

export class RankedSystem {
  private readonly seasonNumber: number;

  constructor(currentSeason = 1) {
    this.seasonNumber = currentSeason;
  }

  // ── Factory ────────────────────────────────────────────────────────────────

  /**
   * Create a fresh PlayerRank for a new account.
   * High RD → big swings during placement games.
   *
   * UI: Show "Placement 0/10" badge until provisional_games_left reaches 0.
   */
  initializeNewPlayer(): PlayerRank {
    return {
      hidden_mmr:                INITIAL_MMR,
      rating_deviation:          INITIAL_RD,
      volatility:                INITIAL_VOLATILITY,
      visible_tier:              Tier.PEASANT,
      visible_division:          null,
      league_points:             0,
      season_number:             this.seasonNumber,
      provisional_games_left:    PLACEMENT_GAMES,
      total_ranked_games_played: 0,
      in_promotion_series:       false,
      promotion_wins:            0,
      promotion_losses:          0,
    };
  }

  // ── Core match processor ────────────────────────────────────────────────────

  /**
   * Process the result of a completed match.
   *
   * If isRankedMatch = false: returns both players UNCHANGED.
   * If isRankedMatch = true: runs Glicko-2 + LP update on both players.
   *
   * @param playerA  Current rank of player A.
   * @param playerB  Current rank of player B.
   * @param winner   "A" if player A won, "B" if player B won.
   * @param isRankedMatch  Must be true for any rating change to occur.
   */
  processMatchResult(
    playerA: PlayerRank,
    playerB: PlayerRank,
    winner: 'A' | 'B',
    isRankedMatch: boolean,
  ): MatchResult {
    // ── Guard: casual / AI matches are completely ignored ────────────
    if (!isRankedMatch) {
      return { playerA, playerB, lp_delta_a: 0, lp_delta_b: 0,
               new_mmr_a: playerA.hidden_mmr, new_mmr_b: playerB.hidden_mmr };
    }

    const scoreA = winner === 'A' ? 1 : 0;
    const scoreB = winner === 'B' ? 1 : 0;

    // ── Glicko-2 multiplier during placement games ────────────────────
    const multiplierA = playerA.provisional_games_left > 0
      ? PLACEMENT_MMR_MULTIPLIER : 1;
    const multiplierB = playerB.provisional_games_left > 0
      ? PLACEMENT_MMR_MULTIPLIER : 1;

    // ── Glicko-2 update ───────────────────────────────────────────────
    const updatedA = glicko2Update(playerA, playerB, scoreA as 0 | 0.5 | 1, multiplierA);
    const updatedB = glicko2Update(playerB, playerA, scoreB as 0 | 0.5 | 1, multiplierB);

    // ── LP calculation ────────────────────────────────────────────────
    const lpDeltaA = calculateLpDelta(playerA.hidden_mmr, playerB.hidden_mmr, winner === 'A');
    const lpDeltaB = calculateLpDelta(playerB.hidden_mmr, playerA.hidden_mmr, winner === 'B');

    // ── Apply LP changes to visible rank ─────────────────────────────
    // Note: PEASANT players get their first visible tier after placement
    let rankA: PlayerRank = { ...playerA, ...updatedA };
    let rankB: PlayerRank = { ...playerB, ...updatedB };

    // Decrement provisional / placement counters
    rankA = {
      ...rankA,
      provisional_games_left:    Math.max(0, rankA.provisional_games_left - 1),
      total_ranked_games_played: rankA.total_ranked_games_played + 1,
    };
    rankB = {
      ...rankB,
      provisional_games_left:    Math.max(0, rankB.provisional_games_left - 1),
      total_ranked_games_played: rankB.total_ranked_games_played + 1,
    };

    // After placement, assign initial visible tier based on MMR
    if (playerA.provisional_games_left === 1 && rankA.provisional_games_left === 0) {
      rankA = this._assignInitialTier(rankA);
    }
    if (playerB.provisional_games_left === 1 && rankB.provisional_games_left === 0) {
      rankB = this._assignInitialTier(rankB);
    }

    // Recovery: players who finished placement before the ranked system was wired up
    // will have provisional_games_left=0 but visible_tier=PEASANT — assign their tier now.
    if (rankA.provisional_games_left === 0 && rankA.visible_tier === Tier.PEASANT) {
      rankA = this._assignInitialTier(rankA);
    }
    if (rankB.provisional_games_left === 0 && rankB.visible_tier === Tier.PEASANT) {
      rankB = this._assignInitialTier(rankB);
    }

    // Apply LP only for non-placement players
    if (rankA.provisional_games_left === 0 && rankA.visible_tier !== Tier.PEASANT) {
      rankA = applyLpDelta(rankA, lpDeltaA);
    }
    if (rankB.provisional_games_left === 0 && rankB.visible_tier !== Tier.PEASANT) {
      rankB = applyLpDelta(rankB, lpDeltaB);
    }

    return {
      playerA:    rankA,
      playerB:    rankB,
      lp_delta_a: rankA.visible_tier !== Tier.PEASANT ? lpDeltaA : 0,
      lp_delta_b: rankB.visible_tier !== Tier.PEASANT ? lpDeltaB : 0,
      new_mmr_a:  updatedA.hidden_mmr,
      new_mmr_b:  updatedB.hidden_mmr,
    };
  }

  // ── Display helper ─────────────────────────────────────────────────────────

  /**
   * Returns a formatted display object for the UI.
   *
   * UI usage:
   *   const rank = system.getVisibleRank(player);
   *   // rank.display      → "Gold II"
   *   // rank.tier         → Tier.GOLD
   *   // rank.league_points→ 47
   *   // Animate LP bar: rank.league_points / 100
   *   // Show provisional badge if rank.is_provisional
   *   // Show "Placement X/10" if rank.is_in_placement
   */
  getVisibleRank(player: PlayerRank): VisibleRank {
    const divStr   = player.visible_division ? ` ${player.visible_division}` : '';
    const tierStr  = player.visible_tier.charAt(0) + player.visible_tier.slice(1).toLowerCase();
    const display  = `${tierStr}${divStr}`;

    return {
      tier:               player.visible_tier,
      division:           player.visible_division,
      league_points:      player.league_points,
      display,
      is_provisional:     player.total_ranked_games_played < PROVISIONAL_GAMES_THRESHOLD,
      is_in_placement:    player.provisional_games_left > 0,
      in_promotion_series:player.in_promotion_series,
      promotion_wins:     player.promotion_wins,
      promotion_losses:   player.promotion_losses,
    };
  }

  // ── Promotion check (manual trigger) ──────────────────────────────────────

  /**
   * Check if a player should enter promotion series.
   * Normally called automatically by processMatchResult — exposed here
   * for cases where LP is modified externally (e.g., season soft-reset).
   */
  checkPromotion(player: PlayerRank): PlayerRank {
    if (
      !player.in_promotion_series &&
      player.league_points >= LP_PROMOTION_THRESHOLD &&
      (player.visible_division === Division.I || DIVISIONLESS_TIERS.has(player.visible_tier))
    ) {
      return { ...player, in_promotion_series: true, promotion_wins: 0, promotion_losses: 0 };
    }
    return player;
  }

  // ── Season management ──────────────────────────────────────────────────────

  /**
   * Apply a new season to a player's rank.
   *
   * Rules:
   *   - hidden_mmr is PRESERVED (not reset).
   *   - rating_deviation is partially increased (simulate inactivity).
   *   - visible tier / division / LP is soft-reset: drop ~1 full tier.
   *   - season_number is bumped.
   *   - Promotion series is cancelled.
   *   - provisional_games_left stays 0 (no re-placement).
   *
   * UI: Show a "Season X has begun" modal after login if season_number changed.
   */
  startNewSeason(player: PlayerRank, newSeasonNumber: number): PlayerRank {
    if (player.season_number >= newSeasonNumber) return player; // Already updated

    // Soft-reset visible tier: drop one full tier (but not below Bronze V)
    const prevT = previousTier(player.visible_tier) ?? Tier.BRONZE;
    const prevDiv = DIVISIONLESS_TIERS.has(prevT) ? null : Division.I;

    // Slightly increase RD to reflect inactivity period
    const newRd = Math.min(
      player.rating_deviation + RD_DECAY_PER_PERIOD * 4, // 4 periods ≈ 1 season
      INITIAL_RD,
    );

    return {
      ...player,
      visible_tier:        prevT,
      visible_division:    prevDiv,
      league_points:       50,  // Start mid-division I of the lower tier
      season_number:       newSeasonNumber,
      rating_deviation:    newRd,
      in_promotion_series: false,
      promotion_wins:      0,
      promotion_losses:    0,
    };
  }

  // ── RD decay (call once per rating period, e.g., weekly) ──────────────────

  /**
   * Apply rating deviation decay for an inactive player.
   * Call this for all players at the end of each rating period.
   * Players who played this period: skip (Glicko-2 already updated their RD).
   */
  applyRdDecay(player: PlayerRank): PlayerRank {
    const newRd = Math.min(
      player.rating_deviation + RD_DECAY_PER_PERIOD,
      INITIAL_RD,
    );
    return { ...player, rating_deviation: newRd };
  }

  // ── DB serialization ────────────────────────────────────────────────────────

  /**
   * Convert a PlayerRank to a flat DB row (SQLite-compatible types).
   *
   * JSON schema for DB column / migration:
   * {
   *   "hidden_mmr": REAL,
   *   "rating_deviation": REAL,
   *   "volatility": REAL,
   *   "visible_tier": TEXT,
   *   "visible_division": TEXT | NULL,
   *   "league_points": INTEGER,
   *   "season_number": INTEGER,
   *   "provisional_games_left": INTEGER,
   *   "total_ranked_games_played": INTEGER,
   *   "in_promotion_series": INTEGER (0|1),
   *   "promotion_wins": INTEGER,
   *   "promotion_losses": INTEGER
   * }
   */
  toDbRow(player: PlayerRank): PlayerRankDbRow {
    return {
      hidden_mmr:                player.hidden_mmr,
      rating_deviation:          player.rating_deviation,
      volatility:                player.volatility,
      visible_tier:              player.visible_tier,
      visible_division:          player.visible_division,
      league_points:             player.league_points,
      season_number:             player.season_number,
      provisional_games_left:    player.provisional_games_left,
      total_ranked_games_played: player.total_ranked_games_played,
      in_promotion_series:       player.in_promotion_series ? 1 : 0,
      promotion_wins:            player.promotion_wins,
      promotion_losses:          player.promotion_losses,
    };
  }

  /** Reconstruct a PlayerRank from a DB row. */
  fromDbRow(row: PlayerRankDbRow): PlayerRank {
    return {
      hidden_mmr:                row.hidden_mmr,
      rating_deviation:          row.rating_deviation,
      volatility:                row.volatility,
      visible_tier:              row.visible_tier as Tier,
      visible_division:          row.visible_division as Division | null,
      league_points:             row.league_points,
      season_number:             row.season_number,
      provisional_games_left:    row.provisional_games_left,
      total_ranked_games_played: row.total_ranked_games_played,
      in_promotion_series:       row.in_promotion_series === 1,
      promotion_wins:            row.promotion_wins,
      promotion_losses:          row.promotion_losses,
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * After a player completes their placement games, assign their initial
   * visible tier based on their hidden MMR.
   */
  private _assignInitialTier(player: PlayerRank): PlayerRank {
    const mmr = player.hidden_mmr;

    for (const [tierName, [min, max]] of Object.entries(TIER_MMR_BOUNDARIES)) {
      if (mmr >= min && mmr < max) {
        const tier    = tierName as Tier;
        const division = DIVISIONLESS_TIERS.has(tier) ? null : Division.III; // Start mid-tier
        return { ...player, visible_tier: tier, visible_division: division, league_points: 50 };
      }
    }

    // Fallback: Bronze III
    return { ...player, visible_tier: Tier.BRONZE, visible_division: Division.III, league_points: 50 };
  }
}

// ─── EXAMPLE USAGE ───────────────────────────────────────────────────────────
// Uncomment and run with ts-node to see output.

/*

const system = new RankedSystem(1);

// ── Scenario 1: New player — 10 placement games ──────────────────────────────

console.log('\n=== SCENARIO 1: Placement games ===');

let newPlayer  = system.initializeNewPlayer();
// Simulate a strong opponent for contrast
let strongBot: PlayerRank = {
  ...system.initializeNewPlayer(),
  hidden_mmr: 2000,
  rating_deviation: 80,
  volatility: 0.055,
  visible_tier: Tier.PLATINUM,
  visible_division: Division.II,
  league_points: 40,
  provisional_games_left: 0,
  total_ranked_games_played: 200,
  in_promotion_series: false,
  promotion_wins: 0,
  promotion_losses: 0,
};

for (let i = 0; i < PLACEMENT_GAMES; i++) {
  const won    = i % 3 !== 0; // Win 7/10 placements
  const result = system.processMatchResult(
    newPlayer, strongBot, won ? 'A' : 'B', true
  );
  newPlayer = result.playerA;
  console.log(
    `Placement ${i + 1}/10: ${won ? 'WIN ' : 'LOSS'} | ` +
    `MMR: ${newPlayer.hidden_mmr.toFixed(0)} | ` +
    `RD: ${newPlayer.rating_deviation.toFixed(0)} | ` +
    `Visible: ${system.getVisibleRank(newPlayer).display}`
  );
}

console.log('\nFinal placement rank:', system.getVisibleRank(newPlayer));


// ── Scenario 2: Average player — 5 ranked wins in a row ──────────────────────

console.log('\n=== SCENARIO 2: 5 ranked wins in a row ===');

let midPlayer: PlayerRank = {
  ...system.initializeNewPlayer(),
  hidden_mmr: 1400,
  rating_deviation: 70,
  volatility: 0.059,
  visible_tier: Tier.GOLD,
  visible_division: Division.III,
  league_points: 60,
  provisional_games_left: 0,
  total_ranked_games_played: 80,
  in_promotion_series: false,
  promotion_wins: 0,
  promotion_losses: 0,
};

let similarOpp: PlayerRank = { ...midPlayer, hidden_mmr: 1380 };

for (let i = 0; i < 5; i++) {
  const result  = system.processMatchResult(midPlayer, similarOpp, 'A', true);
  midPlayer = result.playerA;
  const rank    = system.getVisibleRank(midPlayer);
  console.log(
    `Win ${i + 1}: ${rank.display} | LP: ${rank.league_points} | ` +
    `MMR: ${midPlayer.hidden_mmr.toFixed(0)} | ` +
    `In promo: ${rank.in_promotion_series ? `${rank.promotion_wins}/3` : 'no'}`
  );
}


// ── Scenario 3: High-rank player loses to a much weaker player ───────────────

console.log('\n=== SCENARIO 3: Diamond loses to Gold ===');

let diamondPlayer: PlayerRank = {
  ...system.initializeNewPlayer(),
  hidden_mmr: 2400,
  rating_deviation: 50,
  volatility: 0.052,
  visible_tier: Tier.DIAMOND,
  visible_division: Division.II,
  league_points: 30,
  provisional_games_left: 0,
  total_ranked_games_played: 500,
  in_promotion_series: false,
  promotion_wins: 0,
  promotion_losses: 0,
};

let goldUpset: PlayerRank = {
  ...system.initializeNewPlayer(),
  hidden_mmr: 1600,
  rating_deviation: 90,
  volatility: 0.06,
  visible_tier: Tier.GOLD,
  visible_division: Division.I,
  league_points: 55,
  provisional_games_left: 0,
  total_ranked_games_played: 150,
  in_promotion_series: false,
  promotion_wins: 0,
  promotion_losses: 0,
};

const upset = system.processMatchResult(diamondPlayer, goldUpset, 'B', true);
console.log(`Diamond MMR: ${diamondPlayer.hidden_mmr.toFixed(0)} → ${upset.playerA.hidden_mmr.toFixed(0)}`);
console.log(`Diamond LP delta: ${upset.lp_delta_a} | New rank: ${system.getVisibleRank(upset.playerA).display}`);
console.log(`Gold MMR: ${goldUpset.hidden_mmr.toFixed(0)} → ${upset.playerB.hidden_mmr.toFixed(0)}`);
console.log(`Gold LP delta: +${upset.lp_delta_b} | New rank: ${system.getVisibleRank(upset.playerB).display}`);


// ── Scenario 4: Casual match — zero impact ────────────────────────────────────

console.log('\n=== SCENARIO 4: Casual match — no change ===');

const before  = { ...midPlayer };
const casual  = system.processMatchResult(midPlayer, similarOpp, 'A', false);
console.log(`MMR before: ${before.hidden_mmr.toFixed(0)} | MMR after: ${casual.playerA.hidden_mmr.toFixed(0)}`);
console.log(`LP before: ${before.league_points} | LP after: ${casual.playerA.league_points}`);
console.log('Both unchanged? ', casual.playerA === midPlayer || (
  casual.playerA.hidden_mmr === midPlayer.hidden_mmr &&
  casual.playerA.league_points === midPlayer.league_points
));

*/
