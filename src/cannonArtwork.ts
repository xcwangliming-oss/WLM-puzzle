// Registered coordinates of the reference-style PNG layers. The foreground
// gold ring is the hinge; projectiles originate at the silver muzzle opening.
export const REFERENCE_CANNON_ART = {
  width: 1254,
  height: 1254,
  axisX: 627,
  pivotY: 672,
  muzzleY: 180,
  bottomY: 1125,
  visibleWidth: 1068,
  visibleHeight: 1019,
  barrelFrameBottom: 782,
};

export function getReferenceCannonFit(cellSize: number) {
  const art = REFERENCE_CANNON_ART;
  const scale = Math.min(cellSize * 1.6 / art.visibleWidth, cellSize * 1.55 / art.visibleHeight);
  return {
    scale,
    pivotOffsetY: 26 - (art.bottomY - art.pivotY) * scale,
    muzzleLength: (art.pivotY - art.muzzleY) * scale,
    countX: art.visibleWidth * scale / 2 + 6,
    countY: 26 - (art.bottomY - art.muzzleY) * scale + cellSize * 0.2,
  };
}
