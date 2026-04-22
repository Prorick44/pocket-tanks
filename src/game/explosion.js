import { WEAPONS } from "./constants";

export function spawnParticles(x, y) {
  const p = [];
  for (let i = 0; i < 25; i++) {
    p.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 40,
    });
  }
  return p;
}

export function damageTerrain(game, x, y) {
  const terrain = [...game.terrain];
  const w = WEAPONS[game.weapon];

  for (let i = 0; i < terrain.length; i++) {
    const dist = Math.hypot(i - x, terrain[i] - y);
    if (dist < w.radius) {
      terrain[i] += (w.radius - dist) * 0.6;
    }
  }

  game.terrain = terrain;
}

export function explode(game, x, y) {
  const w = WEAPONS[game.weapon];

  damageTerrain(game, x, y);

  let tanks = game.tanks.map((t) => {
    const d = Math.hypot(t.x - x, t.y - y);

    if (d < w.radius) {
      const dmg = w.damage * (1 - d / w.radius);
      return { ...t, health: Math.max(0, t.health - dmg) };
    }

    return t;
  });

  let winner = null;
  if (tanks[0].health <= 0) winner = "AI";
  if (tanks[1].health <= 0) winner = "PLAYER";

  return {
    ...game,
    tanks,
    projectile: null,
    trail: [],
    particles: [...game.particles, ...spawnParticles(x, y)],
    turn: game.turn === "player" ? "ai" : "player",
    wind: Math.random() * 0.2 - 0.1,
    winner,
  };
}
