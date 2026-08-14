import { useState } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert, KeyRound, ExternalLink } from 'lucide-react';
import { GitHubRepo } from '../types';

interface DeleteRepoModalProps {
  repo: GitHubRepo | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (repo: GitHubRepo) => Promise<{ success: boolean; error?: string } | boolean>;
  sessionScopes?: string[];
  authMethod?: string | null;
  onOpenAuthModal?: () => void;
}

export function DeleteRepoModal({
  repo,
  isOpen,
  onClose,
  onConfirmDelete,
  sessionScopes = [],
  authMethod,
  onOpenAuthModal,
}: DeleteRepoModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !repo) return null;

  const hasDeleteScope = sessionScopes.includes('delete_repo') || authMethod === 'demo';

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const res = await onConfirmDelete(repo);
      const isSuccess = typeof res === 'boolean' ? res : res.success;
      if (isSuccess) {
        onClose();
      } else {
        const errorText = typeof res === 'object' && res.error 
          ? res.error 
          : 'Failed to delete repository. Your GitHub token likely lacks the "delete_repo" scope.';
        setErrorMessage(errorText);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while deleting repository.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div id="delete-repo-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div 
        id="delete-repo-modal"
        className="w-full max-w-lg bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-[24px] shadow-[8px_8px_0_#1a1a1a] dark:shadow-[8px_8px_0_#000000] overflow-hidden flex flex-col text-[#1a1a1a] dark:text-[#f0f6fc] transition"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-[#1a1a1a] dark:border-[#30363d] bg-[#ff6b6b]/15 dark:bg-[#ff7b72]/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff6b6b] border-2 border-[#1a1a1a] dark:border-[#30363d] flex items-center justify-center text-white shadow-[2px_2px_0_#1a1a1a] shrink-0">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-[#1a1a1a] dark:text-[#f0f6fc] leading-none">Delete Repository</h3>
              <p className="font-space text-[10px] font-bold text-[#9f1239] dark:text-[#ff7b72] uppercase tracking-wide mt-1">Permanent Destructive Action</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] flex items-center justify-center text-[#1a1a1a] dark:text-[#f0f6fc] hover:bg-[#fffef2] dark:hover:bg-[#30363d] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-[#fffef2] dark:bg-[#0d1117] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a] space-y-2">
            <p className="text-[#333] dark:text-[#8b949e] leading-relaxed font-medium">
              This action <strong className="text-[#ff6b6b] dark:text-[#ff7b72] underline decoration-2">CANNOT</strong> be undone. This will permanently delete the{' '}
              <span className="font-space font-bold text-[#1a1a1a] dark:text-[#f0f6fc] bg-white dark:bg-[#21262d] border border-[#1a1a1a] dark:border-[#30363d] px-1.5 py-0.5 rounded shadow-[1px_1px_0_#1a1a1a]">
                {repo.full_name}
              </span>{' '}
              repository from GitHub, including all branches, commits, releases, issues, comments, and webhooks.
            </p>
          </div>

          {/* Token Scope Warning if delete_repo is missing */}
          {!hasDeleteScope && (
            <div className="p-3.5 rounded-xl bg-[#ffcc5c]/25 dark:bg-[#f0883e]/20 border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a] space-y-2">
              <div className="flex items-center gap-2 text-[#92400e] dark:text-[#f0883e] font-bold text-xs">
                <KeyRound className="w-4 h-4 stroke-[2.5]" />
                <span>Missing <code className="font-space font-extrabold bg-white dark:bg-[#21262d] px-1.5 py-0.5 rounded border border-[#1a1a1a] dark:border-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc]">delete_repo</code> Token Scope</span>
              </div>
              <p className="text-[#451a03] dark:text-[#8b949e] text-[11px] leading-relaxed font-medium">
                Your current GitHub token only has <code className="font-space font-bold text-[#1a1a1a] dark:text-[#f0f6fc] bg-white dark:bg-[#21262d] px-1 rounded">{sessionScopes.length > 0 ? sessionScopes.join(', ') : 'no scopes'}</code>. GitHub requires the explicit <strong>delete_repo</strong> scope to delete repositories via API.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,delete_repo,read:user&description=RepoDeck+Manager"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#21262d] hover:bg-[#fffef2] dark:hover:bg-[#30363d] border-2 border-[#1a1a1a] dark:border-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] font-space font-bold text-[11px] shadow-[1px_1px_0_#1a1a1a]"
                >
                  <span>Generate Classic PAT with delete_repo</span>
                  <ExternalLink className="w-3 h-3 stroke-[2.5]" />
                </a>
                {onOpenAuthModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuthModal();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#4ecdc4] dark:bg-[#39d353] hover:bg-[#38b2ac] border-2 border-[#1a1a1a] dark:border-[#30363d] text-[#1a1a1a] font-space font-bold text-[11px] shadow-[1px_1px_0_#1a1a1a] cursor-pointer"
                  >
                    <span>Update Connected Token</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Deletion Error Output */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-[#ff6b6b]/15 dark:bg-[#ff7b72]/15 border-2 border-[#ff6b6b] dark:border-[#ff7b72] text-[#9f1239] dark:text-[#ff7b72] space-y-2 font-space">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 stroke-[2.5]" />
                <span>Deletion Error from GitHub</span>
              </div>
              <p className="text-[11px] font-medium leading-relaxed bg-white/70 dark:bg-[#0d1117]/70 p-2 rounded-lg border border-[#ff6b6b]/40">
                {errorMessage}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-dashed border-[#1a1a1a]/15 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#21262d] hover:bg-[#fffef2] dark:hover:bg-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] font-space font-bold text-xs border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-confirm-delete-action"
              disabled={isDeleting}
              onClick={handleDelete}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff6b6b] hover:bg-[#fa5252] disabled:opacity-50 disabled:cursor-not-allowed text-white font-space font-bold text-xs border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[3px_3px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4 stroke-[2.5]" />
              <span>{isDeleting ? 'Deleting Repository...' : 'I understand, delete repository'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
