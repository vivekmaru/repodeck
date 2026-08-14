import { useState, useEffect } from 'react';
import { 
  GitFork, 
  GitMerge, 
  ExternalLink, 
  RefreshCw, 
  Clock,
  HardDrive,
  Trash2,
  GitCompare
} from 'lucide-react';
import { GitHubRepo, ForkSyncStatus } from '../types';
import { formatAge, formatRelativeTime, getLanguageColor, formatRepoSize } from '../utils/github';
import { api } from '../services/api';

interface ForkCardProps {
  repo: GitHubRepo;
  onSync: (repo: GitHubRepo) => Promise<boolean>;
  onDeleteClick: (repo: GitHubRepo) => void;
}

export function ForkCard({ repo, onSync, onDeleteClick }: ForkCardProps) {
  const [syncStatus, setSyncStatus] = useState<ForkSyncStatus | null>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchCompare = async () => {
    setLoadingCompare(true);
    try {
      const data = await api.forks.compare(repo.owner.login, repo.name);
      setSyncStatus(data);
    } catch (e: any) {
      setSyncStatus({
        parent_full_name: repo.parent?.full_name || 'upstream',
        parent_branch: 'main',
        fork_branch: repo.default_branch || 'main',
        status: 'error',
        behind_by: 0,
        ahead_by: 0,
        error_message: e.message,
      });
    } finally {
      setLoadingCompare(false);
    }
  };

  useEffect(() => {
    fetchCompare();
  }, [repo.id]);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    try {
      const ok = await onSync(repo);
      if (ok) {
        await fetchCompare();
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const age = formatAge(repo.created_at);
  const langColor = getLanguageColor(repo.language);
  const parentFullName = repo.parent?.full_name;

  return (
    <div 
      id={`fork-card-${repo.id}`}
      className="bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-[20px] p-5 shadow-[4px_4px_0_#1a1a1a] dark:shadow-[4px_4px_0_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1a1a1a] dark:hover:shadow-[6px_6px_0_#000000] transition flex flex-col justify-between"
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="w-6 h-6 rounded-md bg-[#4ecdc4]/20 border border-[#1a1a1a] dark:border-[#30363d] flex items-center justify-center text-[#1a1a1a] dark:text-[#f0f6fc] shrink-0">
                <GitFork className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <a
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                className="font-extrabold text-[#1a1a1a] dark:text-[#f0f6fc] hover:text-[#ff6b6b] dark:hover:text-[#ff7b72] text-base truncate flex items-center gap-1 transition"
              >
                <span>{repo.name}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70 shrink-0 stroke-[2.5]" />
              </a>

              <span className="font-space text-[10px] font-bold uppercase px-2 py-0.2 rounded border border-[#1a1a1a] dark:border-[#30363d] bg-[#fffef2] dark:bg-[#21262d] text-[#1a1a1a] dark:text-[#f0f6fc]">
                {repo.default_branch || 'main'}
              </span>
            </div>

            {/* Upstream source link */}
            <div className="mt-1.5 text-xs text-[#555] dark:text-[#8b949e] flex items-center gap-1 font-space">
              <span className="text-[#888] dark:text-[#666]">upstream:</span>
              <a
                href={repo.parent ? repo.parent.html_url : `https://github.com/${repo.full_name}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#1a1a1a] dark:text-[#f0f6fc] font-bold hover:underline truncate"
              >
                {parentFullName || 'parent repository'}
              </a>
            </div>
          </div>

          {/* Sync Status Badge */}
          <div className="shrink-0">
            {loadingCompare ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] bg-[#fffef2] dark:bg-[#21262d] text-[#1a1a1a] dark:text-[#f0f6fc] border-2 border-[#1a1a1a] dark:border-[#30363d] animate-pulse font-space font-bold shadow-[1px_1px_0_#1a1a1a]">
                <RefreshCw className="w-3 h-3 animate-spin stroke-[2.5]" />
                COMPARING...
              </span>
            ) : syncStatus?.status === 'up_to_date' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-space font-bold bg-[#10b981]/20 text-[#065f46] dark:text-[#39d353] border-2 border-[#10b981] shadow-[1px_1px_0_#1a1a1a]">
                UP TO DATE
              </span>
            ) : syncStatus?.status === 'behind' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-space font-bold bg-[#ffcc5c]/40 text-[#854d0e] dark:text-[#f0883e] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[1px_1px_0_#1a1a1a]">
                ▼ {syncStatus.behind_by} BEHIND
              </span>
            ) : syncStatus?.status === 'ahead' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-space font-bold bg-[#4ecdc4]/30 text-[#0f766e] dark:text-[#39d353] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[1px_1px_0_#1a1a1a]">
                ▲ {syncStatus.ahead_by} AHEAD
              </span>
            ) : syncStatus?.status === 'diverged' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-space font-bold bg-[#fb923c]/30 text-[#9a3412] dark:text-[#fb923c] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[1px_1px_0_#1a1a1a]">
                DIVERGED (▼{syncStatus.behind_by} ▲{syncStatus.ahead_by})
              </span>
            ) : (
              <button
                onClick={fetchCompare}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] bg-white dark:bg-[#21262d] hover:bg-[#ffcc5c] text-[#1a1a1a] dark:text-[#f0f6fc] border-2 border-[#1a1a1a] dark:border-[#30363d] font-space font-bold shadow-[1px_1px_0_#1a1a1a] cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 stroke-[2.5]" />
                RETRY
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-[#555] dark:text-[#8b949e] mt-2.5 line-clamp-2 min-h-[2rem] leading-relaxed font-normal">
          {repo.description || <span className="italic text-[#999] dark:text-[#666]">No description provided</span>}
        </p>

        {/* Meta info */}
        <div className="flex items-center gap-3 mt-3 text-xs text-[#555] dark:text-[#8b949e] font-space flex-wrap">
          {repo.language && (
            <div className="flex items-center gap-1 font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">
              <span className="w-2.5 h-2.5 rounded-full border border-black/40 dark:border-white/30" style={{ backgroundColor: langColor }} />
              <span>{repo.language}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#1a1a1a] dark:text-[#f0f6fc] stroke-[2.5]" />
            <span>Pushed {formatRelativeTime(repo.pushed_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-[#1a1a1a] dark:text-[#f0f6fc] stroke-[2.5]" />
            <span>{formatRepoSize(repo.size)}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t-2 border-dashed border-[#1a1a1a]/15 dark:border-white/10 flex items-center justify-between gap-2">
        {/* Compare diff on GitHub link */}
        {parentFullName ? (
          <a
            href={`https://github.com/${parentFullName}/compare/${repo.default_branch || 'main'}...${repo.owner.login}:${repo.name}:${repo.default_branch || 'main'}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-space font-bold text-[#1a1a1a] dark:text-[#f0f6fc] hover:text-[#ff6b6b] dark:hover:text-[#ff7b72] flex items-center gap-1.5 transition"
            title="Inspect diff comparison on GitHub"
          >
            <GitCompare className="w-4 h-4 stroke-[2.5]" />
            <span>Compare Diff</span>
          </a>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => onDeleteClick(repo)}
            title="Delete this fork"
            className="w-8 h-8 rounded-full border-2 border-[#1a1a1a] dark:border-[#30363d] flex items-center justify-center bg-white dark:bg-[#21262d] hover:bg-[#ff6b6b] hover:text-white text-[#1a1a1a] dark:text-[#f0f6fc] transition shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          <button
            id={`btn-sync-fork-${repo.id}`}
            onClick={handleSyncClick}
            disabled={isSyncing || syncStatus?.status === 'up_to_date'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-space font-bold transition border-2 border-[#1a1a1a] dark:border-[#30363d] ${
              syncStatus?.status === 'up_to_date'
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 border-neutral-300 dark:border-neutral-700 cursor-not-allowed'
                : 'bg-[#ffcc5c] dark:bg-[#f0883e] hover:bg-[#ffbe3b] text-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer'
            }`}
          >
            <GitMerge className={`w-3.5 h-3.5 stroke-[2.5] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : syncStatus?.status === 'up_to_date' ? 'Synced' : 'Fast-Forward'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
