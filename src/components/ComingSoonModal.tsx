import React from 'react';
import { X, Sparkles, Watch, Activity, CheckCircle2, ArrowRight } from 'lucide-react';

interface ComingSoonModalProps {
  isOpen: boolean;
  appName: string;
  onClose: () => void;
  onConnectFreeSensor?: () => void;
}

export const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
  isOpen,
  appName,
  onClose,
  onConnectFreeSensor,
}) => {
  if (!isOpen) return null;

  const appIcons: Record<string, { bg: string; text: string; iconLabel: string }> = {
    'Google Fit': { bg: 'bg-blue-600', text: 'text-white', iconLabel: 'G' },
    'Apple Fit': { bg: 'bg-slate-900', text: 'text-white', iconLabel: '' },
    'Apple Health': { bg: 'bg-rose-600', text: 'text-white', iconLabel: '' },
    'Samsung Health': { bg: 'bg-indigo-600', text: 'text-white', iconLabel: 'S' },
    'Fitbit': { bg: 'bg-teal-600', text: 'text-white', iconLabel: 'F' },
  };

  const appMeta = appIcons[appName] || { bg: 'bg-sky-600', text: 'text-white', iconLabel: '★' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Clean Light Header */}
        <div className="p-5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00695c] flex items-center justify-center border border-emerald-100">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">{appName}</h3>
              <span className="text-[10px] text-slate-400 font-medium">Wearable Integration</span>
            </div>
          </div>

          {/* Circular Close Button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* App Info Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-2xl ${appMeta.bg} ${appMeta.text} flex items-center justify-center text-lg font-black shadow-xs`}
              >
                {appMeta.iconLabel}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">{appName} Cloud</span>
                <span className="text-[10px] text-slate-500 block">OAuth 2.0 Direct API</span>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Coming Soon
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Direct live cloud synchronization for <strong className="text-slate-900">{appName}</strong> is undergoing official developer certification and OAuth approval.
          </p>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-[11px] font-bold text-slate-800 block">
              What will be automatically synced:
            </span>
            <ul className="text-[11px] text-slate-600 space-y-1.5">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00695c] shrink-0" />
                <span>Daily steps walked & active distance</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00695c] shrink-0" />
                <span>Active workout calories burned (kcal)</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00695c] shrink-0" />
                <span>Resting heart rate & sleep recovery stages</span>
              </li>
            </ul>
          </div>

          {/* Free Connector Prompt */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 text-emerald-950">
            <div className="flex items-center space-x-2 mb-1">
              <Activity className="w-4 h-4 text-[#00695c]" />
              <span className="text-xs font-bold">Free Live Pedometer Ready Now</span>
            </div>
            <p className="text-[10px] text-emerald-900/90 leading-relaxed">
              You don't have to wait! You can connect your device's free live accelerometer sensor or use 1-tap instant activity sync right now.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-1 flex flex-col space-y-2">
            {onConnectFreeSensor && (
              <button
                type="button"
                onClick={() => {
                  onConnectFreeSensor();
                  onClose();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#00695c] hover:bg-emerald-800 active:scale-98 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5"
              >
                <span>Connect Free Live Activity Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 text-xs font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
