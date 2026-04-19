/**
 * Relative time formatter (French locale).
 * Returns strings like "il y a 2s", "il y a 5min", "il y a 2h", "hier", "il y a 3j".
 */
export function timeAgo(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  const diffMs = Date.now() - d.getTime();

  if (diffMs < 0) return 'à l\'instant';

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return diffSec <= 1 ? 'à l\'instant' : `il y a ${diffSec}s`;

  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `il y a ${diffMin}min`;

  const diffH = Math.floor(diffMs / 3_600_000);
  if (diffH < 24) return `il y a ${diffH}h`;

  const diffD = Math.floor(diffMs / 86_400_000);
  if (diffD === 1) return 'hier';

  return `il y a ${diffD}j`;
}
