export interface NoGravityBlockLike {
  row: number;
  noGravity?: boolean;
}

export function getNoGravityPlaybackMaxRow(
  advanceMode: 'fixed' | 'rising' | 'scroll' | null,
  recordedMaxRow: number,
  runtimeMaxRow: number
): number {
  return advanceMode === 'scroll' ? runtimeMaxRow : recordedMaxRow;
}

export function releaseNoGravityBlocksInRange<T extends NoGravityBlockLike>(
  blocks: T[],
  minRow: number,
  maxRow: number
): void {
  blocks.forEach(block => {
    if (block.row >= minRow && block.row <= maxRow) {
      block.noGravity = false;
    }
  });
}
