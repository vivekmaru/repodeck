import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto p-4 rounded-2xl border-[3px] border-[#1a1a1a] shadow-[6px_6px_0_#1a1a1a] flex items-start justify-between gap-3 text-xs transition-all animate-in slide-in-from-bottom-3 ${
            t.type === 'success'
              ? 'bg-[#10b981]/15 text-[#1a1a1a]'
              : t.type === 'error'
              ? 'bg-[#ff6b6b]/20 text-[#1a1a1a]'
              : 'bg-[#4ecdc4]/20 text-[#1a1a1a]'
          } bg-white`}
        >
          <div className="flex items-start gap-3 min-w-0">
            {t.type === 'success' && (
              <div className="w-8 h-8 rounded-xl bg-[#10b981]/20 border-2 border-[#10b981] flex items-center justify-center text-[#065f46] shrink-0 shadow-[1px_1px_0_#1a1a1a]">
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              </div>
            )}
            {t.type === 'error' && (
              <div className="w-8 h-8 rounded-xl bg-[#ff6b6b]/20 border-2 border-[#ff6b6b] flex items-center justify-center text-[#9f1239] shrink-0 shadow-[1px_1px_0_#1a1a1a]">
                <AlertCircle className="w-4 h-4 stroke-[2.5]" />
              </div>
            )}
            {t.type === 'info' && (
              <div className="w-8 h-8 rounded-xl bg-[#4ecdc4]/20 border-2 border-[#4ecdc4] flex items-center justify-center text-[#115e59] shrink-0 shadow-[1px_1px_0_#1a1a1a]">
                <Info className="w-4 h-4 stroke-[2.5]" />
              </div>
            )}
            <div>
              <p className="font-heading text-sm font-bold text-[#1a1a1a] leading-none">{t.title}</p>
              {t.message && <p className="text-[#555] font-space text-[11px] font-medium mt-1">{t.message}</p>}
            </div>
          </div>

          <button
            onClick={() => onDismiss(t.id)}
            className="w-6 h-6 rounded-md bg-[#fffef2] border border-[#1a1a1a] flex items-center justify-center text-[#1a1a1a] hover:bg-[#ff6b6b] hover:text-white transition p-0.5 shrink-0 shadow-[1px_1px_0_#1a1a1a] cursor-pointer"
          >
            <X className="w-3 h-3 stroke-[2.5]" />
          </button>
        </div>
      ))}
    </div>
  );
}

