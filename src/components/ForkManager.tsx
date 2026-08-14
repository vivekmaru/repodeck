import { useState } from 'react';
import { GitFork, RefreshCw, GitMerge } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Top Header Control Strip */}
      <div className="bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[6px_6px_0_#1a1a1a] dark:shadow-[6px_6px_0_#000000] transition">
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

      {/* Fork Content View */}
      {forks.length === 0 ? (
        <div className="bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-2xl p-12 text-center space-y-3 shadow-[6px_6px_0_#1a1a1a] dark:shadow-[6px_6px_0_#000000]">
          <div className="w-14 h-14 rounded-2xl bg-[#fffef2] dark:bg-[#21262d] border-[3px] border-[#1a1a1a] dark:border-[#30363d] flex items-center justify-center text-[#1a1a1a] dark:text-[#f0f6fc] mx-auto shadow-[3px_3px_0_#1a1a1a]">
            <GitFork className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h3 className="font-heading text-xl font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">No forked repositories found</h3>
          <p className="text-xs text-[#555] dark:text-[#8b949e] max-w-sm mx-auto font-medium">
            When you fork repositories on GitHub, they will automatically appear here with upstream drift counters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forks.map((fork) => (
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
