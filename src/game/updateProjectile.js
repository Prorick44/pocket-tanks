export function updateProjectile(g, explode) {
  const p = g.projectile;
  if (!p) return false;

  // physics
  p.vx += g.wind;
  p.vy += 0.2;

  p.x += p.vx;
  p.y += p.vy;

  /* =========================
     ✅ TANK COLLISION FIRST
  ========================= */
  for (let t of g.tanks) {
    const d = Math.hypot(p.x - t.x, p.y - t.y);

    if (d < 12) {
      explode(p.x, p.y); // ✅ HIT
      return true;
    }
  }

  /* =========================
     ✅ TERRAIN COLLISION
  ========================= */
  const tx = Math.floor(p.x);

  if (tx >= 0 && tx < g.terrain.length) {
    if (p.y >= g.terrain[tx]) {
      explode(p.x, p.y); // ground hit
      return true;
    }
  }

  /* =========================
     ❌ OUT OF BOUNDS (MISS)
  ========================= */
  if (p.x < 0 || p.x > g.terrain.length || p.y > 600) {
    g.projectile = null;
    return false; // MISS
  }

  return true; // still flying
}
