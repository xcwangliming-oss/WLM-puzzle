/** Keep square cells and the entire launcher visible in preview and recording. */
export function fitCompleteBoard(
  target: { x: number; y: number; w: number; h: number },
  contentWidth: number,
  contentHeight: number,
) {
  if (contentWidth <= 0 || contentHeight <= 0 || target.w <= 0 || target.h <= 0) return target;
  const scale = Math.min(target.w / contentWidth, target.h / contentHeight);
  const w = contentWidth * scale;
  const h = contentHeight * scale;
  return { x: target.x + (target.w - w) / 2, y: target.y + target.h - h, w, h };
}
