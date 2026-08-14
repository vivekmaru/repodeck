import { useState, type FormEvent } from 'react';
import { 
  X, 
  KeyRound, 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertCircle,
  FolderGit2,
  Terminal
} from 'lucide-react';
import { AuthSession } from '../types';
import { api } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: AuthSession | null;
  onPatLogin: (token: string) => Promise<boolean>;
  onDemoLogin: () => Promise<boolean>;
}

export function AuthModal({
  isOpen,
  onClose,
  onPatLogin,
  onDemoLogin,
}: AuthModalProps) {
  const [tab, setTab] = useState<'oauth' | 'pat' | 'demo'>('oauth');
  const [patInput, setPatInput] = useState('');
  const [patLoading, setPatLoading] = useState(false);
  const [patError, setPatError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [copiedCallback, setCopiedCallback] = useState(false);

  if (!isOpen) return null;

  const appOrigin = window.location.origin;
  const callbackUrl = `${appOrigin}/auth/callback`;

  const copyCallbackUrl = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2000);
  };

  const handleOAuthConnect = async () => {
    setOauthLoading(true);
    setOauthError(null);
    try {
      const data = await api.auth.getOAuthUrl();

      if (!data.url) {
        if (data.needs_credentials) {
          throw new Error('GITHUB_CLIENT_ID not configured yet. You can use a Personal Access Token (PAT) below or configure OAuth credentials.');
        }
        throw new Error('Failed to generate OAuth authorization URL');
      }

      // Open OAuth provider URL directly in popup
      const popup = window.open(
        data.url,
        'github_oauth_popup',
        'width=600,height=750,menubar=no,toolbar=no,status=no'
      );

      if (!popup) {
        throw new Error('Popup was blocked by your browser. Please allow popups for this site.');
      }

      const popupTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupTimer);
          api.auth.getSession()
            .then((sess) => {
              if (sess?.authenticated) {
                onClose();
              }
            })
            .catch(() => {});
        }
      }, 750);
    } catch (err: any) {
      setOauthError(err.message || 'OAuth initiation failed');
    } finally {
      setOauthLoading(false);
    }
  };

  const handlePatSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!patInput.trim()) return;

    setPatLoading(true);
    setPatError(null);
    try {
      const success = await onPatLogin(patInput.trim());
      if (success) {
        onClose();
      } else {
        setPatError('Invalid token or insufficient scopes.');
      }
    } catch (err: any) {
      setPatError(err.message || 'Failed to authenticate PAT');
    } finally {
      setPatLoading(false);
    }
  };

  const handleDemoClick = async () => {
    const success = await onDemoLogin();
    if (success) {
      onClose();
    }
  };

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div 
        id="auth-modal-card" 
        className="w-full max-w-lg bg-white dark:bg-[#161b22] border-[3px] border-[#1a1a1a] dark:border-[#30363d] rounded-[24px] shadow-[8px_8px_0_#1a1a1a] dark:shadow-[8px_8px_0_#000000] overflow-hidden flex flex-col max-h-[90vh] text-[#1a1a1a] dark:text-[#f0f6fc] transition"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-[#1a1a1a] dark:border-[#30363d] bg-[#fffef2] dark:bg-[#0d1117]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4ecdc4] dark:bg-[#39d353] border-2 border-[#1a1a1a] dark:border-[#30363d] flex items-center justify-center text-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] shrink-0">
              <KeyRound className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-[#1a1a1a] dark:text-[#f0f6fc] leading-none">Connect GitHub Account</h2>
              <p className="font-space text-[10px] font-bold text-[#555] dark:text-[#8b949e] uppercase tracking-wide mt-1">Manage repositories & sync upstream forks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white dark:bg-[#21262d] border-2 border-[#1a1a1a] dark:border-[#30363d] flex items-center justify-center text-[#1a1a1a] dark:text-[#f0f6fc] hover:bg-[#fffef2] dark:hover:bg-[#30363d] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b-2 border-[#1a1a1a] dark:border-[#30363d] bg-[#fffef2] dark:bg-[#0d1117] px-6 pt-3 gap-2">
          <button
            onClick={() => setTab('oauth')}
            className={`pb-2.5 px-3 font-space text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              tab === 'oauth'
                ? 'border-[#ff6b6b] text-[#ff6b6b] dark:text-[#ff7b72] border-b-[3px]'
                : 'border-transparent text-[#666] dark:text-[#8b949e] hover:text-[#1a1a1a] dark:hover:text-[#f0f6fc]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            OAuth 2.0
          </button>
          <button
            onClick={() => setTab('pat')}
            className={`pb-2.5 px-3 font-space text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              tab === 'pat'
                ? 'border-[#ff6b6b] text-[#ff6b6b] dark:text-[#ff7b72] border-b-[3px]'
                : 'border-transparent text-[#666] dark:text-[#8b949e] hover:text-[#1a1a1a] dark:hover:text-[#f0f6fc]'
            }`}
          >
            <Terminal className="w-4 h-4 stroke-[2.5]" />
            Access Token (PAT)
          </button>
          <button
            onClick={() => setTab('demo')}
            className={`pb-2.5 px-3 font-space text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              tab === 'demo'
                ? 'border-[#ff6b6b] text-[#ff6b6b] dark:text-[#ff7b72] border-b-[3px]'
                : 'border-transparent text-[#666] dark:text-[#8b949e] hover:text-[#1a1a1a] dark:hover:text-[#f0f6fc]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#ffcc5c] stroke-[2.5]" />
            Sandbox Demo
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {tab === 'oauth' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#fffef2] dark:bg-[#0d1117] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a] space-y-2">
                <p className="font-bold text-[#1a1a1a] dark:text-[#f0f6fc] text-sm">OAuth Popup Authentication</p>
                <p className="text-[#555] dark:text-[#8b949e] leading-relaxed font-medium">
                  Authenticate securely using GitHub's authorization popup. RepoDeck requests the <code className="text-[#1a1a1a] dark:text-[#f0f6fc] font-space font-bold bg-white dark:bg-[#21262d] px-1 py-0.5 rounded border border-[#1a1a1a] dark:border-[#30363d]">repo</code>, <code className="text-[#ff6b6b] dark:text-[#ff7b72] font-space font-bold bg-white dark:bg-[#21262d] px-1 py-0.5 rounded border border-[#1a1a1a] dark:border-[#30363d]">delete_repo</code>, and <code className="text-[#1a1a1a] dark:text-[#f0f6fc] font-space font-bold bg-white dark:bg-[#21262d] px-1 py-0.5 rounded border border-[#1a1a1a] dark:border-[#30363d]">read:user</code> scopes to inspect repository age, sync upstream forks, and allow direct repository deletions.
                </p>
              </div>

              {oauthError && (
                <div className="p-3.5 rounded-xl bg-[#ff6b6b]/15 dark:bg-[#ff7b72]/15 border-2 border-[#ff6b6b] dark:border-[#ff7b72] text-[#9f1239] dark:text-[#ff7b72] flex items-start gap-2.5 font-space">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 stroke-[2.5]" />
                  <div className="space-y-1">
                    <p className="font-bold">OAuth Notice</p>
                    <p className="text-[11px] font-medium">{oauthError}</p>
                    <button
                      onClick={() => setTab('pat')}
                      className="underline text-[#ff6b6b] dark:text-[#ff7b72] hover:text-[#fa5252] font-bold mt-1 block cursor-pointer"
                    >
                      Click here to use a Personal Access Token instead &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* Callback URL helper */}
              <div className="space-y-1.5 font-space">
                <div className="flex items-center justify-between text-[#555] dark:text-[#8b949e] text-[11px] font-bold">
                  <span>Registered GitHub OAuth Callback URL:</span>
                  <button
                    onClick={copyCallbackUrl}
                    className="flex items-center gap-1 text-[#1a1a1a] dark:text-[#f0f6fc] hover:text-[#ff6b6b] transition cursor-pointer"
                  >
                    {copiedCallback ? <Check className="w-3.5 h-3.5 text-[#065f46] dark:text-[#39d353] stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5 stroke-[2.5]" />}
                    <span>{copiedCallback ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-[#fffef2] dark:bg-[#0d1117] border-2 border-[#1a1a1a] dark:border-[#30363d] text-[#1a1a1a] dark:text-[#f0f6fc] font-space text-[11px] break-all select-all font-bold shadow-[2px_2px_0_#1a1a1a]">
                  {callbackUrl}
                </div>
              </div>

              <button
                id="btn-oauth-popup-trigger"
                onClick={handleOAuthConnect}
                disabled={oauthLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#4ecdc4] dark:bg-[#39d353] hover:bg-[#38b2ac] text-[#1a1a1a] font-space font-bold text-xs border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[4px_4px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
              >
                <FolderGit2 className="w-4 h-4 stroke-[2.5]" />
                <span>{oauthLoading ? 'Opening GitHub Authorization...' : 'Authorize with GitHub OAuth'}</span>
              </button>
            </div>
          )}

          {tab === 'pat' && (
            <form onSubmit={handlePatSubmit} className="space-y-4">
              <div className="p-4 rounded-xl bg-[#fffef2] dark:bg-[#0d1117] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1a1a1a] dark:text-[#f0f6fc] text-xs">GitHub Personal Access Token (PAT)</span>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo,delete_repo,read:user&description=RepoDeck+Manager"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#ff6b6b] dark:text-[#ff7b72] hover:underline font-space font-bold text-[11px]"
                  >
                    <span>Generate token</span>
                    <ExternalLink className="w-3 h-3 stroke-[2.5]" />
                  </a>
                </div>
                <p className="text-[#555] dark:text-[#8b949e] text-xs leading-relaxed font-medium">
                  Recommended scopes: <code className="text-[#1a1a1a] dark:text-[#f0f6fc] font-space font-bold bg-white dark:bg-[#21262d] px-1 py-0.5 rounded border border-[#1a1a1a] dark:border-[#30363d]">repo</code> (audit & fork sync), <code className="text-[#ff6b6b] dark:text-[#ff7b72] font-space font-bold bg-white dark:bg-[#21262d] px-1 py-0.5 rounded border border-[#1a1a1a] dark:border-[#30363d]">delete_repo</code> (for deleting stale repos), and <code className="text-[#1a1a1a] dark:text-[#f0f6fc] font-space font-bold bg-white dark:bg-[#21262d] px-1 py-0.5 rounded border border-[#1a1a1a] dark:border-[#30363d]">read:user</code>.
                </p>
                <div className="p-2 rounded-lg bg-[#ffcc5c]/20 dark:bg-[#f0883e]/20 border border-[#ffcc5c] dark:border-[#f0883e] text-[11px] text-[#78350f] dark:text-[#f0883e] font-space">
                  <strong>Important:</strong> Please generate a <strong>Tokens (classic)</strong> token. GitHub Fine-Grained (Beta) tokens do not support deleting repositories through the REST API.
                </div>
              </div>

              {patError && (
                <div className="p-3 rounded-xl bg-[#ff6b6b]/15 dark:bg-[#ff7b72]/15 border-2 border-[#ff6b6b] dark:border-[#ff7b72] text-[#9f1239] dark:text-[#ff7b72] flex items-center gap-2 font-space font-bold text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 stroke-[2.5]" />
                  <span>{patError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[#1a1a1a] dark:text-[#f0f6fc] font-bold text-xs">Enter Personal Access Token</label>
                <input
                  type="password"
                  value={patInput}
                  onChange={(e) => setPatInput(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_xxxx..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fffef2] dark:bg-[#0d1117] border-2 border-[#1a1a1a] dark:border-[#30363d] focus:bg-white dark:focus:bg-[#21262d] focus:outline-none text-[#1a1a1a] dark:text-[#f0f6fc] font-space font-bold text-xs shadow-[2px_2px_0_#1a1a1a] placeholder:text-[#999] dark:placeholder:text-[#666]"
                />
              </div>

              <button
                type="submit"
                disabled={patLoading || !patInput.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#ffcc5c] dark:bg-[#f0883e] hover:bg-[#ffbe3b] disabled:opacity-50 text-[#1a1a1a] font-space font-bold text-xs border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[4px_4px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
              >
                <KeyRound className="w-4 h-4 stroke-[2.5]" />
                <span>{patLoading ? 'Validating Token...' : 'Connect with Token'}</span>
              </button>
            </form>
          )}

          {tab === 'demo' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#fffef2] dark:bg-[#0d1117] border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[2px_2px_0_#1a1a1a] space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#ffcc5c] stroke-[2.5]" />
                  <span className="font-bold text-[#1a1a1a] dark:text-[#f0f6fc] text-sm">Interactive Sandbox Mode</span>
                </div>
                <p className="text-[#555] dark:text-[#8b949e] leading-relaxed font-medium">
                  Want to explore RepoDeck immediately? Test drive the repository health audit, upstream fork drift analysis, 1-click sync simulation, stale repository deletion, and starred catalog without entering credentials.
                </p>
              </div>

              <button
                onClick={handleDemoClick}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#ff6b6b] hover:bg-[#fa5252] text-white font-space font-bold text-xs border-2 border-[#1a1a1a] dark:border-[#30363d] shadow-[4px_4px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>Launch Interactive Demo Sandbox</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
