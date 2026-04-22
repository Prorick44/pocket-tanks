import { generateTerrain } from "./terrain";
import { WIDTH } from "./constants";

export function initGame() {
  return {
    turn: "player",
    tanks: [
      { x: 150, y: 0, health: 100 },
      { x: 850, y: 0, health: 100 },
    ],
    terrain: generateTerrain(WIDTH),
    projectile: null,
    particles: [],
    trail: [],
    angle: 45,
    power: 12,
    weapon: 0,
    wind: Math.random() * 0.2 - 0.1,
    winner: null,
  };
}
