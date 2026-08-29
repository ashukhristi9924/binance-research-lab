import React from 'react';
import { AlertTriangle, ShieldCheck, Database, Ban } from 'lucide-react';

export const SafetyBanner: React.FC = () => {
  return (
    <div className="w-full bg-gradient-to-r from-amber-950/80 via-panel-200 to-amber-950/80 border-b border-amber-500/30 px-4 py-2 flex flex-wrap items-center justify-between text-xs font-mono shadow-md">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          RESEARCH MODE
        </span>
        <span className="flex items-center gap-1.5 font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          SIMULATED CAPITAL ONLY ($10,000 USDT)
        </span>
        <span className="flex items-center gap-1.5 font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
          <Ban className="w-3.5 h-3.5" />
          NO REAL TRADES PLACED
        </span>
      </div>

      <div className="flex items-center gap-4 text-gray-400">
        <span className="flex items-center gap-1">
          <Database className="w-3 h-3 text-cyan-400" />
          BINANCE PUBLIC MARKET DATA ONLY
        </span>
        <span className="text-gray-500">|</span>
        <span className="text-amber-300/80 font-medium">
          Zero API Credentials Required
        </span>
      </div>
    </div>
  );
};
