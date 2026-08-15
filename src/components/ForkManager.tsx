import { useState, useMemo } from 'react';
import { GitFork, RefreshCw, GitMerge, Search, ArrowUpDown, X, Filter } from 'lucide-react';
import { GitHubRepo } from '../types';
import { ForkCard } from './ForkCard';

interface ForkManagerProps {
  forks: GitHubRepo[];
  onSyncFork: (repo: GitHubRepo) => Promise<boolean>;
  onDeleteClick: (repo: GitHubRepo) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function ForkManager({
  forks,
  onSyncFork,
  onDeleteClick,
  onRefresh,
  loading,
}: ForkManagerProps) {
  const [batchSyncing, setBatchSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [driftFilter, setDriftFilter] = useState<'all' | 'behind' | 'in_sync' | 'ahead'>('all');
  const [sortOrder, setSortOrder] = useState<'behind_desc' | 'pushed_desc' | 'name_asc' | 'stars_desc'>('behind_desc');

  const filteredForks = useMemo(() => {
    return forks
      .filter((fork) => {
        const q = search.toLowerCase().trim();
        const matchesSearch =
          !q ||
          fork.name.toLowerCase().includes(q) ||
          fork.full_name.toLowerCase().includes(q) ||
          (fork.parent?.full_name && fork.parent.full_name.toLowerCase().includes(q)) ||
          (fork.language && fork.language.toLowerCase().includes(q)) ||
          (fork.description && fork.description.toLowerCase().includes(q));

        if (!matchesSearch) return false;

        if (driftFilter === 'behind') {
          return (fork.behind_by && fork.behind_by > 0) || fork.drift_status === 'behind';
        }
        if (driftFilter === 'in_sync') {
          return fork.drift_status === 'up_to_date' || (!fork.behind_by && !fork.ahead_by);
        }
        if (driftFilter === 'ahead') {
          return (fork.ahead_by && fork.ahead_by > 0) || fork.drift_status === 'ahead';
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'behind_desc') {
          return (b.behind_by || 0) - (a.behind_by || 0);
        }
        if (sortOrder === 'pushed_desc') {
          return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
        }
        if (sortOrder === 'stars_desc') {
          return (b.stargazers_count || 0) - (a.stargazers_count || 0);
        }
        if (sortOrder === 'name_asc') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [forks, search, driftFilter, sortOrder]);

  const handleSyncAll = async () => {
    if (forks.length === 0 || batchSyncing) return;
    setBatchSyncing(true);
    try {
      for (const fork of forks) {
        await onSyncFork(fork);
      }
      onRefresh();
    } finally {
      setBatchSyncing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header Control Strip */}
      <div className="bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[6px_6px_0_#1a1a1a] dark:shadow-[6px_6px_0_#000000] transition">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-xl bg-[#4ecdc4] dark:bg-[#39d353] flex items-center justify-center -rotate-2 shadow-[3px_3px_0_#1a1a1a] shrink-0">
            <GitFork className="w-6 h-6 text-[#1a1a1a] stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1a1a1a] dark:text-[#f0f6fc] leading-none">
                Fork Upstream Sync Hub
              </h2>
              <span className="font-space text-xs font-bold px-2 py-0.5 rounded-md bg-[#fffef2] dark:bg-[#21262d] text-[#1a1a1a] dark:text-[#f0f6fc] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[1px_1px_0_#1a1a1a]">
                {forks.length} {forks.length === 1 ? 'FORK' : 'FORKS'}
              </span>
            </div>
            <p className="text-xs text-[#555] dark:text-[#8b949e] font-medium mt-1">
              Live branch comparison and 1-click fast-forward merge via GitHub merge-upstream API.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {forks.length > 0 && (
            <button
              onClick={handleSyncAll}
              disabled={batchSyncing || loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ffcc5c] dark:bg-[#f0883e] hover:bg-[#ffbe3b] text-[#1a1a1a] border-2 border-[#1a1a1a] dark:border-[#30363d] text-xs font-space font-bold shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition shrink-0 cursor-pointer"
              title="Iterate over all forks and merge upstream default branch"
            >
              <GitMerge className={`w-4 h-4 stroke-[2.5] ${batchSyncing ? 'animate-spin' : ''}`} />
              <span>{batchSyncing ? 'Syncing All...' : 'Sync All Forks'}</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#21262d] hover:bg-[#fffef2] dark:hover:bg-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] text-xs font-space font-bold border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition shrink-0 cursor-pointer"
            title="Re-fetch fork metadata from GitHub"
          >
            <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar for Forks */}
      {forks.length > 0 && (
        <div className="bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-2xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-[4px_4px_0_#1a1a1a]">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1a1a1a] dark:text-[#f0f6fc] stroke-[2.5]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search forks by repo name, upstream or stack..."
              className="w-full pl-9 pr-8 py-2 bg-[#fffef2] dark:bg-[#0d1117] border-2 border-[#1a1a1a] dark:border-[#30363d] rounded-xl text-xs font-bold text-[#1a1a1a] dark:text-[#f0f6fc] placeholder:text-[#888] dark:placeholder:text-[#666] focus:outline-none shadow-[2px_2px_0_#1a1a1a]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#1a1a1a] dark:text-[#f0f6fc] hover:text-[#ff6b6b]"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Drift Status Filter */}
            <select
              value={driftFilter}
              onChange={(e) => setDriftFilter(e.target.value as any)}
              className="bg-[#fffef2] dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] font-space font-bold text-xs rounded-xl px-3 py-2 focus:outline-none shadow-[2px_2px_0_#1a1a1a] cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="behind">⚠️ Behind Upstream</option>
              <option value="in_sync">✓ In Sync</option>
              <option value="ahead">🚀 Ahead of Upstream</option>
            </select>

            {/* Sort Selector */}
            <div className="flex items-center bg-[#fffef2] dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] rounded-xl px-3 shadow-[2px_2px_0_#1a1a1a]">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#1a1a1a] dark:text-[#f0f6fc] mr-1.5 shrink-0 stroke-[2.5]" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-transparent border-0 text-[#1a1a1a] dark:text-[#f0f6fc] text-xs font-bold py-2 focus:outline-none font-space cursor-pointer"
              >
                <option value="behind_desc">⚠️ Most Behind</option>
                <option value="pushed_desc">🕒 Recent Push</option>
                <option value="stars_desc">⭐ Most Stars</option>
                <option value="name_asc">🔤 Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Fork Content View */}
      {filteredForks.length === 0 ? (
        <div className="bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-2xl p-12 text-center space-y-3 shadow-[6px_6px_0_#1a1a1a] dark:shadow-[6px_6px_0_#000000]">
          <div className="w-14 h-14 rounded-2xl bg-[#fffef2] dark:bg-[#21262d] border-[3px] border-[#1a1a1a] dark:border-[#30363d] flex items-center justify-center text-[#1a1a1a] dark:text-[#f0f6fc] mx-auto shadow-[3px_3px_0_#1a1a1a]">
            <GitFork className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h3 className="font-heading text-xl font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">
            {forks.length === 0 ? 'No forked repositories found' : 'No forks match your search or filter'}
          </h3>
          <p className="text-xs text-[#555] dark:text-[#8b949e] max-w-sm mx-auto font-medium">
            {forks.length === 0
              ? 'When you fork repositories on GitHub, they will automatically appear here with upstream drift counters.'
              : 'Try clearing your search query or selecting a different status filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredForks.map((fork) => (
            <ForkCard
              key={fork.id}
              repo={fork}
              onSync={onSyncFork}
              onDeleteClick={onDeleteClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
