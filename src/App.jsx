import React, { useRef, useEffect } from "react";
import { WIDTH, WEAPONS } from "./game/constants";
import { initGame } from "./game/initGame";
import { aiTurn } from "./game/ai";
import { updateProjectile } from "./game/physics";
import { draw } from "./game/renderer";

/* =========================
   🧠 GAME ENGINE CORE
========================= */

const SCENE = {
  MENU: "menu",
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
      msg: "",
      msgUntil: 0,
      shake: 0,
    },
  });

  const engine = () => engineRef.current;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* =========================
     📢 EVENT SYSTEM
  ========================= */

  function notify(text, time = 1200) {
    engine().ui.msg = text;
    engine().ui.msgUntil = Date.now() + time;
  }

  function shake(val = 8) {
    engine().ui.shake = val;
  }

  /* =========================
     🚀 FIRE SYSTEM
  ========================= */

  function fire() {
    const e = engine();
    const g = e.state;

    if (g.projectile || g.winner) return;

    const t = g.tanks[g.turn === "player" ? 0 : 1];

    const angle =
      ((g.turn === "player" ? g.angle : 180 - g.angle) * Math.PI) / 180;

    g.projectile = {
      x: t.x,
      y: t.y - 10,
      vx: Math.cos(angle) * g.power,
      vy: -Math.sin(angle) * g.power,
    };

    g.trail = [];
  }

  /* =========================
     💥 IMPACT SYSTEM
  ========================= */

  function explode(x, y) {
    const e = engine();
    const g = e.state;
    const w = WEAPONS[g.weapon];

    shake(10);
    notify("Impact!", 900);

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

    // win
    if (g.tanks[0].health <= 0) g.winner = "AI";
    if (g.tanks[1].health <= 0) g.winner = "PLAYER";

    // turn system (SAFE)
    if (!g.winner) {
      g.turn = g.turn === "player" ? "ai" : "player";

      if (g.turn === "ai" && !e.aiLock) {
        e.aiLock = true;

        setTimeout(() => {
          aiTurn(g, fire);
          e.aiLock = false;
        }, 500);
      }
    } else {
      e.scene = SCENE.OVER;
    }
  }

  /* =========================
     🔁 FIXED UPDATE LOOP
  ========================= */

  function update() {
    const e = engine();
    const g = e.state;

    if (e.scene !== SCENE.PLAY) return;

    if (g.projectile) {
      updateProjectile(g, explode);
    }
  }

  /* =========================
     🎮 INPUT SYSTEM
  ========================= */

  useEffect(() => {
    const key = (e) => {
      const eng = engine();
      const g = eng.state;

      if (eng.scene === SCENE.OVER && e.key === "r") {
        eng.state = initGame();
        eng.wind = (Math.random() * 2 - 1) * 0.2;
        eng.scene = SCENE.PLAY;
        notify("New Match Started");
        return;
      }

      if (g.turn !== "player" || g.projectile) return;

      if (e.key === "ArrowUp") g.angle += 2;
      if (e.key === "ArrowDown") g.angle -= 2;
      if (e.key === "ArrowRight") g.power += 0.5;
      if (e.key === "ArrowLeft") g.power -= 0.5;

      g.angle = clamp(g.angle, 0, 180);
      g.power = clamp(g.power, 2, 20);

      if (e.key === "1") {
        g.weapon = 0;
        notify("Cannon Selected");
      }

      if (e.key === "2") {
        g.weapon = 1;
        notify("Missile Selected");
      }

      if (e.key === " ") fire();
    };

    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  /* =========================
     🎨 RENDER ENGINE
  ========================= */

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");

    const loop = () => {
      const e = engine();
      const g = e.state;

      update();
      draw(ctx, g);

      /* CAMERA SHAKE */
      let sx = 0,
        sy = 0;

      if (e.ui.shake > 0) {
        sx = (Math.random() - 0.5) * e.ui.shake;
        sy = (Math.random() - 0.5) * e.ui.shake;
        e.ui.shake *= 0.9;
      }

      ctx.save();
      ctx.translate(sx, sy);

      /* HUD */
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, WIDTH, 110);

      ctx.fillStyle = "white";
      ctx.font = "13px monospace";

      ctx.fillText(`ANGLE ${g.angle.toFixed(0)}°`, 20, 25);
      ctx.fillText(`POWER ${g.power.toFixed(1)}`, 20, 45);
      ctx.fillText(`WIND ${g.wind.toFixed(2)}`, 20, 65);
      ctx.fillText(`WEAPON ${g.weapon === 0 ? "CANNON" : "MISSILE"}`, 20, 85);

      /* HEALTH */
      g.tanks.forEach((t, i) => {
        const x = i === 0 ? 320 : 880;

        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fillRect(x - 60, 20, 120, 10);

        ctx.fillStyle = t.health > 50 ? "#2ecc71" : "#e74c3c";
        ctx.fillRect(x - 60, 20, (t.health / 100) * 120, 10);
      });

      /* TRAJECTORY */
      if (!g.projectile && g.turn === "player") {
        const t = g.tanks[0];

        let a = (g.angle * Math.PI) / 180;
        let x = t.x;
        let y = t.y - 10;
        let vx = Math.cos(a) * g.power;
        let vy = -Math.sin(a) * g.power;

        ctx.fillStyle = "rgba(255,255,0,0.8)";

        for (let i = 0; i < 30; i++) {
          vx += g.wind;
          vy += 0.2;

          x += vx;
          y += vy;

          ctx.fillRect(x, y, 2, 2);
        }
      }

      /* MESSAGE */
      const ui = e.ui;

      if (ui.msg && Date.now() < ui.msgUntil) {
        const p = 1 - (ui.msgUntil - Date.now()) / 1200;

        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(WIDTH / 2 - 160, 130, 320, 40);

        ctx.fillStyle = `rgba(255,255,255,${1 - p})`;
        ctx.textAlign = "center";
        ctx.font = "14px Arial";
        ctx.fillText(ui.msg, WIDTH / 2, 155);
        ctx.textAlign = "start";
      }

      /* GAME OVER */
      if (e.scene === SCENE.OVER) {
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(0, 0, WIDTH, 600);

        ctx.fillStyle = "white";
        ctx.font = "42px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${g.winner} WINS`, WIDTH / 2, 260);

        ctx.font = "18px Arial";
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
          boxShadow: "0 0 80px rgba(0,0,0,0.95)",
        }}
      />
    </div>
  );
}
