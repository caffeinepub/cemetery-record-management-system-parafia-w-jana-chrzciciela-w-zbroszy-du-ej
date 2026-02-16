import { GraveStatus } from '../backend';

/**
 * Shared utility for consistent grave status styling across tile maps and search results.
 * Provides status-based colors for backgrounds, hover effects, badges, and text with proper contrast.
 */

interface StatusStyle {
  background: string;
  hoverRing: string;
  text: string;
}

export function getGraveStatusStyles(status: GraveStatus): StatusStyle {
  const styles: Record<GraveStatus, StatusStyle> = {
    [GraveStatus.paid]: {
      background: 'bg-green-600 dark:bg-green-600',
      hoverRing: 'hover:ring-4 hover:ring-green-400/70 dark:hover:ring-green-500/70 focus-visible:ring-4 focus-visible:ring-green-400/70 dark:focus-visible:ring-green-500/70',
      text: 'text-white',
    },
    [GraveStatus.unpaid]: {
      background: 'bg-red-600 dark:bg-red-600',
      hoverRing: 'hover:ring-4 hover:ring-red-400/70 dark:hover:ring-red-500/70 focus-visible:ring-4 focus-visible:ring-red-400/70 dark:focus-visible:ring-red-500/70',
      text: 'text-white',
    },
    [GraveStatus.reserved]: {
      background: 'bg-orange-600 dark:bg-orange-600',
      hoverRing: 'hover:ring-4 hover:ring-orange-400/70 dark:hover:ring-orange-500/70 focus-visible:ring-4 focus-visible:ring-orange-400/70 dark:focus-visible:ring-orange-500/70',
      text: 'text-white',
    },
    [GraveStatus.free]: {
      background: 'bg-gray-300 dark:bg-gray-600',
      hoverRing: 'hover:ring-4 hover:ring-gray-400/70 dark:hover:ring-gray-500/70 focus-visible:ring-4 focus-visible:ring-gray-400/70 dark:focus-visible:ring-gray-500/70',
      text: 'text-gray-900 dark:text-gray-100',
    },
  };

  return styles[status];
}

export function getStatusLabel(status: GraveStatus): string {
  const labels: Record<GraveStatus, string> = {
    [GraveStatus.paid]: 'Opłacone',
    [GraveStatus.unpaid]: 'Nieopłacone',
    [GraveStatus.free]: 'Wolne',
    [GraveStatus.reserved]: 'Zarezerwowane',
  };
  return labels[status];
}

export function getStatusLegendColor(status: GraveStatus): string {
  const colors: Record<GraveStatus, string> = {
    [GraveStatus.paid]: 'bg-green-600',
    [GraveStatus.unpaid]: 'bg-red-600',
    [GraveStatus.free]: 'bg-gray-300 dark:bg-gray-600',
    [GraveStatus.reserved]: 'bg-orange-600',
  };
  return colors[status];
}

export function getStatusBadgeVariant(status: GraveStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<GraveStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    [GraveStatus.paid]: 'default',
    [GraveStatus.unpaid]: 'destructive',
    [GraveStatus.free]: 'secondary',
    [GraveStatus.reserved]: 'outline',
  };
  return variants[status];
}
