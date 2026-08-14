import { useState, useEffect, Fragment } from 'react';
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
  ChevronRight,
  Code2,
  Users,
  GitCommit,
  Layers,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  SlidersHorizontal,
  FolderGit2
} from 'lucide-react';
import { GitHubRepo, RepoDetailsData, ForkSyncStatus } from '../types';
import { formatAge, formatRelativeTime, getActivityLevel, formatRepoSize, getLanguageColor } from '../utils/github';

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

    fetch(`/api/github/repos/${repo.owner.login}/${repo.name}/details`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }
        return res.json();
      })
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
    <div className="p-4 sm:p-5 bg-[#fffef2] border-t-2 border-b-2 border-[#1a1a1a] shadow-inner space-y-4">
      {/* Description & Clone Box */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a]">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[#1a1a1a] font-medium leading-relaxed">
            {repo.description || <span className="italic text-[#777]">No description provided for this repository.</span>}
          </p>
          {repo.topics && repo.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {repo.topics.map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.2 rounded bg-[#fffef2] border border-[#1a1a1a] text-[10px] font-space font-bold text-[#1a1a1a]"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {repo.fork && (
            <>
              {isSyncing ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#fffef2] border-2 border-[#1a1a1a] text-[#1a1a1a] text-xs font-space font-bold shadow-[2px_2px_0_#1a1a1a]">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#ff6b6b] stroke-[2.5]" />
                  <span>Syncing...</span>
                </span>
              ) : forkSyncStatus?.status === 'up_to_date' ? (
                <span
                  id={`inline-synced-badge-${repo.id}`}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#10b981]/20 border-2 border-[#10b981] text-[#065f46] text-xs font-space font-bold shadow-[2px_2px_0_#1a1a1a]"
                  title="Fork is in sync with upstream"
                >
                  <Check className="w-3.5 h-3.5 text-[#065f46] stroke-[3]" />
                  <span>Up to Date (In Sync)</span>
                </span>
              ) : forkSyncStatus?.status === 'behind' ? (
                <button
                  id={`inline-sync-btn-${repo.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDirectSync) onDirectSync(repo);
                    else if (onSyncClick) onSyncClick(repo);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#ffcc5c] hover:bg-[#ffbe3b] border-2 border-[#1a1a1a] text-[#1a1a1a] text-xs font-space font-extrabold shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
                  title={`Fast-forward ${forkSyncStatus.behind_by} commits behind upstream`}
                >
                  <GitFork className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Sync Upstream (-{forkSyncStatus.behind_by})</span>
                </button>
              ) : onSyncClick ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDirectSync) onDirectSync(repo);
                    else onSyncClick(repo);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#ffcc5c] hover:bg-[#ffbe3b] border-2 border-[#1a1a1a] text-[#1a1a1a] text-xs font-space font-extrabold shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
                >
                  <GitFork className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Sync Upstream</span>
                </button>
              ) : null}
            </>
          )}

          <button
            onClick={copyClone}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#fffef2] hover:bg-[#ffcc5c] border-2 border-[#1a1a1a] text-[#1a1a1a] text-xs font-space font-bold shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#10b981] stroke-[2.5]" />
                <span className="text-[#065f46]">Copied!</span>
              </>
            ) : (
              <>
                <Terminal className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>git clone</span>
                <Copy className="w-3 h-3 text-[#666]" />
              </>
            )}
          </button>

          {onOpenDrawer && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDrawer(repo);
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#4ecdc4] hover:bg-[#38b2ac] border-2 border-[#1a1a1a] text-[#1a1a1a] text-xs font-space font-extrabold shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Full Slide-over Panel</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-[#ff6b6b] mx-auto stroke-[2.5]" />
          <p className="font-space font-bold text-xs text-[#1a1a1a]">Fetching language percentages and contributors...</p>
        </div>
      ) : error ? (
        <div className="p-3 bg-[#ff6b6b]/15 border-2 border-[#ff6b6b] rounded-xl text-xs font-space text-[#9f1239]">
          Failed to load live language details ({error}). You can still use quick actions or inspect the repository.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Column 1: Languages Breakdown (7 cols) */}
          <div className="lg:col-span-7 bg-white p-3.5 rounded-xl border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-space font-bold text-xs text-[#1a1a1a]">
                <Code2 className="w-4 h-4 text-[#ff6b6b] stroke-[2.5]" />
                <span>Primary Language Percentages</span>
              </div>
              <span className="font-space text-[11px] text-[#666]">
                Footprint: <strong className="text-[#1a1a1a]">{formatRepoSize(details?.totalBytes ? Math.round(details.totalBytes / 1024) : repo.size)}</strong>
              </span>
            </div>

            {languages.length > 0 ? (
              <>
                {/* Horizontal segmented percentage bar */}
                <div className="h-3 w-full rounded-md overflow-hidden border-2 border-[#1a1a1a] flex bg-[#fffef2] shadow-[1px_1px_0_#1a1a1a]">
                  {languages.map((lang) => (
                    <div
                      key={lang.name}
                      style={{
                        width: `${Math.max(lang.percentage, 1)}%`,
                        backgroundColor: lang.color,
                      }}
                      className="h-full"
                      title={`${lang.name}: ${lang.percentage.toFixed(1)}% (${formatRepoSize(Math.round(lang.bytes / 1024))})`}
                    />
                  ))}
                </div>

                {/* Badges with % */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {languages.map((lang) => (
                    <div
                      key={lang.name}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#fffef2] border border-[#1a1a1a] text-xs font-space font-bold shadow-[1px_1px_0_#1a1a1a]"
                    >
                      <span className="w-2.5 h-2.5 rounded-full border border-black/40" style={{ backgroundColor: lang.color }} />
                      <span className="text-[#1a1a1a]">{lang.name}</span>
                      <span className="text-[#666] font-extrabold">{lang.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-[#888] font-space">No language byte breakdown recorded.</p>
            )}
          </div>

          {/* Column 2: Recent Contributors (5 cols) */}
          <div className="lg:col-span-5 bg-white p-3.5 rounded-xl border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-space font-bold text-xs text-[#1a1a1a]">
                <Users className="w-4 h-4 text-[#4ecdc4] stroke-[2.5]" />
                <span>Recent Contributors</span>
              </div>
              <span className="font-space text-[10px] text-[#666]">
                {details?.contributors ? `${details.contributors.length} active` : ''}
              </span>
            </div>

            {details?.contributors && details.contributors.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {details.contributors.slice(0, 4).map((c) => (
                  <div
                    key={c.id || c.login}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-[#fffef2] border border-[#1a1a1a]/40 text-xs font-space"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={c.avatar_url}
                        alt={c.login}
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 rounded-full border border-[#1a1a1a] object-cover"
                      />
                      <a
                        href={c.html_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold text-[#1a1a1a] hover:text-[#ff6b6b] truncate flex items-center gap-1"
                      >
                        <span className="truncate">{c.login}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-[#1a1a1a] text-[10px] font-bold text-[#065f46]">
                      {c.contributions} {c.contributions === 1 ? 'commit' : 'commits'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#888] font-space">No contributors available.</p>
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
}: RepoTableViewProps) {
  const [expandedRepoId, setExpandedRepoId] = useState<number | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(repos.length > 0 ? 0 : null);

  const allSelected = repos.length > 0 && repos.every((r) => selectedIds.has(r.id));
  const isPartiallySelected = !allSelected && repos.some((r) => selectedIds.has(r.id));

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

  // Keyboard navigation handler for ArrowUp, ArrowDown, Space, Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in inputs or selects
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Don't intercept if a modal dialog is open
      if (document.querySelector('[role="dialog"]')) {
        return;
      }

      if (repos.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const nextIndex = prev === null ? 0 : Math.min(repos.length - 1, prev + 1);
          const targetRepo = repos[nextIndex];
          if (targetRepo) {
            const el = document.getElementById(`repo-row-${targetRepo.id}`);
            el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
          return nextIndex;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const nextIndex = prev === null ? 0 : Math.max(0, prev - 1);
          const targetRepo = repos[nextIndex];
          if (targetRepo) {
            const el = document.getElementById(`repo-row-${targetRepo.id}`);
            el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
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
  }, [repos, highlightedIndex, onToggleSelect, onOpenDrawer]);

  const activityTagStyles: Record<string, string> = {
    active: 'bg-[#10b981]/20 text-[#065f46] border-[#10b981]',
    warm: 'bg-[#4ecdc4]/25 text-[#115e59] border-[#4ecdc4]',
    cool: 'bg-[#ffcc5c]/30 text-[#854d0e] border-[#ffcc5c]',
    stale: 'bg-[#fb923c]/25 text-[#9a3412] border-[#fb923c]',
    dormant: 'bg-[#ff6b6b]/20 text-[#9f1239] border-[#ff6b6b]',
  };

  return (
    <div className="bg-white border-[3px] border-[#1a1a1a] rounded-2xl overflow-hidden shadow-[6px_6px_0_#1a1a1a]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-[3px] border-[#1a1a1a] bg-[#fffef2] text-xs font-space font-bold text-[#1a1a1a] select-none">
              <th className="py-2.5 px-2 sm:px-3 w-9 sm:w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isPartiallySelected;
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  aria-label="Select all repositories"
                  className="w-4 h-4 rounded border-2 border-[#1a1a1a] accent-[#1a1a1a] cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-1 sm:px-2 w-7 sm:w-8 text-center" title="Expand row for language & contributor insights">
                <ChevronDown className="w-4 h-4 text-[#888] mx-auto" />
              </th>
              <th className="py-2.5 px-2.5 sm:px-3">REPOSITORY</th>
              <th className="py-2.5 px-2 sm:px-2.5">ACTIVITY</th>
              <th className="py-2.5 px-2 sm:px-2.5">LANGUAGE</th>
              <th className="py-2.5 px-2 sm:px-2.5">CREATED / AGE</th>
              <th className="py-2.5 px-2 sm:px-2.5">LAST PUSH</th>
              <th className="py-2.5 px-2 sm:px-2.5 text-right">STATS</th>
              <th className="py-2.5 px-2 sm:px-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-dashed divide-[#1a1a1a]/15 text-xs">
            {repos.map((repo, index) => {
              const isSelected = selectedIds.has(repo.id);
              const isExpanded = expandedRepoId === repo.id;
              const isHighlighted = highlightedIndex === index;
              const isSyncing = syncingForkIds?.has(repo.id);
              const forkStatus = forkSyncStatuses?.[repo.id];
              const isInSync = forkStatus?.status === 'up_to_date' || (forkStatus && forkStatus.behind_by === 0);
              const age = formatAge(repo.created_at);
              const activity = getActivityLevel(repo.pushed_at, repo.created_at);
              const langColor = getLanguageColor(repo.language);
              const activityStyle = activityTagStyles[activity.level] || 'bg-neutral-100 text-neutral-800 border-[#1a1a1a]';

              return (
                <Fragment key={repo.id}>
                  <tr
                    id={`repo-row-${repo.id}`}
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
                          ? 'bg-[#ffcc5c]/40 ring-2 ring-inset ring-[#1a1a1a]'
                          : 'bg-[#fffae0] ring-2 ring-inset ring-[#1a1a1a]'
                        : isSelected
                        ? 'bg-[#ffcc5c]/25'
                        : isExpanded
                        ? 'bg-[#fffef2]'
                        : repo.archived
                        ? 'bg-neutral-50/80 text-neutral-500'
                        : 'hover:bg-[#fffef2] text-[#1a1a1a]'
                    }`}
                  >
                    {/* Select Checkbox */}
                    <td 
                      className="py-2.5 px-2 sm:px-3 text-center relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Active highlight indicator bar */}
                      {isHighlighted && (
                        <div className="absolute left-0 top-1 bottom-1 w-1 bg-[#1a1a1a] rounded-r" />
                      )}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setHighlightedIndex(index);
                          onToggleSelect(repo.id);
                        }}
                        aria-label={`Select repository ${repo.name}`}
                        className="w-4 h-4 rounded border-2 border-[#1a1a1a] accent-[#1a1a1a] cursor-pointer"
                      />
                    </td>

                    {/* Expand Chevron Toggle */}
                    <td className="py-2.5 px-1 sm:px-2 text-center text-[#1a1a1a]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(repo.id);
                        }}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? `Collapse details for ${repo.name}` : `Expand details for ${repo.name}`}
                        className={`p-1 rounded-lg border border-transparent hover:border-[#1a1a1a] transition cursor-pointer flex items-center justify-center mx-auto ${
                          isExpanded ? 'bg-[#ffcc5c] text-[#1a1a1a] border-[#1a1a1a] shadow-[1px_1px_0_#1a1a1a]' : 'hover:bg-black/10'
                        }`}
                      >
                        <ChevronDown 
                          className={`w-4 h-4 stroke-[2.5] text-[#1a1a1a] transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : 'rotate-0 text-[#777] group-hover:text-[#1a1a1a]'
                          }`} 
                        />
                      </button>
                    </td>

                    {/* Repository Name & Badges */}
                    <td className="py-2.5 px-2.5 sm:px-3 min-w-[160px] md:min-w-[190px] lg:min-w-[210px] xl:min-w-[240px]">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="mt-0.5 shrink-0 text-[#1a1a1a]">
                          {repo.fork ? (
                            <span title="Forked repository"><GitFork className="w-3.5 h-3.5 text-[#1a1a1a] stroke-[2.5]" /></span>
                          ) : repo.private ? (
                            <span title="Private repository"><Lock className="w-3.5 h-3.5 text-[#854d0e] stroke-[2.5]" /></span>
                          ) : (
                            <span title="Public repository"><Globe className="w-3.5 h-3.5 text-[#555] stroke-[2.5]" /></span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <a
                              href={repo.html_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="font-extrabold text-[#1a1a1a] hover:text-[#ff6b6b] text-sm truncate flex items-center gap-1 transition"
                            >
                              <span className="truncate">{repo.name}</span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition shrink-0 stroke-[2.5]" />
                            </a>

                            <div className="flex items-center gap-1">
                              {repo.private ? (
                                <span className="text-[9px] font-space font-bold px-1.5 py-0.2 rounded border border-[#1a1a1a] bg-[#ffcc5c]/30 text-[#854d0e] uppercase">
                                  Private
                                </span>
                              ) : (
                                <span className="text-[9px] font-space font-bold px-1.5 py-0.2 rounded border border-[#1a1a1a] bg-[#fffef2] text-[#1a1a1a] uppercase">
                                  Public
                                </span>
                              )}

                              {repo.fork && (
                                <>
                                  <span className="text-[9px] font-space font-bold px-1.5 py-0.2 rounded border border-[#1a1a1a] bg-[#4ecdc4]/20 text-[#0f766e] uppercase">
                                    Fork
                                  </span>
                                  {isInSync && (
                                    <span className="text-[9px] font-space font-bold px-1.5 py-0.2 rounded border border-[#10b981] bg-[#10b981]/20 text-[#065f46] uppercase inline-flex items-center gap-0.5">
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                      In Sync
                                    </span>
                                  )}
                                </>
                              )}

                              {repo.archived && (
                                <span className="text-[9px] font-space font-bold px-1.5 py-0.2 rounded border border-[#1a1a1a] bg-neutral-200 text-[#555] uppercase">
                                  Archived
                                </span>
                              )}
                            </div>
                          </div>

                          {repo.description ? (
                            <p className="text-xs text-[#555] truncate mt-0.5 max-w-[260px] xl:max-w-md font-normal">
                              {repo.description}
                            </p>
                          ) : null}

                          {repo.fork && repo.parent && (
                            <div className="text-[11px] text-[#666] font-space flex items-center gap-1 truncate mt-0.5">
                              <span>upstream:</span>
                              <a
                                href={repo.parent.html_url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[#1a1a1a] font-bold hover:underline truncate"
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
                        <div className="flex items-center gap-1.5 font-bold text-[#1a1a1a]">
                          <span className="w-2.5 h-2.5 rounded-full border border-black/40" style={{ backgroundColor: langColor }} />
                          <span>{repo.language}</span>
                        </div>
                      ) : (
                        <span className="text-[#888]">—</span>
                      )}
                    </td>

                    {/* Created / Age */}
                    <td className="py-2.5 px-2 sm:px-2.5 whitespace-nowrap font-space text-xs font-semibold text-[#555]">
                      <span title={new Date(repo.created_at).toLocaleDateString()}>{age.label}</span>
                    </td>

                    {/* Last Commit */}
                    <td className="py-2.5 px-2 sm:px-2.5 whitespace-nowrap font-space text-xs font-bold text-[#1a1a1a]">
                      <span className={activity.level === 'dormant' || activity.level === 'stale' ? 'text-[#ff6b6b]' : ''}>
                        {formatRelativeTime(repo.pushed_at)}
                      </span>
                    </td>

                    {/* Metrics */}
                    <td className="py-2.5 px-2 sm:px-2.5 whitespace-nowrap font-space text-xs text-right">
                      <div className="flex items-center justify-end gap-2.5 text-[#1a1a1a] font-bold">
                        <span title="Stars" className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-[#ffcc5c] text-[#1a1a1a] stroke-[2]" />
                          <span>{repo.stargazers_count}</span>
                        </span>
                        <span title="Forks" className="flex items-center gap-1">
                          <GitFork className="w-3.5 h-3.5 text-[#1a1a1a] stroke-[2.5]" />
                          <span>{repo.forks_count}</span>
                        </span>
                        <span title="Disk size" className="text-[#666] font-medium">
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
                            className="px-2 py-1 rounded-lg text-xs font-bold font-space bg-white hover:bg-[#fffef2] text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer flex items-center gap-1"
                          >
                            <SlidersHorizontal className="w-3 h-3 stroke-[2.5]" />
                            <span className="hidden xl:inline">Inspect</span>
                          </button>
                        )}

                        {repo.fork && (
                          <>
                            {isSyncing ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-space bg-[#fffef2] text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a]">
                                <RefreshCw className="w-3 h-3 animate-spin text-[#ff6b6b] stroke-[2.5]" />
                                <span>Syncing...</span>
                              </span>
                            ) : isInSync ? (
                              <span
                                id={`repo-synced-badge-${repo.id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-space bg-[#10b981]/20 text-[#065f46] border-2 border-[#10b981] shadow-[2px_2px_0_#1a1a1a]"
                                title="Fork is in sync and up to date with upstream"
                              >
                                <Check className="w-3.5 h-3.5 text-[#065f46] stroke-[3]" />
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
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-space bg-[#ffcc5c] text-[#1a1a1a] hover:bg-[#ffbe3b] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
                              >
                                <GitFork className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Sync {forkStatus.behind_by > 0 ? `(-${forkStatus.behind_by})` : ''}</span>
                              </button>
                            ) : forkStatus?.status === 'ahead' ? (
                              <span
                                id={`repo-ahead-badge-${repo.id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-space bg-[#4ecdc4]/20 text-[#0f766e] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a]"
                                title={`Ahead of upstream by ${forkStatus.ahead_by} commits`}
                              >
                                <Check className="w-3.5 h-3.5 text-[#0f766e] stroke-[2.5]" />
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
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-space bg-[#ffcc5c] text-[#1a1a1a] hover:bg-[#ffbe3b] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
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
                          className="w-7 h-7 rounded-full border-2 border-[#1a1a1a] flex items-center justify-center bg-white hover:bg-[#ffcc5c] text-[#1a1a1a] transition shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
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
                          className="w-7 h-7 rounded-full border-2 border-[#1a1a1a] flex items-center justify-center bg-white hover:bg-[#ff6b6b] hover:text-white text-[#1a1a1a] transition shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Inline Expanded Row */}
                  {isExpanded && (
                    <tr key={`expanded-${repo.id}`} className="bg-[#fffef2]">
                      <td colSpan={9} className="p-0 border-t border-b-2 border-[#1a1a1a]">
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
          </tbody>
        </table>
      </div>

      {/* Keyboard Shortcuts Hint Bar */}
      <div className="border-t-[3px] border-[#1a1a1a] bg-[#fffef2] px-4 py-2 flex items-center justify-between text-xs font-space text-[#555] flex-wrap gap-2 select-none">
        <div className="flex items-center gap-3.5 flex-wrap">
          <span className="flex items-center gap-1 font-bold text-[#1a1a1a]">
            <kbd className="px-1.5 py-0.5 rounded bg-white border-2 border-[#1a1a1a] text-[10px] font-bold shadow-[1px_1px_0_#1a1a1a]">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white border-2 border-[#1a1a1a] text-[10px] font-bold shadow-[1px_1px_0_#1a1a1a]">↓</kbd>
            <span className="text-[11px] text-[#444] font-medium ml-0.5">Navigate</span>
          </span>
          <span className="flex items-center gap-1 font-bold text-[#1a1a1a]">
            <kbd className="px-1.5 py-0.5 rounded bg-white border-2 border-[#1a1a1a] text-[10px] font-bold shadow-[1px_1px_0_#1a1a1a]">Space</kbd>
            <span className="text-[11px] text-[#444] font-medium ml-0.5">Select / Deselect</span>
          </span>
          <span className="flex items-center gap-1 font-bold text-[#1a1a1a]">
            <kbd className="px-1.5 py-0.5 rounded bg-white border-2 border-[#1a1a1a] text-[10px] font-bold shadow-[1px_1px_0_#1a1a1a]">Enter</kbd>
            <span className="text-[11px] text-[#444] font-medium ml-0.5">Inspect Drawer</span>
          </span>
        </div>

        {highlightedIndex !== null && repos[highlightedIndex] && (
          <div className="text-[11px] font-bold text-[#1a1a1a]">
            Focused: <span className="text-[#ff6b6b] underline decoration-2">{repos[highlightedIndex].name}</span>{' '}
            <span className="text-[#777] font-normal font-mono">({highlightedIndex + 1}/{repos.length})</span>
          </div>
        )}
      </div>
    </div>
  );
}
