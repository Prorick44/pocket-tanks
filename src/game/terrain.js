export function generateTerrain() {
  return Array.from(
    { length: 1000 },
    (_, i) => 420 + Math.sin(i * 0.012) * 60 + Math.sin(i * 0.03) * 25,
  );
}
