export function planBallShooterLayout(
  emptyMask: boolean[][], cols: number, rows: number,
  weights: Record<number, number>, random: () => number = Math.random,
): { blocks: { col: number; row: number; length: number }[]; invalidRow: number | null } {
  const blocks: { col: number; row: number; length: number }[] = [];
  const bottom = rows - 3;
  const empty = (row: number, col: number) => emptyMask[row]?.[col] === true;
  for (let row = bottom; row >= 0; row--) {
    for (let col = 0; col < cols;) {
      if (empty(row, col)) { col++; continue; }
      let end = col;
      while (end + 1 < cols && !empty(row, end + 1)) end++;
      const canFinish = new Map<number, boolean>();
      const supported = (start: number, length: number) => row === bottom ||
        Array.from({ length }, (_, i) => start + i).some(c => !empty(row + 1, c));
      const feasible = (start: number): boolean => {
        if (start > end) return true;
        if (canFinish.has(start)) return canFinish.get(start)!;
        const result = [1, 2, 3, 4].some(length => start + length - 1 <= end &&
          supported(start, length) && feasible(start + length));
        canFinish.set(start, result);
        return result;
      };
      if (!feasible(col)) return { blocks: [], invalidRow: row };
      while (col <= end) {
        const choices = [1, 2, 3, 4].filter(length => col + length - 1 <= end &&
          supported(col, length) && feasible(col + length));
        const total = choices.reduce((sum, length) => sum + Math.max(0, weights[length] || 0), 0);
        let length = choices[0];
        if (total > 0) {
          let value = random() * total;
          for (const choice of choices) {
            value -= Math.max(0, weights[choice] || 0);
            if (value < 0) { length = choice; break; }
          }
        } else length = choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))];
        blocks.push({ col, row, length });
        col += length;
      }
    }
  }
  return { blocks, invalidRow: null };
}
