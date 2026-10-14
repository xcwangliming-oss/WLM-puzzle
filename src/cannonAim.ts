/** The same muzzle position is used for the guide and every launched ball. */
export function getCannonMuzzle(x: number, y: number, angle: number, length: number) {
  return { x: x + Math.cos(angle) * length, y: y + Math.sin(angle) * length };
}
