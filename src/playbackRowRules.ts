export function getTriggeredVisibleFullRows(
  visibleFullRows: number[],
  pendingRows: number[],
  triggerCandidateRows: number[] = visibleFullRows
): number[] {
  const pendingSet = new Set(pendingRows);
  const triggerCandidateSet = new Set(triggerCandidateRows);
  const triggerRows = visibleFullRows.filter(
    row => triggerCandidateSet.has(row) && !pendingSet.has(row)
  );

  if (triggerRows.length === 0) return [];

  const triggerSet = new Set(triggerRows);
  return Array.from(new Set(
    visibleFullRows.filter(row => triggerSet.has(row) || pendingSet.has(row))
  )).sort((a, b) => a - b);
}
