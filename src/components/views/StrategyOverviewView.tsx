import React from 'react';
import { Card } from '../ui/Card';
import { GitCommit, Zap, Activity, Layers, Shield, ArrowUpRight } from 'lucide-react';

interface StrategyOverviewViewProps {
  status: any;
  onNavigate: (tab: string) => void;
}

export const StrategyOverviewView: React.FC<StrategyOverviewViewProps> = ({ status, onNavigate }) => {
  const accounts = status?.strategyAccounts || {
    triangular: { netPnlUsd: 0, virtualBalanceUsd: 10000, totalTrades: 0, winRatePct: 0 },
    microstructure: { netPnlUsd: 0, virtualBalanceUsd: 10000, totalTrades: 0, winRatePct: 0 },
    market_making: { netPnlUsd: 0, virtualBalanceUsd: 10000, totalTrades: 0, winRatePct: 0 },
    scalper: { netPnlUsd: 0, virtualBalanceUsd: 10000, totalTrades: 0, winRatePct: 0 },
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-panel-200/40 rounded-xl border border-panel-300">
        <div>
          <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" /> FOUR-STRATEGY RESEARCH LABORATORY OVERVIEW
          </h2>
          <p className="text-xs text-gray-400">
            Four independent research strategy engines consuming the shared Binance public market-data stream.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
          <span>RESEARCH MODE</span>
          <span>•</span>
          <span>4 SEPARATE VIRTUAL ACCOUNTS</span>
        </div>
      </div>

      {/* 4 Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Strategy 1: Triangular Arbitrage */}
        <Card className="border-t-4 border-t-cyan-500 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-cyan-400" />
                <span className="font-bold text-sm text-gray-100">TRIANGULAR ARBITRAGE</span>
              </div>
            </div>
            <p className="text-gray-400 text-[11px]">3-pair mathematical price discrepancies across Binance tickers.</p>

            <div className="space-y-1.5 bg-panel-200/50 p-2.5 rounded-lg border border-panel-300">
              <div className="flex justify-between">
                <span className="text-gray-400">Virtual Account:</span>
                <span className="font-bold text-gray-200">${accounts.triangular?.virtualBalanceUsd?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Net P&L:</span>
                <span className={`font-bold ${accounts.triangular?.netPnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {accounts.triangular?.netPnlUsd >= 0 ? '+' : ''}${accounts.triangular?.netPnlUsd?.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Trades:</span>
                <span className="font-bold text-cyan-300">{accounts.triangular?.totalTrades}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('triangular')}
            className="mt-4 w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg font-bold border border-cyan-500/30 flex items-center justify-center gap-1 transition-colors"
          >
            <span>Open Triangular</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </Card>

        {/* Strategy 2: Order-Book Microstructure */}
        <Card className="border-t-4 border-t-purple-500 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-sm text-gray-100">MICROSTRUCTURE</span>
              </div>
            </div>
            <p className="text-gray-400 text-[11px]">Order-book imbalance, trade flow pressure & 0-100 Signal Score.</p>

            <div className="space-y-1.5 bg-panel-200/50 p-2.5 rounded-lg border border-panel-300">
              <div className="flex justify-between">
                <span className="text-gray-400">Virtual Account:</span>
                <span className="font-bold text-gray-200">${accounts.microstructure?.virtualBalanceUsd?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Net P&L:</span>
                <span className={`font-bold ${accounts.microstructure?.netPnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {accounts.microstructure?.netPnlUsd >= 0 ? '+' : ''}${accounts.microstructure?.netPnlUsd?.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Trades:</span>
                <span className="font-bold text-purple-300">{accounts.microstructure?.totalTrades}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('microstructure')}
            className="mt-4 w-full py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg font-bold border border-purple-500/30 flex items-center justify-center gap-1 transition-colors"
          >
            <span>Open Microstructure</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </Card>

        {/* Strategy 3: Market Making */}
        <Card className="border-t-4 border-t-emerald-500 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm text-gray-100">MARKET MAKING</span>
              </div>
            </div>
            <p className="text-gray-400 text-[11px]">Simulated limit quotes, queue position & adverse selection tracking.</p>

            <div className="space-y-1.5 bg-panel-200/50 p-2.5 rounded-lg border border-panel-300">
              <div className="flex justify-between">
                <span className="text-gray-400">Virtual Account:</span>
                <span className="font-bold text-gray-200">${accounts.market_making?.virtualBalanceUsd?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Net P&L:</span>
                <span className={`font-bold ${accounts.market_making?.netPnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {accounts.market_making?.netPnlUsd >= 0 ? '+' : ''}${accounts.market_making?.netPnlUsd?.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fills:</span>
                <span className="font-bold text-emerald-300">{accounts.market_making?.totalTrades}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('market-making')}
            className="mt-4 w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg font-bold border border-emerald-500/30 flex items-center justify-center gap-1 transition-colors"
          >
            <span>Open Market Making</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </Card>

        {/* Strategy 4: Multi-Asset Adaptive Scalper */}
        <Card className="border-t-4 border-t-amber-500 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm text-gray-100">MULTI-ASSET SCALPER</span>
              </div>
            </div>
            <p className="text-gray-400 text-[11px]">Scans 50 pairs for cost-aware net-profitable micro movements.</p>

            <div className="space-y-1.5 bg-panel-200/50 p-2.5 rounded-lg border border-panel-300">
              <div className="flex justify-between">
                <span className="text-gray-400">Virtual Account:</span>
                <span className="font-bold text-gray-200">${accounts.scalper?.virtualBalanceUsd?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Net P&L:</span>
                <span className={`font-bold ${accounts.scalper?.netPnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {accounts.scalper?.netPnlUsd >= 0 ? '+' : ''}${accounts.scalper?.netPnlUsd?.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Trades:</span>
                <span className="font-bold text-amber-300">{accounts.scalper?.totalTrades}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('micro-scalper')}
            className="mt-4 w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg font-bold border border-amber-500/30 flex items-center justify-center gap-1 transition-colors"
          >
            <span>Open Micro-Scalper</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </Card>
      </div>
    </div>
  );
};
