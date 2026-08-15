import { useState } from 'react';
import { 
  GitFork, 
  Star, 
  FolderGit2, 
  Trash2, 
  LogOut, 
  RefreshCw, 
  Layers, 
  KeyRound, 
  ChevronDown,
  Gauge,
  Sun,
  Moon
} from 'lucide-react';
import { AuthSession, ThemeMode } from '../types';

interface NavbarProps {
  session: AuthSession | null;
  activeTab: 'repos' | 'forks' | 'starred' | 'audit';
  setActiveTab: (tab: 'repos' | 'forks' | 'starred' | 'audit') => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onRefresh: () => void;
  loading: boolean;
  repoCount: number;
  forkCount: number;
  starredCount: number;
  staleCount: number;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export function Navbar({
  session,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onLogout,
  onRefresh,
  loading,
  repoCount,
  forkCount,
  starredCount,
  staleCount,
  theme,
  onToggleTheme,
}: NavbarProps) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const user = session?.user;
  const isDemo = session?.authMethod === 'demo';

  return (
    <header id="app-header" className="sticky top-0 z-40 bg-[#fffef2]/95 dark:bg-[#161b22]/95 backdrop-blur-sm border-b-[3px] border-[#1a1a1a] dark:border-[#30363d] px-4 sm:px-6 lg:px-8 py-3.5 transition">
      <div className="max-w-[1720px] 2xl:max-w-[1840px] mx-auto flex items-center justify-between gap-4">
        {/* Brand & Tab Navigation */}
        <div className="flex items-center gap-6">
          {/* Logo Area */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-xl bg-[#4ecdc4] dark:bg-[#39d353] flex items-center justify-center -rotate-3 shadow-[3px_3px_0_#1a1a1a] shrink-0">
              <FolderGit2 className="w-5 h-5 text-[#1a1a1a] stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-2xl font-extrabold tracking-tight text-[#1a1a1a] dark:text-[#f0f6fc] leading-none">
                RepoDeck
              </span>
            </div>
          </div>

          {/* Desktop Navigation Pill Group */}
          <nav className="hidden md:flex items-center gap-2 bg-[#1a1a1a] dark:bg-[#0d1117] p-1.5 rounded-2xl border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[3px_3px_0_rgba(0,0,0,0.15)]">
            <button
              id="nav-tab-repos"
              onClick={() => setActiveTab('repos')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'repos'
                  ? 'bg-[#ffcc5c] dark:bg-[#f0883e] text-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a]'
                  : 'text-white hover:text-[#ffcc5c]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Repos</span>
              <span className="bg-black/15 px-1.5 py-0.2 rounded text-[11px] font-space">
                {repoCount}
              </span>
            </button>

            <button
              id="nav-tab-forks"
              onClick={() => setActiveTab('forks')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'forks'
                  ? 'bg-[#ffcc5c] dark:bg-[#f0883e] text-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a]'
                  : 'text-white hover:text-[#ffcc5c]'
              }`}
            >
              <GitFork className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Forks</span>
              <span className="bg-black/15 px-1.5 py-0.2 rounded text-[11px] font-space">
                {forkCount}
              </span>
            </button>

            <button
              id="nav-tab-starred"
              onClick={() => setActiveTab('starred')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'starred'
                  ? 'bg-[#ffcc5c] dark:bg-[#f0883e] text-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a]'
                  : 'text-white hover:text-[#ffcc5c]'
              }`}
            >
              <Star className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Starred</span>
              <span className="bg-black/15 px-1.5 py-0.2 rounded text-[11px] font-space">
                {starredCount}
              </span>
            </button>

            <button
              id="nav-tab-audit"
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-[#ff6b6b] text-white shadow-[2px_2px_0_#1a1a1a]'
                  : 'text-[#ff6b6b] hover:text-white'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Audit</span>
              {staleCount > 0 && (
                <span className="bg-black/20 text-white px-1.5 py-0.2 rounded text-[11px] font-space">
                  {staleCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            id="btn-toggle-theme"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="w-9 h-9 rounded-xl border-2 border-[#1a1a1a] dark:border-[#30363d] flex items-center justify-center bg-white dark:bg-[#21262d] hover:bg-[#ffcc5c] dark:hover:bg-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] transition shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#ffcc5c] stroke-[2.5]" />
            ) : (
              <Moon className="w-4 h-4 text-[#1a1a1a] stroke-[2.5]" />
            )}
          </button>

          {/* Refresh button */}
          {session?.authenticated && (
            <button
              id="btn-refresh-data"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh GitHub Data (R)"
              className="w-9 h-9 rounded-xl border-2 border-[#1a1a1a] dark:border-[#30363d] flex items-center justify-center bg-white dark:bg-[#21262d] hover:bg-[#ffcc5c] dark:hover:bg-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] transition shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}

          {/* User profile / Auth status */}
          {session?.authenticated && user ? (
            <div className="relative">
              <button
                id="btn-user-dropdown"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 bg-white dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] rounded-xl px-2.5 py-1 shadow-[2px_2px_0_#1a1a1a] hover:bg-[#fffef2] dark:hover:bg-[#30363d] transition cursor-pointer"
              >
                <div className="text-right hidden sm:block">
                  <div className="font-extrabold text-xs text-[#1a1a1a] dark:text-[#f0f6fc] leading-tight">
                    @{user.login}
                  </div>
                  <div className="font-space text-[10px] text-[#666] dark:text-[#8b949e] leading-none">
                    {session.rateLimit ? `API: ${session.rateLimit.remaining} OK` : isDemo ? 'SANDBOX' : 'CONNECTED'}
                  </div>
                </div>
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  className="w-7 h-7 rounded-lg border-2 border-[#1a1a1a] dark:border-[#30363d] object-cover"
                />
                <ChevronDown className="w-3.5 h-3.5 text-[#1a1a1a] dark:text-[#f0f6fc] stroke-[2.5]" />
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setUserDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-2xl shadow-[6px_6px_0_#1a1a1a] z-50 p-3 text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2 py-1 border-b-2 border-dashed border-[#1a1a1a]/15 dark:border-white/15 pb-2">
                      <p className="font-extrabold text-sm text-[#1a1a1a] dark:text-[#f0f6fc]">{user.name || user.login}</p>
                      <p className="text-[11px] text-[#666] dark:text-[#8b949e] font-space">@{user.login}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#555] dark:text-[#8b949e] font-space">
                        <span>{user.public_repos} public repos</span>
                        <span>•</span>
                        <span>{user.followers} followers</span>
                      </div>
                    </div>

                    <div className="px-2 font-space text-[11px] text-[#555] dark:text-[#8b949e] space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Auth Method:</span>
                        <span className="font-bold text-[#1a1a1a] dark:text-[#f0f6fc] capitalize">{session.authMethod || 'Token'}</span>
                      </div>

                      {/* API Rate Limit Telemetry Block */}
                      {session.rateLimit && (
                        <div className="p-2 rounded-xl bg-[#fffef2] dark:bg-[#0d1117] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">
                              <Gauge className="w-3.5 h-3.5 text-[#1a1a1a] dark:text-[#f0f6fc] stroke-[2.5]" />
                              <span>API Rate Limit</span>
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                              session.rateLimit.remaining > 1000
                                ? 'bg-[#10b981]/20 text-[#065f46] dark:text-[#39d353] border-[#10b981]'
                                : session.rateLimit.remaining > 200
                                ? 'bg-[#ffcc5c]/30 text-[#854d0e] dark:text-[#f0883e] border-[#ffcc5c]'
                                : 'bg-[#ff6b6b]/20 text-[#9f1239] dark:text-[#ff7b72] border-[#ff6b6b]'
                            }`}>
                              {session.rateLimit.remaining > 1000 ? 'HEALTHY' : session.rateLimit.remaining > 200 ? 'NORMAL' : 'LOW'}
                            </span>
                          </div>

                          <div className="flex items-baseline justify-between">
                            <span className="text-xs font-bold text-[#1a1a1a] dark:text-[#f0f6fc]">
                              {session.rateLimit.remaining.toLocaleString()} <span className="text-[10px] text-[#777] dark:text-[#8b949e] font-normal">/ {session.rateLimit.limit.toLocaleString()}</span>
                            </span>
                            <span className="text-[10px] text-[#666] dark:text-[#8b949e]">
                              {Math.max(0, Math.round((session.rateLimit.reset * 1000 - Date.now()) / (60 * 1000)))}m to reset
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden border border-[#1a1a1a]/30 dark:border-white/20">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                session.rateLimit.remaining > 1000
                                  ? 'bg-[#10b981] dark:bg-[#39d353]'
                                  : session.rateLimit.remaining > 200
                                  ? 'bg-[#ffcc5c] dark:bg-[#f0883e]'
                                  : 'bg-[#ff6b6b] dark:bg-[#ff7b72]'
                              }`}
                              style={{
                                width: `${Math.min(100, Math.max(0, (session.rateLimit.remaining / (session.rateLimit.limit || 5000)) * 100))}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-[#777] dark:text-[#8b949e] mb-1">
                          <span>Token Scopes:</span>
                          {session.scopes.includes('delete_repo') || session.authMethod === 'demo' ? (
                            <span className="text-[#065f46] dark:text-[#39d353] font-bold">Delete Enabled ✓</span>
                          ) : (
                            <span className="text-[#9f1239] dark:text-[#ff7b72] font-bold">No Delete Scope ⚠️</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {session.scopes.length > 0 ? (
                            session.scopes.map((s) => (
                              <span
                                key={s}
                                className={`px-1.5 py-0.5 rounded text-[10px] border ${
                                  s === 'delete_repo'
                                    ? 'bg-[#10b981]/15 text-[#065f46] dark:text-[#39d353] border-[#10b981]'
                                    : 'bg-[#fffef2] dark:bg-[#21262d] text-[#1a1a1a] dark:text-[#f0f6fc] border-[#1a1a1a] dark:border-[#30363d]'
                                } font-bold`}
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-[#999] italic">No scopes detected</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t-2 border-dashed border-[#1a1a1a]/15 dark:border-white/15 pt-1.5 space-y-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenAuth();
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#ffcc5c]/40 dark:hover:bg-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] font-semibold flex items-center gap-2 transition cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Switch Token / Account</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#ff6b6b]/20 text-[#ff6b6b] font-bold flex items-center gap-2 transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Disconnect Session</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              id="btn-nav-connect"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#ffcc5c] dark:bg-[#f0883e] hover:bg-[#ffbe3b] text-[#1a1a1a] border-2 border-[#1a1a1a] dark:border-[#30363d] text-xs font-bold shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Connect GitHub</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Row */}
      <div className="md:hidden flex items-center justify-between mt-2.5 pt-2 border-t-2 border-dashed border-[#1a1a1a]/15 dark:border-white/15 font-space text-xs">
        <button
          onClick={() => setActiveTab('repos')}
          className={`px-2.5 py-1 rounded-lg font-bold ${activeTab === 'repos' ? 'bg-[#ffcc5c] dark:bg-[#f0883e] text-[#1a1a1a] border-2 border-[#1a1a1a]' : 'text-[#666] dark:text-[#8b949e]'}`}
        >
          Repos ({repoCount})
        </button>
        <button
          onClick={() => setActiveTab('forks')}
          className={`px-2.5 py-1 rounded-lg font-bold ${activeTab === 'forks' ? 'bg-[#ffcc5c] dark:bg-[#f0883e] text-[#1a1a1a] border-2 border-[#1a1a1a]' : 'text-[#666] dark:text-[#8b949e]'}`}
        >
          Forks ({forkCount})
        </button>
        <button
          onClick={() => setActiveTab('starred')}
          className={`px-2.5 py-1 rounded-lg font-bold ${activeTab === 'starred' ? 'bg-[#ffcc5c] dark:bg-[#f0883e] text-[#1a1a1a] border-2 border-[#1a1a1a]' : 'text-[#666] dark:text-[#8b949e]'}`}
        >
          Starred ({starredCount})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-2.5 py-1 rounded-lg font-bold ${activeTab === 'audit' ? 'bg-[#ff6b6b] text-white border-2 border-[#1a1a1a]' : 'text-[#ff6b6b]'}`}
        >
          Audit ({staleCount})
        </button>
      </div>
    </header>
  );
}
