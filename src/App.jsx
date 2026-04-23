import React, { useRef, useEffect } from "react";
import { WIDTH, WEAPONS } from "./game/constants";
import { initGame } from "./game/initGame";
import { aiTurn } from "./game/ai";
import { updateProjectile } from "./game/physics";
import { draw } from "./game/renderer";

const SCENE = {
  PLAY: "play",
  OVER: "over",
};

export default function App() {
  const canvasRef = useRef(null);

  const engineRef = useRef({
    state: initGame(),
    scene: SCENE.PLAY,
    wind: (Math.random() * 2 - 1) * 0.2,
    aiLock: false,
    ui: {
      msg: null,
      msgUntil: 0,
      shake: 0,
    },
    particles: [],
    explosions: [],
  });

  const engine = () => engineRef.current;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ========================= UI ========================= */

  function notify(text, time = 1200) {
    const ui = engine().ui;
    ui.msg = text;
    ui.msgUntil = Date.now() + time;
  }

  function shake(val = 10) {
    engine().ui.shake = val;
  }

  /* ========================= FIRE ========================= */

  function fire() {
    const e = engine();
    const g = e.state;

    if (g.projectile || g.winner || g.turn === "locked") return;

    const isPlayer = g.turn === "player";
    const t = g.tanks[isPlayer ? 0 : 1];

    const angle = ((isPlayer ? g.angle : 180 - g.angle) * Math.PI) / 180;

    g.projectile = {
      x: t.x,
      y: t.y - 10,
      vx: Math.cos(angle) * g.power,
      vy: -Math.sin(angle) * g.power,
    };

    g.lastTurn = isPlayer ? "player" : "ai";
    g.turn = "locked";
  }

  /* ========================= TURN ========================= */

  function nextTurn() {
    const e = engine();
    const g = e.state;

    if (g.winner) return;

    g.turn = g.lastTurn === "player" ? "ai" : "player";

    if (g.turn === "ai" && !e.aiLock) {
      e.aiLock = true;

      setTimeout(() => {
        aiTurn(g, fire);
        e.aiLock = false;
      }, 500);
    }
  }

  /* ========================= EXPLOSION ========================= */

  function explode(x, y) {
    const e = engine();
    const g = e.state;
    const w = WEAPONS[g.weapon];

    let hit = false;

    g.tanks.forEach((t) => {
      const d = Math.hypot(t.x - x, t.y - y);
      if (d < w.radius) hit = true;
    });

    shake(12);
    notify(hit ? "Direct Hit!" : "Impact");

    // explosion ring
    e.explosions.push({ x, y, r: 0, max: w.radius });

    // particles
    for (let i = 0; i < 40; i++) {
      e.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 40 + Math.random() * 20,
      });
    }

    // terrain
    g.terrain = g.terrain.map((h, i) => {
      const d = Math.abs(i - x);
      return d < w.radius ? h + (w.radius - d) * 0.5 : h;
    });

    // damage
    g.tanks.forEach((t) => {
      const d = Math.hypot(t.x - x, t.y - y);
      if (d < w.radius) {
        t.health -= w.damage * (1 - d / w.radius);
      }
    });

    g.projectile = null;

    if (g.tanks[0].health <= 0) g.winner = "AI";
    if (g.tanks[1].health <= 0) g.winner = "PLAYER";

    if (g.winner) {
      e.scene = SCENE.OVER;
    } else {
      nextTurn();
    }
  }

  /* ========================= UPDATE ========================= */

  function update() {
    const e = engine();
    const g = e.state;

    if (e.scene !== SCENE.PLAY) return;

    if (g.projectile) {
      const stillFlying = updateProjectile(g, explode);

      // only true MISS
      if (!stillFlying && !g.projectile) {
        notify("Missed");
        nextTurn();
      }
    }

    // particles
    e.particles.forEach((p) => {
      p.vy += 0.2;
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    });
    e.particles = e.particles.filter((p) => p.life > 0);

    // explosions
    e.explosions.forEach((ex) => (ex.r += 2));
    e.explosions = e.explosions.filter((ex) => ex.r < ex.max);
  }

  /* ========================= INPUT ========================= */

  useEffect(() => {
    const key = (e) => {
      const eng = engine();
      const g = eng.state;

      if (eng.scene === SCENE.OVER && e.key === "r") {
        eng.state = initGame();
        eng.scene = SCENE.PLAY;
        eng.wind = (Math.random() * 2 - 1) * 0.2;
        notify("New Match");
        return;
      }

      if (g.turn !== "player") return;

      if (e.key === "ArrowUp") g.angle += 2;
      if (e.key === "ArrowDown") g.angle -= 2;
      if (e.key === "ArrowRight") g.power += 0.5;
      if (e.key === "ArrowLeft") g.power -= 0.5;

      g.angle = clamp(g.angle, 0, 180);
      g.power = clamp(g.power, 2, 20);

      if (e.key === "1") {
        g.weapon = 0;
        notify("Cannon");
      }

      if (e.key === "2") {
        g.weapon = 1;
        notify("Missile");
      }

      if (e.key === " ") fire();
    };

    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  /* ========================= RENDER ========================= */

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");

    const loop = () => {
      const e = engine();
      const g = e.state;

      update();
      draw(ctx, g);

      let sx = 0,
        sy = 0;

      if (e.ui.shake > 0) {
        sx = (Math.random() - 0.5) * e.ui.shake;
        sy = (Math.random() - 0.5) * e.ui.shake;
        e.ui.shake *= 0.9;
      }

      ctx.save();
      ctx.translate(sx, sy);

      // explosions
      e.explosions.forEach((ex) => {
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, ex.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,150,0,${1 - ex.r / ex.max})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      });

      // particles
      e.particles.forEach((p) => {
        ctx.fillStyle = `rgba(255, ${150 + Math.random() * 100}, 0, ${
          p.life / 60
        })`;
        ctx.fillRect(p.x, p.y, 3, 3);
      });

      // HUD
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, WIDTH, 90);

      ctx.fillStyle = "white";
      ctx.font = "12px monospace";

      ctx.fillText(`ANGLE ${g.angle.toFixed(0)}`, 20, 20);
      ctx.fillText(`POWER ${g.power.toFixed(1)}`, 20, 40);
      ctx.fillText(`WIND ${g.wind.toFixed(2)}`, 20, 60);
      ctx.fillText(`WEAPON ${g.weapon === 0 ? "CANNON" : "MISSILE"}`, 20, 80);

      // health
      g.tanks.forEach((t, i) => {
        const x = i === 0 ? 300 : 900;

        ctx.fillStyle = "#222";
        ctx.fillRect(x - 60, 20, 120, 10);

        ctx.fillStyle = t.health > 50 ? "#2ecc71" : "#e74c3c";
        ctx.fillRect(x - 60, 20, (t.health / 100) * 120, 10);
      });

      // message
      const ui = e.ui;
      if (ui.msg && Date.now() < ui.msgUntil) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(WIDTH / 2 - 120, 120, 240, 35);

        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(ui.msg, WIDTH / 2, 143);
        ctx.textAlign = "start";
      }

      // game over
      if (e.scene === SCENE.OVER) {
        ctx.fillStyle = "rgba(0,0,0,0.9)";
        ctx.fillRect(0, 0, WIDTH, 600);

        ctx.fillStyle = "white";
        ctx.textAlign = "center";

        ctx.font = "40px Arial";
        ctx.fillText(`${g.winner} WINS`, WIDTH / 2, 260);

        ctx.font = "16px Arial";
        ctx.fillText("Press R to Restart", WIDTH / 2, 300);

        ctx.textAlign = "start";
      }

      ctx.restore();
      requestAnimationFrame(loop);
    };

    loop();
  }, []);

  return (
    <div
      style={{
        background: "radial-gradient(#111, #000)",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={600}
        style={{
          borderRadius: "16px",
          boxShadow: "0 0 80px rgba(0,0,0,0.9)",
        }}
      />
    </div>
  );
}
