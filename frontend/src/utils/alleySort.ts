import type { AlleyView } from '../backend';

/**
 * Natural sort comparator for strings containing numbers.
 * Handles cases like "Aleja 2" < "Aleja 10" correctly.
 */
function naturalCompare(a: string, b: string): number {
  const ax: Array<string | number> = [];
  const bx: Array<string | number> = [];

  a.replace(/(\d+)|(\D+)/g, (_, num, str) => {
    ax.push(num ? parseInt(num, 10) : str.toLowerCase());
    return '';
  });
  b.replace(/(\d+)|(\D+)/g, (_, num, str) => {
    bx.push(num ? parseInt(num, 10) : str.toLowerCase());
    return '';
  });

  for (let i = 0; i < Math.max(ax.length, bx.length); i++) {
    if (ax[i] === undefined) return -1;
    if (bx[i] === undefined) return 1;
    if (ax[i] < bx[i]) return -1;
    if (ax[i] > bx[i]) return 1;
  }
  return 0;
}

/**
 * Sorts an array of AlleyView objects in a stable, predictable order.
 * Uses natural sort so numeric alley names sort correctly (e.g. "2" before "10").
 * Returns a new sorted array without mutating the original.
 */
export function sortAlleys<T extends { name: string }>(alleys: T[]): T[] {
  return [...alleys].sort((a, b) => naturalCompare(a.name, b.name));
}
