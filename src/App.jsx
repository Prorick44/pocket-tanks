import React, { useRef, useEffect } from "react";

import { WIDTH, WEAPONS } from "./game/constants";
import { initGame } from "./game/initGame";
import { aiTurn } from "./game/ai";
import { updateProjectile } from "./game/physics";
import { draw } from "./game/renderer";

export default function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);

  if (!gameRef.current) gameRef.current = initGame();
  const g = () => gameRef.current;

  // 🚀 FIRE
  function fire() {
    const game = g();
    if (game.projectile || game.winner) return;

    const t = game.turn === "player" ? game.tanks[0] : game.tanks[1];

    const angle =
      ((game.turn === "player" ? game.angle : 180 - game.angle) * Math.PI) /
      180;

    game.projectile = {
      x: t.x,
      y: t.y - 10,
      vx: Math.cos(angle) * game.power,
      vy: -Math.sin(angle) * game.power,
    };
  }

  // 💥 EXPLOSION (SAFE + NO FREEZE)
  function explode(x, y) {
    const game = g();
    const w = WEAPONS[game.weapon];

    game.terrain = game.terrain.map((h, i) => {
      const d = Math.abs(i - x);
      if (d < w.radius) {
        return h + (w.radius - d) * 0.5;
      }
      return h;
    });

    game.tanks = game.tanks.map((t) => {
      const d = Math.hypot(t.x - x, t.y - y);
      if (d < w.radius) {
        const dmg = w.damage * (1 - d / w.radius);
        t.health = Math.max(0, t.health - dmg);
      }
      return t;
    });

    game.projectile = null;
    game.trail = [];

    if (game.tanks[0].health <= 0) game.winner = "AI";
    if (game.tanks[1].health <= 0) game.winner = "PLAYER";

    game.turn = game.turn === "player" ? "ai" : "player";

    if (game.turn === "ai" && !game.winner) {
      setTimeout(() => aiTurn(game, fire), 700);
    }
  }

  // 🔁 UPDATE LOOP (SAFE BOUNDARY FIX INSIDE physics)
  function update() {
    const game = g();
    if (!game || game.winner) return;

    if (game.projectile) {
      updateProjectile(game, explode);
    }
  }

  // 🎮 INPUT
  useEffect(() => {
    const key = (e) => {
      const game = g();

      if (game.winner && e.key === "r") {
        gameRef.current = initGame();
        return;
      }

      if (game.turn !== "player" || game.projectile) return;

      if (e.key === "ArrowUp") game.angle += 2;
      if (e.key === "ArrowDown") game.angle -= 2;
      if (e.key === "ArrowRight") game.power += 0.5;
      if (e.key === "ArrowLeft") game.power -= 0.5;

      // 🔫 WEAPON SWITCH
      if (e.key === "1") game.weapon = 0;
      if (e.key === "2") game.weapon = 1;

      if (e.key === " ") fire();
    };

    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  // LOOP
  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");

    const loop = () => {
      update();
      draw(ctx, g());
      requestAnimationFrame(loop);
    };

    loop();
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const game = g();

      if (!game.winner) return;

      // Play Again button area
      if (x >= 420 && x <= 580 && y >= 340 && y <= 390) {
        gameRef.current = initGame();
      }
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <div style={{ background: "black", height: "100vh" }}>
      <canvas ref={canvasRef} width={WIDTH} height={600} />
    </div>
  );
}
