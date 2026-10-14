export interface BallShooterCollisionRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface BallShooterSweepHit {
  time: number;
  normalX: number;
  normalY: number;
  hitX: number;
  hitY: number;
}

/** Sweep against a full grid rectangle, not the gem's bevel or bitmap inset.
 * Adjacent expanded rectangles form one solid wall: the earliest entry face
 * determines the bounce, never the nearest edge AFTER entering a row seam.
 * Axis-aligned corners intentionally keep the same flat-wall response.
 */
export function sweepBallAgainstBlock(
  x: number, y: number, dx: number, dy: number, radius: number,
  rect: BallShooterCollisionRect,
): BallShooterSweepHit | null {
  const left = rect.left - radius;
  const right = rect.right + radius;
  const top = rect.top - radius;
  const bottom = rect.bottom + radius;
  const epsilon = 1e-9;
  let enterX = -Infinity;
  let exitX = Infinity;
  let enterY = -Infinity;
  let exitY = Infinity;

  if (Math.abs(dx) < epsilon) {
    if (x < left || x > right) return null;
  } else {
    enterX = ((dx > 0 ? left : right) - x) / dx;
    exitX = ((dx > 0 ? right : left) - x) / dx;
  }
  if (Math.abs(dy) < epsilon) {
    if (y < top || y > bottom) return null;
  } else {
    enterY = ((dy > 0 ? top : bottom) - y) / dy;
    exitY = ((dy > 0 ? bottom : top) - y) / dy;
  }

  const enter = Math.max(enterX, enterY);
  const exit = Math.min(exitX, exitY);
  // A ball already inside after a brick is dragged must be allowed to leave,
  // not repeatedly damaged/reflected off an internal edge of the solid wall.
  if (!Number.isFinite(enter) || enter < -epsilon || enter > 1 + epsilon || exit < Math.max(0, enter)) return null;
  const time = Math.max(0, Math.min(1, enter));
  const normalX = enterX >= enterY - epsilon && Math.abs(dx) >= epsilon ? (dx > 0 ? -1 : 1) : 0;
  const normalY = enterY >= enterX - epsilon && Math.abs(dy) >= epsilon ? (dy > 0 ? -1 : 1) : 0;
  return {
    time, normalX, normalY,
    hitX: Math.max(rect.left, Math.min(rect.right, x + dx * time)),
    hitY: Math.max(rect.top, Math.min(rect.bottom, y + dy * time)),
  };
}
