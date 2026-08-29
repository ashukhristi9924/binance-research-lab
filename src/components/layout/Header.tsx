import React from 'react';
import { Wifi, WifiOff, Activity, Cpu, AlertCircle, RefreshCw } from 'lucide-react';

interface HeaderProps {
  status: any;
  onRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ status, onRefresh }) => {
  const dataAge = typeof status.dataAgeMs === 'number' ? status.dataAgeMs : 99999;
  const isDemo = status.mode === 'demo';
  const isConnected = status.connected === true || status.binanceWsConnected === true;
  const isLive = (status.connected === true || isConnected) && dataAge < 5000;
  const isStale = isConnected && dataAge >= 5000 && dataAge < 15000;

  let badgeColor = 'bg-rose-950/40 border-rose-500/30 text-rose-400';
  let badgeText = 'DISCONNECTED';

  if (isDemo) {
    badgeColor = 'bg-amber-950/40 border-amber-500/30 text-amber-400';
    badgeText = 'DEMO STREAM';
  } else if (isLive) {
    badgeColor = 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400';
    badgeText = 'LIVE';
  } else if (isStale) {
    badgeColor = 'bg-amber-950/40 border-amber-500/30 text-amber-400';
    badgeText = 'STALE';
  } else if (status.statusText === 'CONNECTING' || status.statusText === 'RECONNECTING') {
    badgeColor = 'bg-amber-950/40 border-amber-500/30 text-amber-400';
    badgeText = status.statusText;
  }

  return (
    <header className="bg-panel-100 border-b border-panel-300 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
          Δ
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-100 tracking-wide flex items-center gap-2">
            BINANCE TRIANGULAR ARBITRAGE
            <span className="text-[10px] font-mono uppercase bg-panel-300 text-cyan-400 px-1.5 py-0.5 rounded">
              v1.0 LAB
            </span>
          </h1>
          <p className="text-xs text-gray-400 font-mono">
            Single-Exchange Research & Paper-Trading Laboratory
          </p>
        </div>
      </div>

      {/* Real-time Status Badges */}
      <div className="flex items-center gap-4 text-xs font-mono">
        {/* Binance WS Data Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded border ${badgeColor}`}>
          {isLive ? (
            <Wifi className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>BINANCE DATA: {badgeText}</span>
        </div>

        {/* Data Age & Stale Indicator */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded border ${
            isStale
              ? 'bg-rose-950/60 border-rose-500/50 text-rose-300 animate-pulse'
              : 'bg-panel-200 border-panel-300 text-gray-300'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          {isStale ? (
            <span className="font-bold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> STALE ({status.dataAgeMs}ms)
            </span>
          ) : (
            <span>AGE: {status.dataAgeMs} ms</span>
          )}
        </div>

        {/* Engine Status Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-panel-200 border border-panel-300 text-gray-300">
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span>CYCLES: {status.discoveredCyclesCount || 0} PATHS</span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1.5 rounded bg-panel-200 hover:bg-panel-300 border border-panel-300 text-gray-400 hover:text-white transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
};
