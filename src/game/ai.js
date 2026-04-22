import { GRAVITY } from "./constants";

function simulateShot(game, angleDeg, power) {
  const tank = game.tanks[1];

  let x = tank.x;
  let y = tank.y - 10;

  let angle = (angleDeg * Math.PI) / 180;

  let vx = Math.cos(angle) * power;
  let vy = -Math.sin(angle) * power;

  for (let i = 0; i < 120; i++) {
    vx += game.wind;
    x += vx;
    y += vy;
    vy += GRAVITY;

    if (x < 0 || x >= 1000) break;

    const ix = Math.floor(x);
    const ground = game.terrain[ix];

    if (ground && y >= ground) {
      return { x, y };
    }
  }

  return { x, y };
}

function scoreHit(pos, player) {
  const d = Math.hypot(pos.x - player.x, pos.y - player.y);
  return d;
}

export function aiTurn(game, fire) {
  if (game.winner) return;

  const player = game.tanks[0];

  let best = null;
  let bestScore = Infinity;

  // 🎯 TRY MULTIPLE SHOTS (SMART SEARCH)
  for (let angle = 20; angle <= 80; angle += 5) {
    for (let power = 8; power <= 20; power += 1) {
      const hit = simulateShot(game, angle, power);
      const score = scoreHit(hit, player);

      if (score < bestScore) {
        bestScore = score;
        best = { angle, power };
      }
    }
  }

  if (!best) {
    best = { angle: 45, power: 12 };
  }

  // small randomness (human-like)
  game.angle = best.angle + (Math.random() - 0.5) * 2;
  game.power = best.power + (Math.random() - 0.5) * 0.5;

  setTimeout(() => fire(), 500);
}
