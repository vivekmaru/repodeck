import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  ShieldAlert, 
  Loader2, 
  GitFork,
  ExternalLink 
} from 'lucide-react';
import { GitHubRepo } from '../types';

interface BatchDeleteModalProps {
  repos: GitHubRepo[];
  isOpen: boolean;
  onClose: () => void;
  onConfirmBatchDelete: (repos: GitHubRepo[]) => Promise<{ succeeded: number; failed: number }>;
  sessionScopes?: string[];
  authMethod?: 'oauth' | 'pat' | 'demo';
  onOpenAuthModal?: () => void;
}

export function BatchDeleteModal({
  repos,
  isOpen,
  onClose,
  onConfirmBatchDelete,
  sessionScopes = [],
  authMethod,
  onOpenAuthModal,
}: BatchDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || repos.length === 0) return null;

  const hasDeleteScope = sessionScopes.includes('delete_repo') || authMethod === 'demo';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirmBatchDelete(repos);
      setIsDeleting(false);
      onClose();
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        id="batch-delete-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={isDeleting ? undefined : onClose}
      >
        <motion.div
          id="batch-delete-modal-dialog"
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#fffef2] dark:bg-[#161b22] border-3 border-[#1a1a1a] dark:border-[#30363d] shadow-[8px_8px_0_#1a1a1a] dark:shadow-[8px_8px_0_#000000] text-[#1a1a1a] dark:text-[#f0f6fc] transition"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b-3 border-[#1a1a1a] dark:border-[#30363d] bg-[#ff6b6b]/15 dark:bg-[#ff7b72]/15">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#ff6b6b] text-white border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a]">
                <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-extrabold text-[#1a1a1a] dark:text-[#f0f6fc]">
                  Batch Delete Repositories
                </h3>
                <p className="text-[11px] font-space font-bold uppercase tracking-wider text-[#ff6b6b] dark:text-[#ff7b72]">
                  Permanent Destructive Action ({repos.length} Selected)
                </p>
              </div>
            </div>
            {!isDeleting && (
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 rounded-lg border-2 border-[#1a1a1a] dark:border-[#30363d] bg-white dark:bg-[#21262d] hover:bg-[#ffcc5c] dark:hover:bg-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>

          <div className="p-6 space-y-4">
            {/* Warning Message Box */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#0d1117] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a] space-y-2">
              <p className="text-xs text-[#1a1a1a] dark:text-[#8b949e] leading-relaxed font-semibold">
                This action <strong className="text-[#ff6b6b] dark:text-[#ff7b72] font-black underline uppercase">CANNOT</strong> be undone. This will permanently remove <strong className="font-space font-bold bg-[#ffcc5c]/30 dark:bg-[#f0883e]/30 px-1 py-0.5 rounded border border-[#1a1a1a] dark:border-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc]">{repos.length} selected repositories</strong> from GitHub, including all branches, commits, releases, issues, comments, and webhooks.
              </p>
            </div>

            {/* Missing Delete Permission Warning */}
            {!hasDeleteScope && (
              <div className="p-3.5 rounded-xl bg-[#ffcc5c]/25 dark:bg-[#f0883e]/20 border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#854d0e] dark:text-[#f0883e]">
                  <ShieldAlert className="w-4 h-4 shrink-0 stroke-[2.5]" />
                  <span>Missing `delete_repo` OAuth Permission</span>
                </div>
                <p className="text-[11px] text-[#555] dark:text-[#8b949e] font-medium leading-normal">
                  Your current session may not have administrative permissions to delete repositories on GitHub.
                </p>
                {onOpenAuthModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuthModal();
                    }}
                    className="mt-1 text-[11px] font-space font-bold text-[#1a1a1a] dark:text-[#f0f6fc] underline hover:text-[#ff6b6b] cursor-pointer"
                  >
                    Update token / OAuth scopes &rarr;
                  </button>
                )}
              </div>
            )}

            {/* List of Repositories to Delete */}
            <div className="space-y-1.5">
              <label className="block text-[#1a1a1a] dark:text-[#f0f6fc] font-bold text-xs">
                Repositories to be deleted ({repos.length}):
              </label>
              <div className="max-h-40 overflow-y-auto rounded-xl border-2 border-[#1a1a1a] dark:border-[#30363d] bg-white dark:bg-[#0d1117] divide-y divide-[#1a1a1a]/10 dark:divide-white/10 p-1">
                {repos.map((repo) => (
                  <div key={repo.id} className="flex items-center justify-between px-3 py-1.5 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {repo.fork ? (
                        <GitFork className="w-3.5 h-3.5 text-[#1a1a1a] dark:text-[#f0f6fc] shrink-0" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-[#ff6b6b] shrink-0" />
                      )}
                      <span className="font-space font-bold text-[#1a1a1a] dark:text-[#f0f6fc] truncate">
                        {repo.full_name}
                      </span>
                    </div>
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#666] dark:text-[#8b949e] hover:text-[#1a1a1a] dark:hover:text-white shrink-0 ml-2"
                      title="Open on GitHub"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress indicator during delete */}
            {isDeleting && (
              <div className="p-3.5 rounded-xl bg-[#fffef2] dark:bg-[#0d1117] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold font-space">
                  <span className="flex items-center gap-2 text-[#1a1a1a] dark:text-[#f0f6fc]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#ff6b6b]" />
                    Deleting repositories in batch...
                  </span>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-dashed border-[#1a1a1a]/15 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#21262d] hover:bg-[#fffef2] dark:hover:bg-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] font-space font-bold text-xs border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-batch-delete"
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff6b6b] hover:bg-[#fa5252] disabled:opacity-50 disabled:cursor-not-allowed text-white font-space font-bold text-xs border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[3px_3px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {isDeleting 
                    ? 'Deleting Repositories...' 
                    : `I understand, delete ${repos.length} repositories`}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
