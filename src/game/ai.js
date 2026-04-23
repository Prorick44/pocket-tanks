export function aiTurn(g, fire) {
  const ai = g.tanks[1];
  const player = g.tanks[0];

  let best = {
    angle: 45,
    power: 10,
    error: Infinity,
  };

  // simulate shots
  for (let a = 20; a <= 80; a += 2) {
    for (let p = 6; p <= 20; p += 1) {
      let sim = simulate(ai, a, p, g.wind);

      let err = Math.abs(sim.x - player.x);

      if (err < best.error) {
        best = { angle: a, power: p, error: err };
      }
    }
  }

  g.angle = best.angle;
  g.power = best.power;

  setTimeout(() => fire(), 400);
}

function simulate(tank, angle, power, wind) {
  let a = ((180 - angle) * Math.PI) / 180;

  let x = tank.x;
  let y = tank.y;

  let vx = Math.cos(a) * power;
  let vy = -Math.sin(a) * power;

  for (let i = 0; i < 120; i++) {
    vx += wind;
    vy += 0.2;

    x += vx;
    y += vy;

    if (y > 600) break;
  }

  return { x, y };
}
