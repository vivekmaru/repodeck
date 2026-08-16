import { useState, useEffect, useRef, Fragment } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  GitFork, 
  Lock, 
  Globe, 
  ExternalLink, 
  Trash2, 
  Archive, 
  ArchiveRestore, 
  Star, 
  ChevronDown, 
  Code2, 
  Users, 
  Terminal, 
  Copy, 
  Check, 
  RefreshCw, 
  SlidersHorizontal,
  Sparkles,
  Zap,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';
import { GitHubRepo, RepoDetailsData, ForkSyncStatus, FilterOptions, AuditThresholdsConfig } from '../types';
import { formatAge, formatRelativeTime, getActivityLevel, formatRepoSize, getLanguageColor } from '../utils/github';
import { api } from '../services/api';

interface RepoTableViewProps {
  repos: GitHubRepo[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onSelectAll: (select: boolean) => void;
  onDeleteClick: (repo: GitHubRepo) => void;
  onArchiveToggle: (repo: GitHubRepo, newArchivedState: boolean) => Promise<void>;
  onSyncClick?: (repo: GitHubRepo) => void;
  onDirectSync?: (repo: GitHubRepo) => Promise<boolean>;
  forkSyncStatuses?: Record<number, ForkSyncStatus>;
  syncingForkIds?: Set<number>;
  onOpenDrawer?: (repo: GitHubRepo) => void;
  currentSort?: FilterOptions['sort'];
  onSortChange?: (sort: FilterOptions['sort']) => void;
  auditConfig?: AuditThresholdsConfig;
}

// Inline Expanded Row Details Component
function InlineRepoDetails({
  repo,
  forkSyncStatus,
  isSyncing,
  onOpenDrawer,
  onArchiveToggle,
  onDeleteClick,
  onSyncClick,
  onDirectSync,
}: {
  repo: GitHubRepo;
  forkSyncStatus?: ForkSyncStatus;
  isSyncing?: boolean;
  onOpenDrawer?: (repo: GitHubRepo) => void;
  onArchiveToggle: (repo: GitHubRepo, newArchivedState: boolean) => Promise<void>;
  onDeleteClick: (repo: GitHubRepo) => void;
  onSyncClick?: (repo: GitHubRepo) => void;
  onDirectSync?: (repo: GitHubRepo) => Promise<boolean>;
}) {
  const [details, setDetails] = useState<RepoDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    api.repos.getDetails(repo.owner.login, repo.name)
      .then((data: RepoDetailsData) => {
        if (isMounted) setDetails(data);
      })
      .catch((err: any) => {
        if (isMounted) setError(err.message || 'Failed to load details');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [repo.owner.login, repo.name]);

  const copyClone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`git clone https://github.com/${repo.full_name}.git`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalBytes = details?.totalBytes || 1;
  const languages = details?.languages
    ? Object.entries(details.languages)
        .map(([name, bytes]) => ({
          name,
          bytes,
          percentage: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
          color: getLanguageColor(name),
        }))
        .sort((a, b) => b.bytes - a.bytes)
    : [];

  return (
    <div className="p-4 sm:p-5 bg-[#fffef2] dark:bg-[#0d1117] border-t-2 border-b-2 border-[#1a1a1a] dark:border-[#30363d] shadow-inner space-y-4">
      {/* Description & Clone Box */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-[#161b22] p-3 rounded-xl border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a]">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[#1a1a1a] dark:text-[#f0f6fc] font-medium leading-relaxed">
            {repo.description || <span className="italic text-[#777] dark:text-[#8b949e]">No description provided for this repository.</span>}
          </p>
          {repo.topics && repo.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {repo.topics.map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.2 rounded bg-[#fffef2] dark:bg-[#21262d] border border-[#1a1a1a] dark:border-[#30363d] text-[10px] font-space font-bold text-[#1a1a1a] dark:text-[#f0f6fc]"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={copyClone}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[#1a1a1a] dark:border-[#30363d] bg-[#fffef2] dark:bg-[#21262d] hover:bg-[#ffcc5c] dark:hover:bg-[#f0883e] dark:hover:text-black text-[#1a1a1a] dark:text-[#f0f6fc] text-xs font-space font-bold shadow-[2px_2px_0_#1a1a1a] transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600 stroke-[3]" /> : <Copy className="w-3.5 h-3.5 stroke-[2.5]" />}
            <span>{copied ? 'Copied' : 'Clone URL'}</span>
          </button>

          {onOpenDrawer && (
            <button
              onClick={() => onOpenDrawer(repo)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[#1a1a1a] dark:border-[#30363d] bg-[#4ecdc4] dark:bg-[#39d353] text-[#1a1a1a] text-xs font-space font-bold shadow-[2px_2px_0_#1a1a1a] transition cursor-pointer hover:bg-[#3db8af]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Full Drawer</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-6 gap-2 text-xs font-space text-[#666] dark:text-[#8b949e]">
          <RefreshCw className="w-4 h-4 animate-spin stroke-[2.5] text-[#ff6b6b]" />
          <span>Fetching languages, contributors and telemetry...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border-2 border-red-500 rounded-xl text-xs text-red-700 dark:text-red-400 font-space font-medium">
          Failed to load live repository details: {error}
        </div>
      )}

      {/* Details Grid */}
      {!loading && !error && details && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Languages Breakdown */}
          <div className="bg-white dark:bg-[#161b22] p-3.5 rounded-xl border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a]">
            <div className="flex items-center gap-1.5 text-xs font-bold font-space text-[#1a1a1a] dark:text-[#f0f6fc] mb-2.5">
              <Code2 className="w-4 h-4 stroke-[2.5] text-[#ff6b6b]" />
              <span>LANGUAGES ({languages.length})</span>
            </div>

            {languages.length > 0 ? (
              <div className="space-y-2">
                {/* Progress Bar */}
                <div className="h-2.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden flex border border-[#1a1a1a] dark:border-[#30363d]">
                  {languages.map((l) => (
                    <div
                      key={l.name}
                      style={{ width: `${l.percentage}%`, backgroundColor: l.color }}
                      title={`${l.name}: ${l.percentage.toFixed(1)}%`}
                    />
                  ))}
                </div>

                {/* Percentage Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {languages.slice(0, 5).map((l) => (
                    <div key={l.name} className="flex items-center gap-1.5 text-[11px] font-space font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                      <span>{l.name}</span>
                      <span className="text-[#666] dark:text-[#8b949e] font-normal font-mono">{l.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#888] dark:text-[#8b949e] font-space">No language byte telemetry available.</p>
            )}
          </div>

          {/* Top Contributors */}
          <div className="bg-white dark:bg-[#161b22] p-3.5 rounded-xl border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a]">
            <div className="flex items-center gap-1.5 text-xs font-bold font-space text-[#1a1a1a] dark:text-[#f0f6fc] mb-2.5">
              <Users className="w-4 h-4 stroke-[2.5] text-[#4ecdc4]" />
              <span>ROSTER ({details.contributors.length})</span>
            </div>

            {details.contributors.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {details.contributors.slice(0, 6).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-1.5 bg-[#fffef2] dark:bg-[#21262d] border border-[#1a1a1a] dark:border-[#30363d] rounded-lg p-1 pr-2 shadow-[1px_1px_0_#1a1a1a]"
                  >
                    <img src={c.avatar_url} alt={c.login} className="w-5 h-5 rounded-full border border-[#1a1a1a] dark:border-[#30363d]" />
                    <span className="text-xs font-bold font-space text-[#1a1a1a] dark:text-[#f0f6fc]">{c.login}</span>
                    <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#161b22] border border-[#1a1a1a] dark:border-[#30363d] text-[10px] font-bold text-[#065f46] dark:text-[#39d353]">
                      {c.contributions} {c.contributions === 1 ? 'commit' : 'commits'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#888] dark:text-[#8b949e] font-space">No contributors available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function RepoTableView({
  repos,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeleteClick,
  onArchiveToggle,
  onSyncClick,
  onDirectSync,
  forkSyncStatuses,
  syncingForkIds,
  onOpenDrawer,
  currentSort = 'pushed_desc',
  onSortChange,
  auditConfig,
}: RepoTableViewProps) {
  const [expandedRepoId, setExpandedRepoId] = useState<number | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(repos.length > 0 ? 0 : null);
  const parentRef = useRef<HTMLDivElement>(null);

  const allSelected = repos.length > 0 && repos.every((r) => selectedIds.has(r.id));
  const isPartiallySelected = !allSelected && repos.some((r) => selectedIds.has(r.id));

  // TanStack Row Virtualizer for 60 FPS Table Rendering with 500+ items
  const rowVirtualizer = useVirtualizer({
    count: repos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 58,
    overscan: 8,
  });

  // Reset or constrain highlightedIndex if repos list changes
  useEffect(() => {
    if (repos.length === 0) {
      setHighlightedIndex(null);
    } else if (highlightedIndex !== null && highlightedIndex >= repos.length) {
      setHighlightedIndex(repos.length - 1);
    }
  }, [repos.length]);

  const toggleExpand = (repoId: number) => {
    setExpandedRepoId((prev) => (prev === repoId ? null : repoId));
  };

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (document.querySelector('[role="dialog"]')) {
        return;
      }
      if (repos.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const nextIndex = prev === null ? 0 : Math.min(repos.length - 1, prev + 1);
          rowVirtualizer.scrollToIndex(nextIndex, { align: 'auto' });
          return nextIndex;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const nextIndex = prev === null ? 0 : Math.max(0, prev - 1);
          rowVirtualizer.scrollToIndex(nextIndex, { align: 'auto' });
          return nextIndex;
        });
      } else if (e.key === ' ' || e.code === 'Space') {
        if (highlightedIndex !== null && repos[highlightedIndex]) {
          e.preventDefault();
          onToggleSelect(repos[highlightedIndex].id);
        }
      } else if (e.key === 'Enter') {
        if (highlightedIndex !== null && repos[highlightedIndex]) {
          e.preventDefault();
          const targetRepo = repos[highlightedIndex];
          if (onOpenDrawer) {
            onOpenDrawer(targetRepo);
          } else {
            toggleExpand(targetRepo.id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [repos, highlightedIndex, onToggleSelect, onOpenDrawer, rowVirtualizer]);

  // Column sort toggler helper
  const handleColumnSort = (column: 'name' | 'pushed' | 'created' | 'stars') => {
    if (!onSortChange) return;

    if (column === 'name') {
      onSortChange(currentSort === 'name_asc' ? 'name_desc' : 'name_asc');
    } else if (column === 'pushed') {
      onSortChange(currentSort === 'pushed_desc' ? 'pushed_asc' : 'pushed_desc');
    } else if (column === 'created') {
      onSortChange(currentSort === 'created_desc' ? 'created_asc' : 'created_desc');
    } else if (column === 'stars') {
      onSortChange(currentSort === 'stars_desc' ? 'stars_asc' : 'stars_desc');
    }
  };

  const getSortIcon = (column: 'name' | 'pushed' | 'created' | 'stars') => {
    if (column === 'name') {
      if (currentSort === 'name_asc') return <ArrowUp className="w-3.5 h-3.5 text-[#ff6b6b] stroke-[3]" />;
      if (currentSort === 'name_desc') return <ArrowDown className="w-3.5 h-3.5 text-[#ff6b6b] stroke-[3]" />;
    } else if (column === 'pushed') {
      if (currentSort === 'pushed_desc') return <ArrowDown className="w-3.5 h-3.5 text-[#ff6b6b] stroke-[3]" />;
      if (currentSort === 'pushed_asc') return <ArrowUp className="w-3.5 h-3.5 text-[#ff6b6b] stroke-[3]" />;
    } else if (column === 'created') {
      if (currentSort === 'created_desc') return <ArrowDown className="w-3.5 h-3.5 text-[#ff6b6b] stroke-[3]" />;
      if (currentSort === 'created_asc') return <ArrowUp className="w-3.5 h-3.5 text-[#ff6b6b] stroke-[3]" />;
    } else if (column === 'stars') {
      if (currentSort === 'stars_desc') return <ArrowDown className="w-3.5 h-3.5 text-[#ff6b6b] stroke-[3]" />;
      if (currentSort === 'stars_asc') return <ArrowUp className="w-3.5 h-3.5 text-[#ff6b6b] stroke-[3]" />;
    }
    return <ArrowUpDown className="w-3 h-3 text-[#888] opacity-0 group-hover/th:opacity-100 transition" />;
  };

  const activityTagStyles: Record<string, string> = {
    active: 'bg-[#10b981]/20 text-[#065f46] dark:text-[#39d353] border-[#10b981]',
    warm: 'bg-[#4ecdc4]/25 text-[#115e59] dark:text-[#4ecdc4] border-[#4ecdc4]',
    cool: 'bg-[#ffcc5c]/30 text-[#854d0e] dark:text-[#f0883e] border-[#ffcc5c]',
    stale: 'bg-[#fb923c]/25 text-[#9a3412] dark:text-[#fb923c] border-[#fb923c]',
    dormant: 'bg-[#ff6b6b]/20 text-[#9f1239] dark:text-[#ff7b72] border-[#ff6b6b]',
  };

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div className="bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-2xl overflow-hidden shadow-[6px_6px_0_#1a1a1a] dark:shadow-[6px_6px_0_#000000] transition">
      {/* Scrollable Container with Virtualizer Ref */}
      <div 
        ref={parentRef} 
        className="overflow-x-auto max-h-[72vh] overflow-y-auto"
        style={{ scrollbarGutter: 'stable' }}
      >
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-20 shadow-sm">
            <tr className="border-b-[3px] border-[#1a1a1a] dark:border-[#30363d] bg-[#fffef2] dark:bg-[#0d1117] text-xs font-space font-bold text-[#1a1a1a] dark:text-[#f0f6fc] select-none">
              <th className="py-2.5 px-2 sm:px-3 w-9 sm:w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isPartiallySelected;
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  aria-label="Select all repositories"
                  className="w-4 h-4 rounded border-2 border-[#1a1a1a] dark:border-[#30363d] accent-[#1a1a1a] cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-1 sm:px-2 w-7 sm:w-8 text-center" title="Expand row for language & contributor insights">
                <ChevronDown className="w-4 h-4 text-[#888] dark:text-[#8b949e] mx-auto" />
              </th>
              
              {/* Repository Name Header (Sortable) */}
              <th 
                className="py-2.5 px-2.5 sm:px-3 cursor-pointer group/th hover:bg-[#fffae0] dark:hover:bg-[#21262d] transition"
                onClick={() => handleColumnSort('name')}
                title="Sort by Name (A-Z / Z-A)"
              >
                <div className="flex items-center gap-1.5">
                  <span>REPOSITORY</span>
                  {getSortIcon('name')}
                </div>
              </th>

              {/* Activity Header */}
              <th className="py-2.5 px-2 sm:px-2.5 whitespace-nowrap">
                <span>ACTIVITY</span>
              </th>

              {/* Language Header */}
              <th className="py-2.5 px-2 sm:px-2.5 whitespace-nowrap">
                <span>LANGUAGE</span>
              </th>

              {/* Created Date Header (Sortable) */}
              <th 
                className="py-2.5 px-2 sm:px-2.5 whitespace-nowrap cursor-pointer group/th hover:bg-[#fffae0] dark:hover:bg-[#21262d] transition"
                onClick={() => handleColumnSort('created')}
                title="Sort by Creation Age (Newest / Oldest)"
              >
                <div className="flex items-center gap-1">
                  <span>CREATED</span>
                  {getSortIcon('created')}
                </div>
              </th>

              {/* Last Push Header (Sortable) */}
              <th 
                className="py-2.5 px-2 sm:px-2.5 whitespace-nowrap cursor-pointer group/th hover:bg-[#fffae0] dark:hover:bg-[#21262d] transition"
                onClick={() => handleColumnSort('pushed')}
                title="Sort by Last Push (Recent / Stale)"
              >
                <div className="flex items-center gap-1">
                  <span>LAST PUSH</span>
                  {getSortIcon('pushed')}
                </div>
              </th>

              {/* Stats Header (Sortable) */}
              <th 
                className="py-2.5 px-2 sm:px-2.5 text-right whitespace-nowrap cursor-pointer group/th hover:bg-[#fffae0] dark:hover:bg-[#21262d] transition"
                onClick={() => handleColumnSort('stars')}
                title="Sort by Stars & Metrics"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>STATS</span>
                  {getSortIcon('stars')}
                </div>
              </th>

              {/* Actions Header */}
              <th className="py-2.5 px-2 sm:px-3 text-right whitespace-nowrap">ACTIONS</th>
            </tr>
          </thead>
          
          <tbody className="divide-y-2 divide-dashed divide-[#1a1a1a]/15 dark:divide-white/10 text-xs relative">
            {/* Top Virtual Spacer */}
            {virtualRows.length > 0 && (
              <tr>
                <td colSpan={9} style={{ height: `${virtualRows[0].start}px`, padding: 0, border: 'none' }} />
              </tr>
            )}

            {virtualRows.map((virtualRow) => {
              const repo = repos[virtualRow.index];
              if (!repo) return null;

              const index = virtualRow.index;
              const isSelected = selectedIds.has(repo.id);
              const isExpanded = expandedRepoId === repo.id;
              const isHighlighted = highlightedIndex === index;
              const isSyncing = syncingForkIds?.has(repo.id);
              const forkStatus = forkSyncStatuses?.[repo.id];
              const isInSync = forkStatus?.status === 'up_to_date' || (forkStatus && forkStatus.behind_by === 0);
              const age = formatAge(repo.created_at);
              const activity = getActivityLevel(repo.pushed_at, repo.created_at, auditConfig, repo.updated_at);
              const langColor = getLanguageColor(repo.language);
              const activityStyle = activityTagStyles[activity.level] || 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-[#1a1a1a]';

              return (
                <Fragment key={repo.id}>
                  <tr
                    id={`repo-row-${repo.id}`}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    tabIndex={0}
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => {
                      setHighlightedIndex(index);
                      toggleExpand(repo.id);
                    }}
                    className={`group cursor-pointer transition-all duration-100 relative ${
                      isHighlighted
                        ? isSelected
                          ? 'bg-[#ffcc5c]/40 dark:bg-[#f0883e]/30 ring-2 ring-inset ring-[#1a1a1a] dark:ring-[#f0883e]'
                          : 'bg-[#fffae0] dark:bg-[#21262d] ring-2 ring-inset ring-[#1a1a1a] dark:ring-[#4ecdc4]'
                        : isSelected
                        ? 'bg-[#ffcc5c]/25 dark:bg-[#f0883e]/20'
                        : isExpanded
                        ? 'bg-[#fffef2] dark:bg-[#0d1117]'
                        : repo.archived
                        ? 'bg-neutral-50/80 dark:bg-neutral-900/40 text-neutral-500 dark:text-neutral-400'
                        : 'hover:bg-[#fffef2] dark:hover:bg-[#21262d]/60 text-[#1a1a1a] dark:text-[#f0f6fc]'
                    }`}
                  >
                    {/* Select Checkbox */}
                    <td 
                      className="py-2.5 px-2 sm:px-3 text-center relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isHighlighted && (
                        <div className="absolute left-0 top-1 bottom-1 w-1 bg-[#1a1a1a] dark:bg-[#4ecdc4] rounded-r" />
                      )}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setHighlightedIndex(index);
                          onToggleSelect(repo.id);
                        }}
                        aria-label={`Select repository ${repo.name}`}
                        className="w-4 h-4 rounded border-2 border-[#1a1a1a] dark:border-[#30363d] accent-[#1a1a1a] cursor-pointer"
                      />
                    </td>

                    {/* Expand Chevron Toggle */}
                    <td className="py-2.5 px-1 sm:px-2 text-center text-[#1a1a1a] dark:text-[#f0f6fc]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(repo.id);
                        }}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? `Collapse details for ${repo.name}` : `Expand details for ${repo.name}`}
                        className={`p-1 rounded-lg border border-transparent hover:border-[#1a1a1a] dark:hover:border-[#30363d] transition cursor-pointer flex items-center justify-center mx-auto ${
                          isExpanded ? 'bg-[#ffcc5c] dark:bg-[#f0883e] text-[#1a1a1a] border-[#1a1a1a] dark:border-[#30363d] shadow-[1px_1px_0_#1a1a1a]' : 'hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                      >
                        <ChevronDown 
                          className={`w-4 h-4 stroke-[2.5] transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-[#1a1a1a]' : 'rotate-0 text-[#777] dark:text-[#8b949e] group-hover:text-[#1a1a1a] dark:group-hover:text-[#f0f6fc]'
                          }`} 
                        />
                      </button>
                    </td>

                    {/* Repository Name & Badges */}
                    <td className="py-2.5 px-2.5 sm:px-3 min-w-[170px] max-w-[340px]">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="mt-0.5 shrink-0 text-[#1a1a1a] dark:text-[#f0f6fc]">
                          {repo.fork ? (
                            <span title="Forked repository"><GitFork className="w-3.5 h-3.5 stroke-[2.5]" /></span>
                          ) : repo.private ? (
                            <span title="Private repository"><Lock className="w-3.5 h-3.5 text-[#854d0e] dark:text-[#f0883e] stroke-[2.5]" /></span>
                          ) : (
                            <span title="Public repository"><Globe className="w-3.5 h-3.5 text-[#555] dark:text-[#8b949e] stroke-[2.5]" /></span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <a
                              href={repo.html_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="font-extrabold text-[#1a1a1a] dark:text-[#f0f6fc] hover:text-[#ff6b6b] dark:hover:text-[#ff7b72] text-sm truncate flex items-center gap-1 transition"
                            >
                              <span className="truncate">{repo.name}</span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition shrink-0 stroke-[2.5]" />
                            </a>

                            <div className="flex items-center gap-1">
                              {repo.private ? (
                                <span className="text-[9px] font-space font-bold px-1.5 py-0.2 rounded border border-[#1a1a1a] dark:border-[#30363d] bg-[#ffcc5c]/30 text-[#854d0e] dark:text-[#f0883e] uppercase">
                                  Private
                                </span>
                              ) : (
                                <span className="text-[9px] font-space font-bold px-1.5 py-0.2 rounded border border-[#1a1a1a] dark:border-[#30363d] bg-[#fffef2] dark:bg-[#21262d] text-[#1a1a1a] dark:text-[#f0f6fc] uppercase">
                                  Public
                                </span>
                              )}

                              {repo.fork && (
                                <>
                                  <span className="text-[9px] font-space font-bold px-1.5 py-0.2 rounded border border-[#1a1a1a] dark:border-[#30363d] bg-[#4ecdc4]/20 text-[#0f766e] dark:text-[#39d353] uppercase">
                                    Fork
                                  </span>
                                  {isInSync && (
                                    <span className="text-[9px] font-space font-bold px-1.5 py-0.2 rounded border border-[#10b981] bg-[#10b981]/20 text-[#065f46] dark:text-[#39d353] uppercase inline-flex items-center gap-0.5">
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                      In Sync
                                    </span>
                                  )}
                                </>
                              )}

                              {repo.archived && (
                                <span className="text-[9px] font-space font-bold px-1.5 py-0.2 rounded border border-[#1a1a1a] dark:border-[#30363d] bg-neutral-200 dark:bg-neutral-800 text-[#555] dark:text-neutral-400 uppercase">
                                  Archived
                                </span>
                              )}

                              {/* Search Match Telemetry Badge */}
                              {repo._matchType === 'hybrid' && (
                                <span className="text-[9px] font-space font-bold px-1.5 py-0.2 rounded border border-purple-500 bg-purple-500/20 text-purple-700 dark:text-purple-300 inline-flex items-center gap-0.5" title="Ranked via Reciprocal Rank Fusion of FTS5 + Semantic Vector">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  Hybrid
                                </span>
                              )}
                              {repo._matchType === 'semantic' && (
                                <span className="text-[9px] font-space font-bold px-1.5 py-0.2 rounded border border-indigo-500 bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 inline-flex items-center gap-0.5" title={`Semantic similarity match: ${Math.round((repo._similarity || 0) * 100)}%`}>
                                  <Sparkles className="w-2.5 h-2.5" />
                                  AI Match
                                </span>
                              )}
                              {repo._matchType === 'fts5' && (
                                <span className="text-[9px] font-space font-bold px-1.5 py-0.2 rounded border border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-300 inline-flex items-center gap-0.5" title="Exact token match via SQLite FTS5">
                                  <Zap className="w-2.5 h-2.5" />
                                  FTS5
                                </span>
                              )}
                            </div>
                          </div>

                          {repo.description ? (
                            <p className="text-xs text-[#555] dark:text-[#8b949e] truncate mt-0.5 max-w-[280px] xl:max-w-md font-normal">
                              {repo.description}
                            </p>
                          ) : null}

                          {repo.fork && repo.parent && (
                            <div className="text-[11px] text-[#666] dark:text-[#8b949e] font-space flex items-center gap-1 truncate mt-0.5">
                              <span>upstream:</span>
                              <a
                                href={repo.parent.html_url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[#1a1a1a] dark:text-[#f0f6fc] font-bold hover:underline truncate"
                              >
                                {repo.parent.full_name}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Activity Tier */}
                    <td className="py-2.5 px-2 sm:px-2.5 whitespace-nowrap">
                      <span 
                        className={`font-space text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border-2 ${activityStyle}`}
                        title={activity.description}
                      >
                        {activity.label}
                      </span>
                    </td>

                    {/* Language */}
                    <td className="py-2.5 px-2 sm:px-2.5 whitespace-nowrap font-space text-xs">
                      {repo.language ? (
                        <div className="flex items-center gap-1.5 font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">
                          <span className="w-2.5 h-2.5 rounded-full border border-black/40 dark:border-white/30" style={{ backgroundColor: langColor }} />
                          <span>{repo.language}</span>
                        </div>
                      ) : (
                        <span className="text-[#888] dark:text-[#8b949e]">—</span>
                      )}
                    </td>

                    {/* Created / Age */}
                    <td className="py-2.5 px-2 sm:px-2.5 whitespace-nowrap font-space text-xs font-semibold text-[#555] dark:text-[#8b949e]">
                      <span title={new Date(repo.created_at).toLocaleDateString()}>{age.label}</span>
                    </td>

                    {/* Last Commit */}
                    <td className="py-2.5 px-2 sm:px-2.5 whitespace-nowrap font-space text-xs font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">
                      <span className={activity.level === 'dormant' || activity.level === 'stale' ? 'text-[#ff6b6b] dark:text-[#ff7b72]' : ''}>
                        {formatRelativeTime(repo.pushed_at)}
                      </span>
                    </td>

                    {/* Metrics */}
                    <td className="py-2.5 px-2 sm:px-2.5 whitespace-nowrap font-space text-xs text-right">
                      <div className="flex items-center justify-end gap-2.5 text-[#1a1a1a] dark:text-[#f0f6fc] font-bold">
                        <span title="Stars" className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-[#ffcc5c] text-[#1a1a1a] dark:text-[#ffcc5c] stroke-[2]" />
                          <span className="font-mono tabular-nums">{repo.stargazers_count}</span>
                        </span>
                        <span title="Forks" className="flex items-center gap-1">
                          <GitFork className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span className="font-mono tabular-nums">{repo.forks_count}</span>
                        </span>
                        <span title="Disk size" className="text-[#666] dark:text-[#8b949e] font-medium font-mono tabular-nums">
                          {formatRepoSize(repo.size)}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td 
                      className="py-2.5 px-2 sm:px-3 whitespace-nowrap text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {onOpenDrawer && (
                          <button
                            onClick={() => onOpenDrawer(repo)}
                            title="Open Slide-over details panel"
                            className="px-2 py-1 rounded-lg text-xs font-bold font-space bg-white dark:bg-[#21262d] hover:bg-[#fffef2] dark:hover:bg-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer flex items-center gap-1"
                          >
                            <SlidersHorizontal className="w-3 h-3 stroke-[2.5]" />
                            <span className="hidden xl:inline">Inspect</span>
                          </button>
                        )}

                        {repo.fork && (
                          <>
                            {isSyncing ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-space bg-[#fffef2] dark:bg-[#21262d] text-[#1a1a1a] dark:text-[#f0f6fc] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a]">
                                <RefreshCw className="w-3 h-3 animate-spin text-[#ff6b6b] stroke-[2.5]" />
                                <span>Syncing...</span>
                              </span>
                            ) : isInSync ? (
                              <span
                                id={`repo-synced-badge-${repo.id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-space bg-[#10b981]/20 text-[#065f46] dark:text-[#39d353] border-2 border-[#10b981] shadow-[2px_2px_0_#1a1a1a]"
                                title="Fork is in sync and up to date with upstream"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Synced</span>
                              </span>
                            ) : forkStatus?.status === 'behind' ? (
                              <button
                                id={`repo-sync-btn-${repo.id}`}
                                onClick={() => {
                                  if (onDirectSync) onDirectSync(repo);
                                  else if (onSyncClick) onSyncClick(repo);
                                }}
                                title={`Fast-forward ${forkStatus.behind_by} commits behind upstream`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-space bg-[#ffcc5c] dark:bg-[#f0883e] text-[#1a1a1a] hover:bg-[#ffbe3b] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
                              >
                                <GitFork className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Sync {forkStatus.behind_by > 0 ? `(-${forkStatus.behind_by})` : ''}</span>
                              </button>
                            ) : forkStatus?.status === 'ahead' ? (
                              <span
                                id={`repo-ahead-badge-${repo.id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-space bg-[#4ecdc4]/20 text-[#0f766e] dark:text-[#39d353] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a]"
                                title={`Ahead of upstream by ${forkStatus.ahead_by} commits`}
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Ahead</span>
                              </span>
                            ) : onSyncClick ? (
                              <button
                                id={`repo-sync-btn-${repo.id}`}
                                onClick={() => {
                                  if (onDirectSync) onDirectSync(repo);
                                  else onSyncClick(repo);
                                }}
                                title="Sync or check upstream status"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-space bg-[#ffcc5c] dark:bg-[#f0883e] text-[#1a1a1a] hover:bg-[#ffbe3b] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
                              >
                                <GitFork className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Sync</span>
                              </button>
                            ) : null}
                          </>
                        )}

                        <button
                          onClick={() => onArchiveToggle(repo, !repo.archived)}
                          title={repo.archived ? 'Unarchive repository' : 'Archive repository'}
                          className="w-7 h-7 rounded-full border-2 border-[#1a1a1a] dark:border-[#30363d] flex items-center justify-center bg-white dark:bg-[#21262d] hover:bg-[#ffcc5c] dark:hover:bg-[#f0883e] dark:hover:text-black text-[#1a1a1a] dark:text-[#f0f6fc] transition shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                        >
                          {repo.archived ? (
                            <ArchiveRestore className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : (
                            <Archive className="w-3.5 h-3.5 stroke-[2.5]" />
                          )}
                        </button>

                        <button
                          onClick={() => onDeleteClick(repo)}
                          title="Delete repository"
                          className="w-7 h-7 rounded-full border-2 border-[#1a1a1a] dark:border-[#30363d] flex items-center justify-center bg-white dark:bg-[#21262d] hover:bg-[#ff6b6b] hover:text-white text-[#1a1a1a] dark:text-[#f0f6fc] transition shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Inline Expanded Row */}
                  {isExpanded && (
                    <tr key={`expanded-${repo.id}`} className="bg-[#fffef2] dark:bg-[#0d1117]">
                      <td colSpan={9} className="p-0 border-t border-b-2 border-[#1a1a1a] dark:border-[#30363d]">
                        <InlineRepoDetails
                          repo={repo}
                          forkSyncStatus={forkStatus}
                          isSyncing={isSyncing}
                          onOpenDrawer={onOpenDrawer}
                          onArchiveToggle={onArchiveToggle}
                          onDeleteClick={onDeleteClick}
                          onSyncClick={onSyncClick}
                          onDirectSync={onDirectSync}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}

            {/* Bottom Virtual Spacer */}
            {virtualRows.length > 0 && (
              <tr>
                <td 
                  colSpan={9} 
                  style={{ 
                    height: `${rowVirtualizer.getTotalSize() - (virtualRows[virtualRows.length - 1]?.end || 0)}px`, 
                    padding: 0, 
                    border: 'none' 
                  }} 
                />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Keyboard Shortcuts & Telemetry Hint Bar */}
      <div className="border-t-[3px] border-[#1a1a1a] dark:border-[#30363d] bg-[#fffef2] dark:bg-[#0d1117] px-4 py-2 flex items-center justify-between text-xs font-space text-[#555] dark:text-[#8b949e] flex-wrap gap-2 select-none">
        <div className="flex items-center gap-3.5 flex-wrap">
          <span className="flex items-center gap-1 font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] text-[10px] font-bold shadow-[1px_1px_0_#1a1a1a]">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] text-[10px] font-bold shadow-[1px_1px_0_#1a1a1a]">↓</kbd>
            <span className="text-[11px] text-[#444] dark:text-[#8b949e] font-medium ml-0.5">Navigate</span>
          </span>
          <span className="flex items-center gap-1 font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] text-[10px] font-bold shadow-[1px_1px_0_#1a1a1a]">Space</kbd>
            <span className="text-[11px] text-[#444] dark:text-[#8b949e] font-medium ml-0.5">Select / Deselect</span>
          </span>
          <span className="flex items-center gap-1 font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] text-[10px] font-bold shadow-[1px_1px_0_#1a1a1a]">Enter</kbd>
            <span className="text-[11px] text-[#444] dark:text-[#8b949e] font-medium ml-0.5">Inspect Drawer</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-space text-[#888] dark:text-[#8b949e] font-bold">
            Virtual Table (60 FPS)
          </span>
          {highlightedIndex !== null && repos[highlightedIndex] && (
            <div className="text-[11px] font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">
              Focused: <span className="text-[#ff6b6b] dark:text-[#ff7b72] underline decoration-2">{repos[highlightedIndex].name}</span>{' '}
              <span className="text-[#777] dark:text-[#8b949e] font-normal font-mono">({highlightedIndex + 1}/{repos.length})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
