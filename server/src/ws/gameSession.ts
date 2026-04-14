import type { Room, RoomPlayer } from './roomManager';
import { Player } from '../../../shared/types';
import type { ServerMessage } from '../../../shared/types';
import { saveGame, updateElo, getUserById } from '../db/queries';

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
) {
  if (room.players.length < 2) return;

  const [p1, p2] = room.players;
  const userP1 = getUserById(p1.userId);
  const userP2 = getUserById(p2.userId);
  if (!userP1 || !userP2) return;

  let scoreP1 = 0.5; // draw
  if (!isDraw) {
    scoreP1 = winnerSlot === Player.P1 ? 1 : 0;
  }

  const elo = calcElo(userP1.elo, userP2.elo, scoreP1);

  const winnerId = isDraw ? null : (winnerSlot === Player.P1 ? p1.userId : p2.userId);
  saveGame(p1.userId, p2.userId, winnerId, elo.changeA, elo.changeB, turns);

  updateElo(p1.userId, elo.newA, !isDraw && winnerSlot === Player.P1);
  updateElo(p2.userId, elo.newB, !isDraw && winnerSlot === Player.P2);

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

  room.status = 'finished';
}
