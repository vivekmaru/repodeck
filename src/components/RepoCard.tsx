import { 
  GitFork, 
  Star, 
  ExternalLink, 
  Trash2, 
  Archive, 
  ArchiveRestore,
  SlidersHorizontal,
  Check,
  RefreshCw
} from 'lucide-react';
import { GitHubRepo, ForkSyncStatus } from '../types';
import { formatAge, formatRelativeTime, getActivityLevel, formatRepoSize, getLanguageColor } from '../utils/github';

interface RepoCardProps {
  repo: GitHubRepo;
  isSelected?: boolean;
  onToggleSelect?: (id: number) => void;
  onDeleteClick: (repo: GitHubRepo) => void;
  onArchiveToggle: (repo: GitHubRepo, newArchivedState: boolean) => Promise<void>;
  onSyncClick?: (repo: GitHubRepo) => void;
  onDirectSync?: (repo: GitHubRepo) => Promise<boolean | void>;
  forkSyncStatus?: ForkSyncStatus;
  isSyncing?: boolean;
  onOpenDrawer?: (repo: GitHubRepo) => void;
}

export function RepoCard({
  repo,
  isSelected,
  onToggleSelect,
  onDeleteClick,
  onArchiveToggle,
  onSyncClick,
  onDirectSync,
  forkSyncStatus,
  isSyncing,
  onOpenDrawer,
}: RepoCardProps) {
  const age = formatAge(repo.created_at);
  const activity = getActivityLevel(repo.pushed_at, repo.created_at);
  const langColor = getLanguageColor(repo.language);
  const isInSync = forkSyncStatus?.status === 'up_to_date' || (forkSyncStatus && forkSyncStatus.behind_by === 0);

  // Activity styling tags for playful design
  const activityTagStyles: Record<string, string> = {
    active: 'bg-[#10b981]/20 text-[#065f46] border-[#10b981]',
    warm: 'bg-[#4ecdc4]/25 text-[#115e59] border-[#4ecdc4]',
    cool: 'bg-[#ffcc5c]/30 text-[#854d0e] border-[#ffcc5c]',
    stale: 'bg-[#fb923c]/25 text-[#9a3412] border-[#fb923c]',
    dormant: 'bg-[#ff6b6b]/20 text-[#9f1239] border-[#ff6b6b]',
  };

  const activityStyle = activityTagStyles[activity.level] || 'bg-neutral-100 text-neutral-800 border-[#1a1a1a]';

  return (
    <div 
      id={`repo-card-${repo.id}`}
      className={`group bg-white border-[3px] border-[#1a1a1a] rounded-[20px] p-5 shadow-[4px_4px_0_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1a1a1a] transition-all duration-150 flex flex-col justify-between ${
        isSelected ? 'ring-4 ring-[#ffcc5c] bg-[#fffef7]' : repo.archived ? 'opacity-80 bg-neutral-50' : ''
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5 min-w-0">
            {onToggleSelect && (
              <input
                type="checkbox"
                checked={Boolean(isSelected)}
                onChange={() => onToggleSelect(repo.id)}
                aria-label={`Select repo ${repo.name}`}
                className="mt-1 w-4 h-4 rounded border-2 border-[#1a1a1a] text-[#1a1a1a] focus:ring-0 cursor-pointer shrink-0 accent-[#1a1a1a]"
              />
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-extrabold text-[#1a1a1a] hover:text-[#ff6b6b] text-base truncate flex items-center gap-1.5 transition"
                >
                  <span className="truncate">{repo.name}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition shrink-0 stroke-[2.5]" />
                </a>
              </div>

              {/* Fork upstream reference */}
              {repo.fork && repo.parent && (
                <div className="text-[11px] text-[#666] font-space mt-1 flex items-center gap-1 truncate">
                  <span>fork of:</span>
                  <a
                    href={repo.parent.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#1a1a1a] font-bold hover:underline truncate"
                  >
                    {repo.parent.full_name}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Activity Badge */}
          <div className="shrink-0">
            <span 
              className={`font-space text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border-2 ${activityStyle}`}
              title={activity.description}
            >
              {activity.label}
            </span>
          </div>
        </div>

        {/* Badges / Meta tags row */}
        <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
          <span className={`font-space text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-[#1a1a1a] ${
            repo.private 
              ? 'bg-[#ffcc5c]/30 text-[#854d0e]' 
              : 'bg-[#fffef2] text-[#1a1a1a]'
          }`}>
            {repo.private ? 'Private' : 'Public'}
          </span>

          {repo.fork && (
            <>
              <span className="font-space text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-[#1a1a1a] bg-[#4ecdc4]/20 text-[#0f766e]">
                Fork
              </span>
              {isInSync && (
                <span className="font-space text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-[#10b981] bg-[#10b981]/20 text-[#065f46] inline-flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  In Sync
                </span>
              )}
            </>
          )}

          {repo.archived && (
            <span className="font-space text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-[#1a1a1a] bg-neutral-200 text-[#555]">
              Archived
            </span>
          )}

          {repo.language && (
            <span className="font-space text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-[#1a1a1a] bg-white text-[#1a1a1a] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full border border-black/40" style={{ backgroundColor: langColor }} />
              <span>{repo.language}</span>
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-[#555] mt-2.5 line-clamp-2 min-h-[2rem] leading-relaxed font-normal">
          {repo.description || <span className="italic text-[#999]">No description provided</span>}
        </p>

        {/* Topics */}
        {repo.topics && repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {repo.topics.slice(0, 3).map((topic) => (
              <span 
                key={topic} 
                className="text-[10px] font-space font-semibold px-2 py-0.5 bg-[#fffef2] text-[#1a1a1a] border border-[#1a1a1a]/60 rounded-md"
              >
                #{topic}
              </span>
            ))}
            {repo.topics.length > 3 && (
              <span className="text-[10px] font-space font-bold text-[#666] self-center">
                +{repo.topics.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Metrics & Actions */}
      <div className="mt-4 pt-3 border-t-2 border-dashed border-[#1a1a1a]/15 space-y-3 font-space text-xs">
        {/* Telemetry Row */}
        <div className="flex items-center justify-between text-[#555]">
          <div className="flex items-center gap-2">
            <span title="Repository age" className="font-bold text-[#1a1a1a]">
              {age.label} old
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-bold text-[#1a1a1a]" title="Stars">
              <Star className="w-3.5 h-3.5 fill-[#ffcc5c] text-[#1a1a1a] stroke-[2]" />
              <span>{repo.stargazers_count}</span>
            </span>
            <span className="flex items-center gap-1 font-bold text-[#1a1a1a]" title="Forks">
              <GitFork className="w-3.5 h-3.5 text-[#1a1a1a] stroke-[2.5]" />
              <span>{repo.forks_count}</span>
            </span>
            <span className="text-[#666]" title="Disk space">
              {formatRepoSize(repo.size)}
            </span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-[11px] text-[#666] truncate" title={`Pushed: ${new Date(repo.pushed_at).toLocaleString()}`}>
            Active {formatRelativeTime(repo.pushed_at)}
          </span>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenDrawer && (
              <button
                onClick={() => onOpenDrawer(repo)}
                className="w-8 h-8 rounded-full border-2 border-[#1a1a1a] flex items-center justify-center bg-white hover:bg-[#4ecdc4] text-[#1a1a1a] transition shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                title="Inspect repository details & contributors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}

            {repo.fork && (
              <>
                {isSyncing ? (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold font-space bg-[#fffef2] text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] inline-flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin text-[#ff6b6b] stroke-[2.5]" />
                    <span>Syncing...</span>
                  </span>
                ) : isInSync ? (
                  <span
                    id={`card-synced-badge-${repo.id}`}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold font-space bg-[#10b981]/20 text-[#065f46] border-2 border-[#10b981] shadow-[2px_2px_0_#1a1a1a] inline-flex items-center gap-1"
                    title="Fork is in sync and up to date with upstream"
                  >
                    <Check className="w-3.5 h-3.5 text-[#065f46] stroke-[3]" />
                    <span>Synced</span>
                  </span>
                ) : forkSyncStatus?.status === 'behind' ? (
                  <button
                    id={`card-sync-btn-${repo.id}`}
                    onClick={() => {
                      if (onDirectSync) onDirectSync(repo);
                      else if (onSyncClick) onSyncClick(repo);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold font-space bg-[#ffcc5c] hover:bg-[#ffbe3b] text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer inline-flex items-center gap-1"
                    title={`Fast-forward ${forkSyncStatus.behind_by} commits behind upstream`}
                  >
                    <GitFork className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Sync {forkSyncStatus.behind_by > 0 ? `(-${forkSyncStatus.behind_by})` : ''}</span>
                  </button>
                ) : onSyncClick ? (
                  <button
                    id={`card-sync-btn-${repo.id}`}
                    onClick={() => {
                      if (onDirectSync) onDirectSync(repo);
                      else onSyncClick(repo);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold font-space bg-[#ffcc5c] hover:bg-[#ffbe3b] text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
                  >
                    Sync
                  </button>
                ) : null}
              </>
            )}

            <button
              onClick={() => onArchiveToggle(repo, !repo.archived)}
              className="w-8 h-8 rounded-full border-2 border-[#1a1a1a] flex items-center justify-center bg-white hover:bg-[#ffcc5c] text-[#1a1a1a] transition shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              title={repo.archived ? 'Unarchive repository' : 'Archive repository'}
            >
              {repo.archived ? (
                <ArchiveRestore className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <Archive className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </button>

            <button
              onClick={() => onDeleteClick(repo)}
              className="w-8 h-8 rounded-full border-2 border-[#1a1a1a] flex items-center justify-center bg-white hover:bg-[#ff6b6b] hover:text-white text-[#1a1a1a] transition shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              title="Delete repository"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

