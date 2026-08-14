import { useState, useRef, useEffect } from 'react';
import { 
  Archive, 
  GitFork, 
  X, 
  Download, 
  CheckSquare, 
  Trash2, 
  ChevronUp,
  FileSpreadsheet,
  FileCode2,
  MoreHorizontal
} from 'lucide-react';

interface BatchActionBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onBatchArchive: () => void;
  onBatchDelete: () => void;
  onBatchSyncForks?: () => void;
  onExportSelected: (format: 'json' | 'csv') => void;
  forksSelectedCount: number;
}

export function BatchActionBar({
  selectedCount,
  totalCount,
  onClearSelection,
  onBatchArchive,
  onBatchDelete,
  onBatchSyncForks,
  onExportSelected,
  forksSelectedCount,
}: BatchActionBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [desktopExportOpen, setDesktopExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setDesktopExportOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setDesktopExportOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (selectedCount === 0) return null;

  // Compute total available actions
  const hasSyncAction = forksSelectedCount > 0 && Boolean(onBatchSyncForks);
  // Total actions = Archive (1) + Delete (2) + Export JSON (3) + Export CSV (4) + [Sync Forks (5)]
  const totalActionCount = 4 + (hasSyncAction ? 1 : 0);
  const isMoreThanThreeActions = totalActionCount > 3;

  return (
    <div
      id="batch-action-bar"
      className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-1.5rem)] sm:w-auto max-w-2xl bg-white border-[3px] border-[#1a1a1a] rounded-2xl p-3 sm:px-5 sm:py-3.5 shadow-[6px_6px_0_#1a1a1a] sm:shadow-[8px_8px_0_#1a1a1a] animate-in slide-in-from-bottom-4 duration-200"
    >
      {/* ========================================================================= */}
      {/* MOBILE LAYOUT (< 640px) */}
      {/* ========================================================================= */}
      <div className="flex sm:hidden flex-col gap-2.5">
        {/* Mobile Header: Count + Dropdown/Stack Toggle + Dismiss */}
        <div className="flex items-center justify-between gap-2 border-b-2 border-[#1a1a1a]/10 pb-2">
          {/* Selected Count Indicator */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-[#4ecdc4] border-2 border-[#1a1a1a] flex items-center justify-center text-[#1a1a1a] shadow-[1px_1px_0_#1a1a1a] shrink-0">
              <CheckSquare className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="font-space text-xs text-[#1a1a1a] font-bold truncate">
              {selectedCount} <span className="text-[#666] font-normal">of {totalCount} sel.</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* When more than 3 actions, show dropdown menu toggle */}
            {isMoreThanThreeActions && (
              <div className="relative" ref={dropdownRef}>
                <button
                  id="btn-mobile-more-actions"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-space font-bold border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer ${
                    dropdownOpen ? 'bg-[#ffcc5c] text-[#1a1a1a]' : 'bg-[#fffef2] text-[#1a1a1a] hover:bg-[#ffcc5c]'
                  }`}
                  aria-expanded={dropdownOpen}
                  aria-label="Toggle batch actions menu"
                >
                  <MoreHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Actions ({totalActionCount})</span>
                  <ChevronUp className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Mobile Dropdown Menu (Opens Upwards to avoid off-screen overflow) */}
                {dropdownOpen && (
                  <div
                    id="mobile-batch-dropdown-menu"
                    className="absolute bottom-full right-0 mb-3 w-56 bg-white border-[3px] border-[#1a1a1a] rounded-xl shadow-[5px_5px_0_#1a1a1a] p-1.5 space-y-1 z-50 animate-in fade-in zoom-in-95"
                  >
                    <div className="px-2.5 py-1 border-b border-[#1a1a1a]/15 text-[10px] font-space font-extrabold uppercase text-[#777]">
                      Batch Operations
                    </div>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onBatchArchive();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-space font-bold text-[#1a1a1a] hover:bg-[#ffcc5c] text-left transition"
                    >
                      <Archive className="w-4 h-4 stroke-[2.5] text-[#1a1a1a]" />
                      <span>Batch Archive</span>
                    </button>

                    {hasSyncAction && onBatchSyncForks && (
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onBatchSyncForks();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-space font-bold text-[#0f766e] bg-[#4ecdc4]/20 hover:bg-[#4ecdc4]/40 text-left transition"
                      >
                        <GitFork className="w-4 h-4 stroke-[2.5] text-[#0f766e]" />
                        <span>Sync {forksSelectedCount} Forks</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onExportSelected('json');
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-space font-bold text-[#1a1a1a] hover:bg-[#fffef2] text-left transition"
                    >
                      <FileCode2 className="w-4 h-4 stroke-[2.5] text-[#555]" />
                      <span>Export JSON</span>
                    </button>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onExportSelected('csv');
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-space font-bold text-[#1a1a1a] hover:bg-[#fffef2] text-left transition"
                    >
                      <FileSpreadsheet className="w-4 h-4 stroke-[2.5] text-[#555]" />
                      <span>Export CSV</span>
                    </button>

                    <div className="border-t border-[#1a1a1a]/15 my-1" />

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onBatchDelete();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-space font-bold text-[#9f1239] bg-[#ff6b6b]/15 hover:bg-[#ff6b6b]/30 text-left transition"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2.5] text-[#ff6b6b]" />
                      <span>Delete Selected</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Clear Selection Button */}
            <button
              id="btn-mobile-batch-clear-selection"
              onClick={onClearSelection}
              className="w-7 h-7 rounded-lg bg-[#fffef2] border-2 border-[#1a1a1a] flex items-center justify-center text-[#1a1a1a] hover:bg-[#ff6b6b] hover:text-white shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
              title="Clear selection"
              aria-label="Clear repository selection"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Mobile Quick Action Buttons Row / Vertical Stack */}
        <div className="flex items-center gap-2 w-full">
          {/* Primary Action 1: Archive */}
          <button
            id="btn-mobile-batch-archive"
            onClick={onBatchArchive}
            className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-[#fffef2] hover:bg-[#ffcc5c] text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition font-space font-bold text-xs cursor-pointer truncate"
          >
            <Archive className="w-3.5 h-3.5 text-[#1a1a1a] stroke-[2.5] shrink-0" />
            <span className="truncate">Archive</span>
          </button>

          {/* Primary Action 2: Sync Forks (if selected) or Export */}
          {hasSyncAction && onBatchSyncForks ? (
            <button
              id="btn-mobile-batch-sync-forks"
              onClick={onBatchSyncForks}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-[#4ecdc4] hover:bg-[#38b2ac] text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition font-space font-bold text-xs cursor-pointer truncate"
            >
              <GitFork className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              <span className="truncate">Sync ({forksSelectedCount})</span>
            </button>
          ) : !isMoreThanThreeActions ? (
            <button
              id="btn-mobile-batch-export"
              onClick={() => onExportSelected('json')}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white hover:bg-[#fffef2] text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition font-space font-bold text-xs cursor-pointer truncate"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              <span className="truncate">Export</span>
            </button>
          ) : null}

          {/* Primary Action 3: Danger Delete */}
          <button
            id="btn-mobile-batch-delete"
            onClick={onBatchDelete}
            className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-[#ff6b6b] hover:bg-[#fa5252] text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition font-space font-bold text-xs cursor-pointer truncate"
          >
            <Trash2 className="w-3.5 h-3.5 text-white stroke-[2.5] shrink-0" />
            <span className="truncate">Delete</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TABLET / DESKTOP LAYOUT (>= 640px) */}
      {/* Streamlined single-row bar to minimise horizontal scroll & prevent clipping */}
      {/* ========================================================================= */}
      <div className="hidden sm:flex items-center gap-3 text-xs">
        {/* Selected counter */}
        <div className="flex items-center gap-2.5 pr-3.5 border-r-2 border-[#1a1a1a]/20 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-[#4ecdc4] border-2 border-[#1a1a1a] flex items-center justify-center text-[#1a1a1a] shadow-[1px_1px_0_#1a1a1a]">
            <CheckSquare className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="font-space text-[#1a1a1a] font-bold whitespace-nowrap">
            {selectedCount} <span className="text-[#666] font-normal">of {totalCount} selected</span>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Archive Button */}
          <button
            id="btn-batch-archive"
            onClick={onBatchArchive}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#fffef2] hover:bg-[#ffcc5c] text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition font-space font-bold cursor-pointer whitespace-nowrap"
          >
            <Archive className="w-3.5 h-3.5 text-[#1a1a1a] stroke-[2.5]" />
            <span>Archive</span>
          </button>

          {/* Sync Forks Button (if any forks selected) */}
          {hasSyncAction && onBatchSyncForks && (
            <button
              id="btn-batch-sync-forks"
              onClick={onBatchSyncForks}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4ecdc4] hover:bg-[#38b2ac] text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition font-space font-bold cursor-pointer whitespace-nowrap"
            >
              <GitFork className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Sync {forksSelectedCount} Forks</span>
            </button>
          )}

          {/* Delete Button */}
          <button
            id="btn-batch-delete"
            onClick={onBatchDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ff6b6b] hover:bg-[#fa5252] text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition font-space font-bold cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5 text-white stroke-[2.5]" />
            <span>Delete</span>
          </button>

          {/* Export Dropdown to prevent horizontal bloat */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              id="btn-batch-export-dropdown"
              onClick={() => setDesktopExportOpen((prev) => !prev)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-[#fffef2] text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition font-space font-bold cursor-pointer whitespace-nowrap"
              title="Export selected repositories"
              aria-expanded={desktopExportOpen}
            >
              <Download className="w-3.5 h-3.5 text-[#1a1a1a] stroke-[2.5]" />
              <span>Export</span>
              <ChevronUp className={`w-3 h-3 transition-transform ${desktopExportOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Desktop Export Dropdown (Opens Upward) */}
            {desktopExportOpen && (
              <div
                id="desktop-batch-export-menu"
                className="absolute bottom-full right-0 mb-3 w-44 bg-white border-[3px] border-[#1a1a1a] rounded-xl shadow-[4px_4px_0_#1a1a1a] p-1.5 space-y-1 z-50 animate-in fade-in zoom-in-95"
              >
                <button
                  onClick={() => {
                    setDesktopExportOpen(false);
                    onExportSelected('json');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-space font-bold text-[#1a1a1a] hover:bg-[#fffef2] text-left transition"
                >
                  <FileCode2 className="w-4 h-4 text-[#ff6b6b] stroke-[2.5]" />
                  <span>Export as JSON</span>
                </button>
                <button
                  onClick={() => {
                    setDesktopExportOpen(false);
                    onExportSelected('csv');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-space font-bold text-[#1a1a1a] hover:bg-[#fffef2] text-left transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#10b981] stroke-[2.5]" />
                  <span>Export as CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Clear / Dismiss */}
        <button
          id="btn-batch-clear-selection"
          onClick={onClearSelection}
          className="w-7 h-7 rounded-lg bg-[#fffef2] border-2 border-[#1a1a1a] flex items-center justify-center text-[#1a1a1a] hover:bg-[#ff6b6b] hover:text-white shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition ml-1 cursor-pointer shrink-0"
          title="Clear selection"
          aria-label="Clear selection"
        >
          <X className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
