import { GRAVITY } from "./constants";

export function updateProjectile(game, explode) {
  if (!game.projectile) return;

  let { x, y, vx, vy } = game.projectile;

  vx += game.wind;
  x += vx;
  y += vy;
  vy += GRAVITY;

  game.trail = [...game.trail, { x, y }].slice(-40);

  // 🚨 SAFE BOUNDS CHECK (IMPORTANT FIX)
  if (x < 0 || x >= 1000) {
    explode(Math.max(0, Math.min(999, x)), y);
    return;
  }

  const ix = Math.floor(x);

  if (!game.terrain[ix]) {
    explode(x, y);
    return;
  }

  const ground = game.terrain[ix];

  if (y >= ground) {
    explode(x, y);
    return;
  }

  game.projectile = { x, y, vx, vy };
}
