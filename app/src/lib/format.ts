import { colors } from './theme';
import type { TournamentStatus } from './types';

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "1 match" / "0 matches" / "2 players" */
export function pluralize(count: number, word: string): string {
  if (count === 1) return `${count} ${word}`;
  if (/(ch|sh|x|s)$/i.test(word)) return `${count} ${word}es`;
  return `${count} ${word}s`;
}

export function statusMeta(status: TournamentStatus) {
  if (status === 'ACTIVE') {
    return { label: 'Live', color: colors.accent, background: colors.accentSoft };
  }
  return { label: 'Finished', color: colors.textDim, background: 'rgba(167,180,200,0.12)' };
}

export function resultColor(result: 'W' | 'D' | 'L') {
  if (result === 'W') return colors.accent;
  if (result === 'D') return colors.warning;
  return colors.danger;
}

export function ordinal(position: number): string {
  const mod10 = position % 10;
  const mod100 = position % 100;
  if (mod10 === 1 && mod100 !== 11) return `${position}st`;
  if (mod10 === 2 && mod100 !== 12) return `${position}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${position}rd`;
  return `${position}th`;
}
