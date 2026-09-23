export type PropDirection = 'left' | 'right' | 'up' | 'down';
export type PropOrientation = 'horizontal' | 'vertical';

export interface PropGeometry {
  col: number;
  length: number;
  propDir?: PropDirection;
  propOrientation?: PropOrientation;
}
export interface PropState extends PropGeometry {
  row: number;
  concentricLayer?: number;
}

export interface ConcentricObstacleLayer {
  layerIndex: number;
  propIds: number[];
}

export interface PropDamageResult {
  triggered: boolean;
  col: number;
  row?: number;
  length: number;
  destroyed: boolean;
}

export function isValidPropLength(length: number): boolean {
  return length > 1;
}

export function getPropOccupiedColumns(prop: PropGeometry): number[] {
  if (!isValidPropLength(prop.length)) return [];

  const columns: number[] = [];
  const direction = prop.propDir || 'left';
  const firstCandyColumn = direction === 'left' ? prop.col : prop.col + 1;
  const candyCount = prop.length - 1;

  for (let offset = 0; offset < candyCount; offset++) {
    columns.push(firstCandyColumn + offset);
  }

  return columns;
}

export function getPropMachineHeadColumn(prop: PropGeometry): number {
  const direction = prop.propDir || 'left';
  return direction === 'left' ? prop.col + prop.length - 1 : prop.col;
}

export function damagePropForClearedRows(
  prop: PropState,
  clearedRows: number[],
): PropDamageResult {
  const triggered = clearedRows.some(row => Math.abs(row - prop.row) <= 1);
  if (!triggered || !isValidPropLength(prop.length)) {
    return {
      triggered: false,
      col: prop.col,
      length: prop.length,
      destroyed: !isValidPropLength(prop.length),
    };
  }

  const direction = prop.propDir || 'left';
  const col = direction === 'left' ? prop.col + 1 : prop.col;
  const shortenedLength = prop.length - 1;
  const destroyed = !isValidPropLength(shortenedLength);

  return {
    triggered: true,
    col,
    length: destroyed ? 0 : shortenedLength,
    destroyed,
  };
}

export function getPropMachineHeadCell(prop: PropState): { col: number; row: number } {
  const dir = prop.propDir || 'left';
  if (dir === 'left') {
    return { col: prop.col + prop.length - 1, row: prop.row };
  } else if (dir === 'right') {
    return { col: prop.col, row: prop.row };
  } else if (dir === 'up') {
    return { col: prop.col, row: prop.row + prop.length - 1 };
  } else {
    return { col: prop.col, row: prop.row };
  }
}

export function getPropOccupiedCells(prop: PropState, includeHead = false): { col: number; row: number }[] {
  if (!isValidPropLength(prop.length) && !includeHead) return [];
  const cells: { col: number; row: number }[] = [];
  const dir = prop.propDir || 'left';
  const isVertical = dir === 'up' || dir === 'down' || prop.propOrientation === 'vertical';

  if (!isVertical) {
    const headCol = dir === 'left' ? prop.col + prop.length - 1 : prop.col;
    for (let c = 0; c < prop.length; c++) {
      const col = prop.col + c;
      if (includeHead || col !== headCol) {
        cells.push({ col, row: prop.row });
      }
    }
  } else {
    const headRow = dir === 'up' ? prop.row + prop.length - 1 : prop.row;
    for (let r = 0; r < prop.length; r++) {
      const row = prop.row + r;
      if (includeHead || row !== headRow) {
        cells.push({ col: prop.col, row });
      }
    }
  }
  return cells;
}

export function damagePropOneUnit(prop: PropState): PropDamageResult {
  if (!isValidPropLength(prop.length)) {
    return {
      triggered: false,
      col: prop.col,
      row: prop.row,
      length: prop.length,
      destroyed: !isValidPropLength(prop.length),
    };
  }

  const dir = prop.propDir || 'left';
  let col = prop.col;
  let row = prop.row;

  if (dir === 'left') {
    col = prop.col + 1;
  } else if (dir === 'up') {
    row = prop.row + 1;
  }

  const shortenedLength = prop.length - 1;
  const destroyed = !isValidPropLength(shortenedLength);

  return {
    triggered: true,
    col,
    row,
    length: destroyed ? 0 : shortenedLength,
    destroyed,
  };
}

export interface ConcentricRingPropSpec {
  row: number;
  col: number;
  length: number;
  propDir: PropDirection;
  propOrientation: PropOrientation;
  layerIndex: number;
}

export interface ConcentricLayoutResult {
  layers: ConcentricRingPropSpec[][];
  centerBounds: {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
    width: number;
    height: number;
  };
  isValid: boolean;
  errorMessage?: string;
}

export function computeConcentricCenterBounds(rows: number, cols: number, layerCount: number) {
  const minCol = layerCount;
  const maxCol = cols - 1 - layerCount;
  const minRow = layerCount;
  const maxRow = rows - 1 - layerCount;
  const width = Math.max(0, maxCol - minCol + 1);
  const height = Math.max(0, maxRow - minRow + 1);
  return { minRow, maxRow, minCol, maxCol, width, height };
}

export function generateConcentricLayout(rows: number, cols: number, layerCount: number): ConcentricLayoutResult {
  if (layerCount < 1) {
    return {
      layers: [],
      centerBounds: computeConcentricCenterBounds(rows, cols, 0),
      isValid: false,
      errorMessage: '圈数至少为 1',
    };
  }

  const center = computeConcentricCenterBounds(rows, cols, layerCount);
  if (center.width < 2 || center.height < 2) {
    return {
      layers: [],
      centerBounds: center,
      isValid: false,
      errorMessage: `当前棋盘尺寸 (${cols}x${rows}) 容纳 ${layerCount} 圈后中央剩余空间过小 (宽${center.width}x高${center.height})，至少需要 2x2`,
    };
  }

  const layers: ConcentricRingPropSpec[][] = [];

  for (let k = 0; k < layerCount; k++) {
    const layerIndex = (layerCount - 1) - k; // 0 for innermost, layerCount - 1 for outermost

    const ring: ConcentricRingPropSpec[] = [
      // 1. Left bar: Head at TOP-LEFT (k, k), extends DOWN to (k, rows - 2 - k)
      {
        row: k,
        col: k,
        length: rows - 2 * k - 1,
        propDir: 'down',
        propOrientation: 'vertical',
        layerIndex,
      },
      // 2. Bottom bar: Head at BOTTOM-LEFT (k, rows - 1 - k), extends RIGHT to (cols - 2 - k, rows - 1 - k)
      {
        row: rows - 1 - k,
        col: k,
        length: cols - 2 * k - 1,
        propDir: 'right',
        propOrientation: 'horizontal',
        layerIndex,
      },
      // 3. Right bar: Head at BOTTOM-RIGHT (cols - 1 - k, rows - 1 - k), extends UP to (cols - 1 - k, k + 1)
      {
        row: k + 1,
        col: cols - 1 - k,
        length: rows - 2 * k - 1,
        propDir: 'up',
        propOrientation: 'vertical',
        layerIndex,
      },
      // 4. Top bar: Head at TOP-RIGHT (cols - 1 - k, k), extends LEFT to (k + 1, k)
      {
        row: k,
        col: k + 1,
        length: cols - 2 * k - 1,
        propDir: 'left',
        propOrientation: 'horizontal',
        layerIndex,
      },
    ];

    layers[layerIndex] = ring;
  }

  return {
    layers,
    centerBounds: center,
    isValid: true,
  };
}

export function createConcentricRingProps(layerIndex: number, rows: number, cols: number, totalLayers = 2): ConcentricRingPropSpec[] {
  const layout = generateConcentricLayout(rows, cols, totalLayers);
  return layout.layers[layerIndex] || [];
}

export function isCellCoveredByProps(props: PropState[], col: number, row: number): boolean {
  for (const prop of props) {
    if (!prop || prop.length <= 0) continue;
    const cells = getPropOccupiedCells(prop, true);
    for (const cell of cells) {
      if (cell.col === col && cell.row === row) return true;
    }
  }
  return false;
}

export function getOpenColumnsForRow(props: PropState[], totalCols: number, row: number): number[] {
  const openCols: number[] = [];
  for (let c = 0; c < totalCols; c++) {
    if (!isCellCoveredByProps(props, c, row)) {
      openCols.push(c);
    }
  }
  return openCols;
}

