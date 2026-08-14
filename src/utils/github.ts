import { ActivityLevel } from '../types';

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

export function getActivityLevel(pushedAt: string | null, createdAt: string): {
  level: ActivityLevel;
  label: string;
  badgeClass: string;
  dotClass: string;
  description: string;
} {
  const targetDate = pushedAt ? new Date(pushedAt) : new Date(createdAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 30) {
    return {
      level: 'active',
      label: 'Active',
      badgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80',
      dotClass: 'bg-emerald-400',
      description: 'Pushed within the last 30 days',
    };
  }
  if (diffDays <= 120) {
    return {
      level: 'warm',
      label: 'Recent',
      badgeClass: 'bg-sky-950/60 text-sky-300 border-sky-800/80',
      dotClass: 'bg-sky-400',
      description: 'Pushed within the last 4 months',
    };
  }
  if (diffDays <= 365) {
    return {
      level: 'cool',
      label: 'Quiet',
      badgeClass: 'bg-amber-950/60 text-amber-300 border-amber-800/80',
      dotClass: 'bg-amber-400',
      description: 'Pushed within the last year',
    };
  }
  if (diffDays <= 730) {
    return {
      level: 'stale',
      label: 'Stale (>1y)',
      badgeClass: 'bg-orange-950/60 text-orange-300 border-orange-800/80',
      dotClass: 'bg-orange-400',
      description: 'No commits in over 1 year (Cleanup candidate)',
    };
  }
  return {
    level: 'dormant',
    label: 'Dormant (>2y)',
    badgeClass: 'bg-rose-950/60 text-rose-300 border-rose-800/80',
    dotClass: 'bg-rose-400',
    description: 'No commits in over 2 years (Prime delete candidate)',
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
