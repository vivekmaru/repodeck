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
      const res = await fetch(`/api/github/forks/${repo.owner.login}/${repo.name}/compare`);
      if (res.ok) {
        const data = await res.json();
        setSyncStatus(data);
      } else {
        setSyncStatus({
          parent_full_name: repo.parent?.full_name || 'upstream',
          parent_branch: 'main',
          fork_branch: repo.default_branch || 'main',
          status: 'error',
          behind_by: 0,
          ahead_by: 0,
          error_message: 'Could not compare with upstream automatically',
        });
      }
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
      className="bg-white border-[3px] border-[#1a1a1a] rounded-[20px] p-5 shadow-[4px_4px_0_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1a1a1a] transition flex flex-col justify-between"
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="w-6 h-6 rounded-md bg-[#4ecdc4]/20 border border-[#1a1a1a] flex items-center justify-center text-[#1a1a1a] shrink-0">
                <GitFork className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <a
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                className="font-extrabold text-[#1a1a1a] hover:text-[#ff6b6b] text-base truncate flex items-center gap-1 transition"
              >
                <span>{repo.name}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70 shrink-0 stroke-[2.5]" />
              </a>

              <span className="font-space text-[10px] font-bold uppercase px-2 py-0.2 rounded border border-[#1a1a1a] bg-[#fffef2] text-[#1a1a1a]">
                {repo.default_branch || 'main'}
              </span>
            </div>

            {/* Upstream source link */}
            <div className="mt-1.5 text-xs text-[#555] flex items-center gap-1 font-space">
              <span className="text-[#888]">upstream:</span>
              <a
                href={repo.parent ? repo.parent.html_url : `https://github.com/${repo.full_name}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#1a1a1a] font-bold hover:underline truncate"
              >
                {parentFullName || 'parent repository'}
              </a>
            </div>
          </div>

          {/* Sync Status Badge */}
          <div className="shrink-0">
            {loadingCompare ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] bg-[#fffef2] text-[#1a1a1a] border-2 border-[#1a1a1a] animate-pulse font-space font-bold shadow-[1px_1px_0_#1a1a1a]">
                <RefreshCw className="w-3 h-3 animate-spin stroke-[2.5]" />
                COMPARING...
              </span>
            ) : syncStatus?.status === 'up_to_date' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-space font-bold bg-[#10b981]/20 text-[#065f46] border-2 border-[#10b981] shadow-[1px_1px_0_#1a1a1a]">
                UP TO DATE
              </span>
            ) : syncStatus?.status === 'behind' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-space font-bold bg-[#ffcc5c]/40 text-[#854d0e] border-2 border-[#1a1a1a] shadow-[1px_1px_0_#1a1a1a]">
                ▼ {syncStatus.behind_by} BEHIND
              </span>
            ) : syncStatus?.status === 'ahead' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-space font-bold bg-[#4ecdc4]/30 text-[#0f766e] border-2 border-[#1a1a1a] shadow-[1px_1px_0_#1a1a1a]">
                ▲ {syncStatus.ahead_by} AHEAD
              </span>
            ) : syncStatus?.status === 'diverged' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-space font-bold bg-[#fb923c]/30 text-[#9a3412] border-2 border-[#1a1a1a] shadow-[1px_1px_0_#1a1a1a]">
                DIVERGED (▼{syncStatus.behind_by} ▲{syncStatus.ahead_by})
              </span>
            ) : (
              <button
                onClick={fetchCompare}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] bg-white hover:bg-[#ffcc5c] text-[#1a1a1a] border-2 border-[#1a1a1a] font-space font-bold shadow-[1px_1px_0_#1a1a1a] cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 stroke-[2.5]" />
                RETRY
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-[#555] mt-2.5 line-clamp-2 min-h-[2rem] leading-relaxed font-normal">
          {repo.description || <span className="italic text-[#999]">No description provided</span>}
        </p>

        {/* Meta info */}
        <div className="flex items-center gap-3 mt-3 text-xs text-[#555] font-space flex-wrap">
          {repo.language && (
            <div className="flex items-center gap-1 font-bold text-[#1a1a1a]">
              <span className="w-2.5 h-2.5 rounded-full border border-black/40" style={{ backgroundColor: langColor }} />
              <span>{repo.language}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#1a1a1a] stroke-[2.5]" />
            <span>Pushed {formatRelativeTime(repo.pushed_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-[#1a1a1a] stroke-[2.5]" />
            <span>{formatRepoSize(repo.size)}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t-2 border-dashed border-[#1a1a1a]/15 flex items-center justify-between gap-2">
        {/* Compare diff on GitHub link */}
        {parentFullName ? (
          <a
            href={`https://github.com/${parentFullName}/compare/${repo.default_branch || 'main'}...${repo.owner.login}:${repo.name}:${repo.default_branch || 'main'}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-space font-bold text-[#1a1a1a] hover:text-[#ff6b6b] flex items-center gap-1.5 transition"
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
            className="w-8 h-8 rounded-full border-2 border-[#1a1a1a] flex items-center justify-center bg-white hover:bg-[#ff6b6b] hover:text-white text-[#1a1a1a] transition shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          <button
            id={`btn-sync-fork-${repo.id}`}
            onClick={handleSyncClick}
            disabled={isSyncing || syncStatus?.status === 'up_to_date'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-space font-bold transition border-2 border-[#1a1a1a] ${
              syncStatus?.status === 'up_to_date'
                ? 'bg-neutral-100 text-neutral-400 border-neutral-300 cursor-not-allowed'
                : 'bg-[#ffcc5c] hover:bg-[#ffbe3b] text-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer'
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

