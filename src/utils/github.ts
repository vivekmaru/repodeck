import { ActivityLevel, AuditPresetId, AuditThresholdsConfig } from '../types';

export const AUDIT_PRESETS: Record<AuditPresetId, {
  name: string;
  badge: string;
  description: string;
  config: Omit<AuditThresholdsConfig, 'presetId'>;
}> = {
  standard: {
    name: 'Standard (1y / 2y)',
    badge: '1y / 2y',
    description: 'Stale after 1 year, dormant after 2 years. Best for general development.',
    config: {
      activeDays: 30,
      warmMonths: 4,
      staleMonths: 12,
      dormantMonths: 24,
      dateField: 'pushed_at',
    },
  },
  aggressive: {
    name: 'Aggressive (3m / 6m)',
    badge: '3m / 6m',
    description: 'Stale after 3 months, dormant after 6 months. High hygiene for active repos.',
    config: {
      activeDays: 14,
      warmMonths: 2,
      staleMonths: 3,
      dormantMonths: 6,
      dateField: 'pushed_at',
    },
  },
  moderate: {
    name: 'Moderate (6m / 1y)',
    badge: '6m / 1y',
    description: 'Stale after 6 months, dormant after 1 year. Balanced periodic cleanup.',
    config: {
      activeDays: 30,
      warmMonths: 3,
      staleMonths: 6,
      dormantMonths: 12,
      dateField: 'pushed_at',
    },
  },
  relaxed: {
    name: 'Relaxed (2y / 3y)',
    badge: '2y / 3y',
    description: 'Stale after 2 years, dormant after 3 years. For legacy & archival portfolios.',
    config: {
      activeDays: 60,
      warmMonths: 6,
      staleMonths: 24,
      dormantMonths: 36,
      dateField: 'pushed_at',
    },
  },
  custom: {
    name: 'Custom Period',
    badge: 'Custom',
    description: 'Customized stale and dormant inactivity cutoffs.',
    config: {
      activeDays: 30,
      warmMonths: 4,
      staleMonths: 12,
      dormantMonths: 24,
      dateField: 'pushed_at',
    },
  },
};

export const DEFAULT_AUDIT_CONFIG: AuditThresholdsConfig = {
  presetId: 'standard',
  activeDays: 30,
  warmMonths: 4,
  staleMonths: 12,
  dormantMonths: 24,
  dateField: 'pushed_at',
};

export function formatThresholdLabel(months: number): string {
  if (months < 1) {
    const days = Math.round(months * 30.4);
    return `${days}d`;
  }
  if (months < 12) {
    return `${months}m`;
  }
  const years = months / 12;
  return years % 1 === 0 ? `${years}y` : `${years.toFixed(1)}y`;
}

export function formatRelativeTime(dateString: string): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} mo${months > 1 ? 's' : ''} ago`;
  }
  const years = (diffInSeconds / 31536000).toFixed(1);
  return `${years.replace('.0', '')} yr${parseFloat(years) > 1 ? 's' : ''} ago`;
}

export function formatAge(createdAt: string): { label: string; days: number; years: number } {
  if (!createdAt) return { label: 'Unknown', days: 0, years: 0 };
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - created.getTime());
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const years = parseFloat((days / 365.25).toFixed(1));

  if (days < 30) {
    return { label: `${days} day${days === 1 ? '' : 's'} old`, days, years };
  }
  if (days < 365) {
    const months = Math.floor(days / 30.4);
    return { label: `${months} month${months === 1 ? '' : 's'} old`, days, years };
  }
  return { label: `${years} yr${years === 1 ? '' : 's'} old`, days, years };
}

export function getActivityLevel(
  pushedAt: string | null,
  createdAt: string,
  config: AuditThresholdsConfig = DEFAULT_AUDIT_CONFIG,
  updatedAt?: string | null
): {
  level: ActivityLevel;
  label: string;
  badgeClass: string;
  dotClass: string;
  description: string;
} {
  const chosenDateStr = (config.dateField === 'updated_at' && updatedAt) ? updatedAt : pushedAt;
  const targetDate = chosenDateStr ? new Date(chosenDateStr) : new Date(createdAt);
  const now = new Date();
  const diffDays = Math.max(0, Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)));

  const activeDaysCutoff = config.activeDays || 30;
  const warmDaysCutoff = (config.warmMonths || 4) * 30.4;
  const staleDaysCutoff = (config.staleMonths || 12) * 30.4;
  const dormantDaysCutoff = (config.dormantMonths || 24) * 30.4;

  const staleLabel = formatThresholdLabel(config.staleMonths || 12);
  const dormantLabel = formatThresholdLabel(config.dormantMonths || 24);

  if (diffDays <= activeDaysCutoff) {
    return {
      level: 'active',
      label: 'Active',
      badgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80',
      dotClass: 'bg-emerald-400',
      description: `Active within the last ${activeDaysCutoff} days`,
    };
  }
  if (diffDays <= warmDaysCutoff) {
    return {
      level: 'warm',
      label: 'Recent',
      badgeClass: 'bg-sky-950/60 text-sky-300 border-sky-800/80',
      dotClass: 'bg-sky-400',
      description: `Active within the last ${formatThresholdLabel(config.warmMonths || 4)}`,
    };
  }
  if (diffDays <= staleDaysCutoff) {
    return {
      level: 'cool',
      label: 'Quiet',
      badgeClass: 'bg-amber-950/60 text-amber-300 border-amber-800/80',
      dotClass: 'bg-amber-400',
      description: `Activity within the last ${staleLabel}`,
    };
  }
  if (diffDays <= dormantDaysCutoff) {
    return {
      level: 'stale',
      label: `Stale (>${staleLabel})`,
      badgeClass: 'bg-orange-950/60 text-orange-300 border-orange-800/80',
      dotClass: 'bg-orange-400',
      description: `No activity in over ${staleLabel} (Cleanup candidate)`,
    };
  }
  return {
    level: 'dormant',
    label: `Dormant (>${dormantLabel})`,
    badgeClass: 'bg-rose-950/60 text-rose-300 border-rose-800/80',
    dotClass: 'bg-rose-400',
    description: `No activity in over ${dormantLabel} (Prime delete candidate)`,
  };
}

export function formatRepoSize(sizeInKB: number): string {
  if (!sizeInKB || sizeInKB === 0) return '0 KB';
  if (sizeInKB < 1024) return `${sizeInKB.toLocaleString()} KB`;
  const mb = sizeInKB / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export function getLanguageColor(language: string | null): string {
  if (!language) return '#64748b'; // slate-500
  const colors: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f1e05a',
    Python: '#3572A5',
    Go: '#00ADD8',
    Rust: '#dea584',
    Java: '#b07219',
    'C++': '#f34b7d',
    C: '#555555',
    'C#': '#178600',
    Ruby: '#701516',
    PHP: '#4F5D95',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Shell: '#89e051',
    Vue: '#41b883',
    Swift: '#F05138',
    Kotlin: '#A97BFF',
    Dart: '#00B4AB',
    Dockerfile: '#384d54',
  };
  return colors[language] || '#38bdf8';
}
