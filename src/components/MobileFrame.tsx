import React from 'react';
import { Battery, Wifi, Signal } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
  appName?: string;
  badge?: string;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  appName = 'WheatGuard Mobile',
  badge = 'Android / iOS',
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-2 min-h-[calc(100vh-60px)]">
      {/* Device wrapper */}
      <div className="relative w-full max-w-[410px] h-[840px] bg-slate-950 rounded-[48px] p-3 shadow-[0_0_50px_rgba(0,0,0,0.8)] border-[6px] border-slate-800 flex flex-col ring-1 ring-slate-700/50">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-900 rounded-full z-30 flex items-center justify-center gap-2 border border-slate-800/80">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-700" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
        </div>

        {/* Screen container */}
        <div className="relative w-full h-full bg-slate-950 rounded-[38px] overflow-hidden flex flex-col border border-slate-900">
          {/* Phone Status Bar */}
          <div className="h-10 px-6 flex items-center justify-between text-[11px] text-slate-300 z-20 shrink-0 select-none pt-1">
            <span className="font-semibold tracking-tight">09:41</span>
            <div className="flex items-center gap-1.5 opacity-80">
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4" />
            </div>
          </div>

          {/* Phone App Header Bar */}
          <div className="px-4 py-2 border-b border-slate-800/70 bg-slate-900/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-slate-200">{appName}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {badge}
            </span>
          </div>

          {/* Scrollable phone viewport */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3 custom-scrollbar">
            {children}
          </div>

          {/* Home indicator bar */}
          <div className="h-5 flex items-center justify-center shrink-0 bg-slate-950">
            <div className="w-28 h-1 rounded-full bg-slate-600/60" />
          </div>
        </div>
      </div>
    </div>
  );
};
