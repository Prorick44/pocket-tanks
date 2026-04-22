import { WEAPONS } from "./constants";
import { GRAVITY } from "./constants";

export function draw(ctx, game) {
  ctx.clearRect(0, 0, 1000, 600);

  // 🌄 TERRAIN
  ctx.fillStyle = "#3e2f1c";
  ctx.beginPath();
  ctx.moveTo(0, 600);
  game.terrain.forEach((h, i) => ctx.lineTo(i, h));
  ctx.lineTo(1000, 600);
  ctx.fill();

  // 🧍 TANKS + NOZZLE
  game.tanks.forEach((t, i) => {
    t.y = game.terrain[Math.floor(t.x)];

    const isPlayer = i === 0;

    ctx.fillStyle = isPlayer ? "#4ade80" : "#ef4444";
    ctx.fillRect(t.x - 18, t.y - 10, 36, 10);

    // 🔫 NOZZLE
    const angle = ((isPlayer ? game.angle : 180 - game.angle) * Math.PI) / 180;

    const nx = t.x + Math.cos(angle) * 25;
    const ny = t.y - 10 - Math.sin(angle) * 25;

    ctx.strokeStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(t.x, t.y - 10);
    ctx.lineTo(nx, ny);
    ctx.stroke();

    // ❤️ HEALTH
    ctx.fillStyle = "black";
    ctx.fillRect(t.x - 25, t.y - 30, 50, 6);

    ctx.fillStyle = "#22c55e";
    ctx.fillRect(t.x - 25, t.y - 30, (t.health / 100) * 50, 6);
  });

  // 🎯 TRAJECTORY (PLAYER ONLY)
  if (game.turn === "player" && !game.projectile) {
    const t = game.tanks[0];

    let x = t.x;
    let y = t.y - 10;

    const angle = (game.angle * Math.PI) / 180;
    let vx = Math.cos(angle) * game.power;
    let vy = -Math.sin(angle) * game.power;

    ctx.fillStyle = "rgba(255,255,255,0.6)";

    for (let i = 0; i < 35; i++) {
      vx += game.wind;
      x += vx;
      y += vy;
      vy += GRAVITY;

      if (x < 0 || x > 1000) break;

      ctx.fillRect(x, y, 2, 2);
    }
  }

  // 💥 PROJECTILE
  if (game.projectile) {
    ctx.fillStyle = WEAPONS[game.weapon].color;
    ctx.beginPath();
    ctx.arc(game.projectile.x, game.projectile.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 💣 TRAIL
  ctx.fillStyle = "rgba(255,255,0,0.5)";
  game.trail.forEach((p) => ctx.fillRect(p.x, p.y, 2, 2));

  // 🧠 UI
  ctx.fillStyle = "white";
  ctx.fillText(`Angle: ${game.angle}`, 20, 20);
  ctx.fillText(`Power: ${game.power}`, 20, 40);
  ctx.fillText(`Weapon: ${WEAPONS[game.weapon].name}`, 20, 60);

  if (game.winner) {
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, 1000, 600);

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 64px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${game.winner} WINS`, 500, 260);

    // Subtitle
    ctx.font = "20px Arial";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("Battle Finished", 500, 300);

    // Button (visual only on canvas)
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(420, 340, 160, 50);

    ctx.fillStyle = "#000";
    ctx.font = "20px Arial";
    ctx.fillText("PLAY AGAIN", 500, 372);

    ctx.textAlign = "left";
  }
}
