# THRONES — Official Rules
*First Edition 2026*

---

## THE BOARD

A **hexagonal grid** of 37 hexes (radius 3). Each player controls:
- **1 Throne** — placed in their back-center hex (crown icon)
- **2 Towers** — placed in the two back-corner hexes
- Starting units arranged in front of the Throne/Tower line

Units **cannot land on Throne hexes**. Tower hexes are walkable — units may occupy them freely.

---

## UNITS

Each player starts with **7 units**: 2 Shields, 2 Rams, 2 Warriors, 1 Hook.

| Unit | Count | Moves | Attacks | Killed by | Capture rule | Note |
|------|-------|-------|---------|-----------|--------------|------|
| **Shield** | 2 | 1 hex (any direction) | Warrior or Hook (adjacent) | Ram charge | Attacker → Shield's hex | Zone of Control (adjacent hexes) |
| **Ram** | 2 | 1–2 hexes straight, **can jump over units** | Shield or Hook (charge 1–2 hex — **can jump over Warriors & Rams** to reach target) | Warrior | Ram → target's hex | Charge jumps Warriors/Rams; stops at first Shield or Hook |
| **Warrior** | 2 | **1 hex (any direction)** OR **2 hexes in L-shape** (no straight 2-step) | Ram (**adjacent** or L-shape) + **Throne** (adjacent or L-shape) — **cannot capture Hook** | Shield | Warrior → target's hex | Stays in place after Throne kill |
| **Hook** | 1 | 1 hex (any direction, not if grappled) | Nothing — stuns enemies only | Shield, Ram (**not Warrior**) | Attacker → Hook's hex | **Cannot respawn. Permanent death. Grapple = full action.** |

### Combat chain (Triangle)
> **Ram beats Shield & Hook · Shield beats Warrior & Hook · Warrior beats Ram only · Only Warrior kills Throne**

```
       BÉLIER
      /       \
     ▼         ▼
BOUCLIER ←── GUERRIER
```
*(arrows = "beats")*

> The Hook cannot be killed by another Hook. Hooks cannot grapple each other.

---

## TURN STRUCTURE

Players alternate turns. On your turn, you perform exactly **ONE action** — choose one option:

### Option A — RESPAWN a unit
If you control at least one Active Tower, place one previously captured unit **directly on that Tower's hex** (if it is free).
**This counts as your entire turn.** You do not also get to move or attack.
The respawned unit can act normally from your next turn.
**The Hook cannot respawn** — its destruction is permanent.

### Option B — MOVE or ATTACK with a unit
Choose ONE of your units and either:
- **MOVE** it according to its movement rules, OR
- Use its **ATTACK / ABILITY**

You cannot move and attack in the same turn with the same unit.

> **KEY RULE:** One action per turn — EITHER respawn a unit OR move/attack with a unit. Never both. No exceptions.

---

## MOVEMENT RULES

Units cannot land on Throne hexes. Tower hexes are walkable — units may freely move onto them.

| Unit | Movement | Notes |
|------|----------|-------|
| **Shield** | 1 hex (any direction) | Exerts Zone of Control on all adjacent hexes |
| **Ram** | 1 or 2 hexes in a **straight line**, **can jump over units** | Cannot land on an occupied hex. Cannot pass through Throne hexes. |
| **Warrior** | **1 hex (any direction)** OR **2 hexes in L-shape** — no straight 2-step | For L-moves: must change direction between step 1 and step 2. Intermediate hex must be free. |
| **Hook** | 1 hex (any direction) | Cannot move the turn it uses its grapple |

### Zone of Control (Shield)
Any enemy unit that begins its move adjacent to a Shield must spend its **entire action** to leave that hex. It cannot attack or do anything else that turn.

---

## COMBAT

Each attack is a **capture** — the attacker moves into the captured unit's hex (except Warriors killing the Throne, who stay put).

### Shield
Attacks an **adjacent** Warrior or Hook. Target is captured. Shield moves to target's hex.

### Ram — Charge
Charges in a **straight line** at a Shield or Hook located **1 or 2 hexes away**. The Ram **can jump over any non-target unit** (allies, enemy Warriors, enemy Rams) during its charge. It stops at the first valid target (Shield or Hook) it encounters. Throne hexes block the charge. Ram captures the target and moves to its hex.

> **Charge jump (official rule):** During a charge, the Ram jumps over Warriors and Rams (friend or foe) and stops only at the first Shield or Hook in the line. This means a Warrior standing in front of a Shield does NOT protect it from a Ram charge.

> **Note:** Ram movement and Ram charge are two separate actions. A Ram may move OR charge on its turn, not both.

### Warrior
Attacks a **Ram** reachable at **distance 1 (adjacent)** or via **L-shape (distance 2)** with a clear intermediate hex. Warrior captures the target and moves to its hex.

> **Warrior cannot capture the Hook.** Only Shields (adjacent) and Rams (charge) can capture the Hook.

### Warrior — Throne Kill
A Warrior within **1 hex (adjacent)** or **2 hexes via L-shape** of the enemy Throne (with clear path) may use its attack on it. The Throne is destroyed. **The Warrior stays in its current hex** (unique exception — it does not move to the Throne's hex). The player whose Throne is destroyed loses immediately.

> No other unit type can attack the Throne.

### Hook — Grapple
The Hook **pulls** an enemy unit toward itself along a straight line.
- **Range:** **2 to 7 hexes** in a straight line. The Hook cannot grab an adjacent unit (minimum distance = 2). It targets the first enemy unit visible in any of the 6 directions (line of sight — any unit between Hook and target blocks).
- **Destination:** the target is pulled to the hex **1 step from the Hook** in the direction of the target. This hex must be free and non-special.
- **Enemy pulled** = stunned (loses their entire next turn)
- **The Hook cannot grapple allies** or another Hook
- **The Hook does not kill**
- **The Hook cannot move the same turn it uses its grapple**
- Using the grapple **is** the Hook's full action

---

## STUN

A stunned unit **skips its entire next turn**. The stun is shown visually on the unit (diagonal lines). At the end of the stunned unit's skipped turn, the stun is removed and the unit may act normally from the following turn.

---

## THE TOWER MECHANIC

Captured units are not permanently lost (except the Hook). They can return to play via Towers.

### Tower States
| State | Condition |
|-------|-----------|
| **ACTIVE** | At least 1 of your units is adjacent to this Tower AND no enemy unit is adjacent. Available for respawn. |
| **BLOCKED** | An enemy unit is adjacent to this Tower. Cannot be used for respawn even if you also have a unit nearby. |
| **INACTIVE** | None of your units are adjacent. Unusable. |

> **Note:** Being adjacent to an enemy Tower blocks their respawn — but you may still **move your unit onto the Tower hex** freely. Only respawning is restricted.

### Respawn Rules
- **Respawning is your entire turn action.** If you respawn, you cannot also move or attack this turn.
- Place the unit **directly on an Active Tower hex** (the Tower hex itself must be free).
- Maximum **1 respawn per turn**.
- The respawned unit **can act normally from your next turn**.
- **The Hook cannot respawn** — its destruction is permanent. Protect it carefully.

---

## WINNING CONDITIONS

### Destroy the enemy Throne
A Warrior **adjacent (1 hex)** or within **L-shape reach (2 hexes)** of the enemy Throne (clear path) uses its attack on it. The Throne is destroyed. The Warrior stays in its current hex. **The player whose Throne is destroyed loses immediately.**

---

## DRAW CONDITIONS

- **40-Turn Rule:** If 40 turns pass without any capture AND without a Warrior advancing closer to the enemy Throne than its previous record distance, the game ends in a draw.
- **Mutual agreement:** Both players may agree to a draw at any point.
- **Repetition:** If the exact same board position occurs 3 times with the same player to move, either player may claim a draw.

---

## IN-GAME ACTIONS (Digital version)

- **ANNULER:** Undo your last move (available once per turn, before the opponent plays).
- **ABANDONNER:** Concede the game — your opponent wins immediately.

---

## QUICK REFERENCE — TURN SEQUENCE

| | |
|---|---|
| **YOUR TURN** | Choose ONE action only — Option A or Option B, never both. |
| **Option A — Respawn** | Place 1 dead unit (not Hook) directly on a free Active Tower hex. This IS your full turn. Unit acts from next turn. |
| **Option B — Play a unit** | MOVE the chosen unit OR use its ATTACK / ABILITY. One or the other, not both. |
| **Hook rule** | Grapple range: 2–7 hexes (cannot grab adjacent). Pulled to 1 step from Hook, stunned. Hook cannot move this turn. Killed only by Shield or Ram (not Warrior). |
| **Stun rule** | Stunned unit skips its next turn entirely, then acts normally. |

---

## UNIT SUMMARY TABLE

| | Shield | Ram | Warrior | Hook |
|---|---|---|---|---|
| **Moves** | 1 hex, any dir | 1–2 hex, straight, **jumps over units** | **1 hex any dir** OR **2 hex L-shape** (no straight) | 1 hex, any dir |
| **Kills** | Warrior, Hook | Shield, Hook (charge 1–2, jumps over non-targets) | Ram (adjacent or L-shape) + **Throne** (adjacent or L-shape) | — (stuns only) |
| **Killed by** | Ram | Warrior | Shield | Shield, Ram |
| **Respawn** | ✓ | ✓ | ✓ | ✗ (permanent death) |

---

*THRONES · First Edition 2026*
