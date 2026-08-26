export interface TntRuleBlock {
  id: number;
  row: number;
  col: number;
  length: number;
  propType?: string;
}

export interface TntBlastResult {
  tntIds: number[];
  removedIds: number[];
}

export type TntBlastMode = 'area-3x3' | 'three-rows';

export function isTntBlock(block: { propType?: string; length?: number }): boolean {
  return block.propType === 'tnt' && block.length === 1;
}

export function getTntBlastCellKeys(row: number, col: number, totalRows: number, gridCols: number): Set<string> {
  const cells = new Set<string>();
  for (let r = row - 1; r <= row + 1; r++) {
    if (r < 0 || r >= totalRows) continue;
    for (let c = col - 1; c <= col + 1; c++) {
      if (c < 0 || c >= gridCols) continue;
      cells.add(`${r}:${c}`);
    }
  }
  return cells;
}

export function getTntThreeRowBlastCellKeys(row: number, totalRows: number, gridCols: number): Set<string> {
  const cells = new Set<string>();
  for (let r = row - 1; r <= row + 1; r++) {
    if (r < 0 || r >= totalRows) continue;
    for (let c = 0; c < gridCols; c++) {
      cells.add(`${r}:${c}`);
    }
  }
  return cells;
}

export function getTntBlastCells(row: number, col: number, totalRows: number, gridCols: number, mode: TntBlastMode = 'area-3x3'): Set<string> {
  return mode === 'three-rows'
    ? getTntThreeRowBlastCellKeys(row, totalRows, gridCols)
    : getTntBlastCellKeys(row, col, totalRows, gridCols);
}

export function resolveTntBlast(
  blocks: TntRuleBlock[],
  initialRemovedIds: Iterable<number>,
  totalRows: number,
  gridCols: number,
  mode: TntBlastMode = 'area-3x3',
): TntBlastResult {
  const byId = new Map(blocks.map(block => [block.id, block]));
  const removedIds = new Set(initialRemovedIds);
  const tntIds = new Set<number>();
  const queue = [...removedIds]
    .map(id => byId.get(id))
    .filter((block): block is TntRuleBlock => Boolean(block && isTntBlock(block)));

  while (queue.length > 0) {
    const tnt = queue.shift()!;
    if (tntIds.has(tnt.id)) continue;
    tntIds.add(tnt.id);

    const blastCells = getTntBlastCells(tnt.row, tnt.col, totalRows, gridCols, mode);
    blocks.forEach(block => {
      for (let offset = 0; offset < Math.max(1, block.length); offset++) {
        if (!blastCells.has(`${block.row}:${block.col + offset}`)) continue;
        if (!removedIds.has(block.id)) {
          removedIds.add(block.id);
          if (isTntBlock(block)) queue.push(block);
        }
        break;
      }
    });
  }

  return {
    tntIds: [...tntIds],
    removedIds: [...removedIds],
  };
}
