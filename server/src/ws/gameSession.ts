import type { Room, RoomPlayer } from './roomManager';
import { Player } from '../../../shared/types';
import type { ServerMessage } from '../../../shared/types';
import { saveGame, updateElo, setEloOnly, updateRankedFields, dbUserToPlayerRank, getUserById } from '../db/queries';
import { RankedSystem } from '../../../shared/ranked';

// ELO calculation (K=32, standard formula)
function calcElo(ratingA: number, ratingB: number, scoreA: number): { newA: number; newB: number; changeA: number; changeB: number } {
  const expected = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const changeA  = Math.round(32 * (scoreA - expected));
  const changeB  = -changeA;
  return {
    newA:    ratingA + changeA,
    newB:    ratingB + changeB,
    changeA,
    changeB,
  };
}

export function broadcast(room: Room, msg: ServerMessage) {
  const payload = JSON.stringify(msg);
  for (const p of room.players) {
    if (p.ws.readyState === 1 /* OPEN */) {
      p.ws.send(payload);
    }
  }
}

export function sendTo(player: RoomPlayer, msg: ServerMessage) {
  if (player.ws.readyState === 1) {
    player.ws.send(JSON.stringify(msg));
  }
}

export async function handleGameOver(
  room: Room,
  winnerSlot: Player | null,
  isDraw: boolean,
  turns: number,
  gameMode: 'online_casual' | 'online_ranked' | 'online_custom' = 'online_casual',
) {
  if (room.players.length < 2) return;

  const [p1, p2] = room.players;
  const userP1 = getUserById(p1.userId);
  const userP2 = getUserById(p2.userId);
  if (!userP1 || !userP2) return;

  const winnerId = isDraw ? null : (winnerSlot === Player.P1 ? p1.userId : p2.userId);

  console.log(`[handleGameOver] gameMode=${gameMode} ranked=${(room as { ranked?: boolean }).ranked} winner=${winnerSlot}`);

  if (gameMode === 'online_ranked') {
    // ── Simple ELO (for display / leaderboard) ────────────────────
    let scoreP1 = 0.5;
    if (!isDraw) scoreP1 = winnerSlot === Player.P1 ? 1 : 0;
    const elo = calcElo(userP1.elo, userP2.elo, scoreP1);

    // ── Glicko-2 ranked system (tier / division / LP / MMR) ───────
    const rankedSystem = new RankedSystem(userP1.season_number ?? 1);
    const rankP1 = dbUserToPlayerRank(userP1);
    const rankP2 = dbUserToPlayerRank(userP2);
    const winner: 'A' | 'B' | 'draw' = isDraw ? 'draw' : (winnerSlot === Player.P1 ? 'A' : 'B');

    // For draws: use 'A' win to get MMR/tier updates, but override LP deltas to 0
    const glickoWinner: 'A' | 'B' = isDraw ? 'A' : (winner as 'A' | 'B');
    const matchResult = rankedSystem.processMatchResult(rankP1, rankP2, glickoWinner, true);
    if (isDraw) {
      matchResult.lp_delta_a = 0;
      matchResult.lp_delta_b = 0;
    }

    // Save game record
    saveGame(p1.userId, p2.userId, winnerId, elo.changeA, elo.changeB, turns, gameMode,
             Math.round(matchResult.new_mmr_a ?? matchResult.playerA.hidden_mmr),
             Math.round(matchResult.new_mmr_b ?? matchResult.playerB.hidden_mmr),
             matchResult.lp_delta_a, matchResult.lp_delta_b);

    // Persist Glicko-2 rank (handles games_played / games_won / provisional / tier)
    const wonP1 = !isDraw && winnerSlot === Player.P1;
    const wonP2 = !isDraw && winnerSlot === Player.P2;
    updateRankedFields(p1.userId, matchResult.playerA, wonP1);
    updateRankedFields(p2.userId, matchResult.playerB, wonP2);

    // Update visible ELO separately (not touched by updateRankedFields)
    setEloOnly(p1.userId, elo.newA);
    setEloOnly(p2.userId, elo.newB);

    // Notify P1
    sendTo(p1, {
      type: 'GAME_OVER',
      winner: winnerSlot,
      isDraw,
      eloChangeMe:  elo.changeA,
      eloChangeOpp: elo.changeB,
      newEloMe:     elo.newA,
    });

    // Notify P2
    sendTo(p2, {
      type: 'GAME_OVER',
      winner: winnerSlot,
      isDraw,
      eloChangeMe:  elo.changeB,
      eloChangeOpp: elo.changeA,
      newEloMe:     elo.newB,
    });
  } else {
    // Casual: save game record with 0 ELO change — no ELO update
    saveGame(p1.userId, p2.userId, winnerId, 0, 0, turns, gameMode);

    sendTo(p1, { type: 'GAME_OVER', winner: winnerSlot, isDraw, eloChangeMe: 0, eloChangeOpp: 0, newEloMe: userP1.elo });
    sendTo(p2, { type: 'GAME_OVER', winner: winnerSlot, isDraw, eloChangeMe: 0, eloChangeOpp: 0, newEloMe: userP2.elo });
  }

  room.status = 'finished';
}
