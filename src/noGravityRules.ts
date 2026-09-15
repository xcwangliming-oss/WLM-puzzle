export interface NoGravityBlockLike {
  row: number;
  noGravity?: boolean;
}

export interface NoGravitySupportBlockLike extends NoGravityBlockLike {
  id: number;
  col: number;
  length: number;
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

function getUnlockedGravityRows<T extends NoGravitySupportBlockLike>(
  blocks: T[],
  maxRow: number,
  removedIds: Set<number>
): Map<number, number> {
  const activeBlocks = blocks
    .filter(block => !removedIds.has(block.id))
    .sort((a, b) => b.row - a.row);
  const simulatedRows = new Map<number, number>();

  activeBlocks.forEach(block => {
    let targetRow = block.row;
    while (targetRow < maxRow) {
      const isBlocked = activeBlocks.some(other => {
        if (other.id === block.id) return false;
        const otherRow = simulatedRows.get(other.id) ?? other.row;
        return otherRow === targetRow + 1
          && block.col < other.col + other.length
          && block.col + block.length > other.col;
      });
      if (isBlocked) break;
      targetRow++;
    }
    simulatedRows.set(block.id, targetRow);
  });

  return simulatedRows;
}

export function releaseNewlyUnsupportedNoGravityBlocks<T extends NoGravitySupportBlockLike>(
  blocks: T[],
  removedIds: Set<number>,
  maxRow: number
): number[] {
  if (removedIds.size === 0) return [];

  const restsOn = (top: NoGravitySupportBlockLike, bottom: NoGravitySupportBlockLike) => {
    return bottom.row === top.row + 1
      && top.col < bottom.col + bottom.length
      && top.col + top.length > bottom.col;
  };

  const dependentIds = new Set<number>();
  const activeBlocks = blocks.filter(b => !removedIds.has(b.id));
  const removedBlocks = blocks.filter(b => removedIds.has(b.id));

  activeBlocks.forEach(block => {
    if (removedBlocks.some(r => restsOn(block, r))) {
      dependentIds.add(block.id);
    }
  });

  let expanded = true;
  while (expanded) {
    expanded = false;
    activeBlocks.forEach(block => {
      if (!dependentIds.has(block.id)) {
        const supportedByDependent = activeBlocks.some(other => dependentIds.has(other.id) && restsOn(block, other));
        if (supportedByDependent) {
          dependentIds.add(block.id);
          expanded = true;
        }
      }
    });
  }

  const rowsBeforeRemoval = getUnlockedGravityRows(blocks, maxRow, new Set());
  const rowsAfterRemoval = getUnlockedGravityRows(blocks, maxRow, removedIds);
  const releasedIds: number[] = [];

  const sortedBlocks = [...blocks].sort((a, b) => b.row - a.row);

  sortedBlocks.forEach(block => {
    if (removedIds.has(block.id) || !block.noGravity) return;
    const wasSupported = rowsBeforeRemoval.get(block.id) === block.row;
    const losesSupport = (rowsAfterRemoval.get(block.id) ?? block.row) > block.row;
    const isDependentOnRemoved = dependentIds.has(block.id);

    if ((wasSupported && losesSupport) || isDependentOnRemoved) {
      block.noGravity = false;
      releasedIds.push(block.id);
    }
  });

  return releasedIds;
}
