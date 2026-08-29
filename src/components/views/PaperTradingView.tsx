import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { PaperTradeRecord } from '../../lib/types';
import { Wallet, Shield, Eye, CheckCircle2 } from 'lucide-react';

interface PaperTradingViewProps {
  account: any;
  trades: PaperTradeRecord[];
}

export const PaperTradingView: React.FC<PaperTradingViewProps> = ({ account, trades }) => {
  const balance = account?.virtualBalanceUsd || 10000.0;
  const initial = account?.initialCapitalUsd || 10000.0;
  const netPnl = account?.netPnlUsd || 0.0;
  const fees = account?.totalFeesUsd || 0.0;
  const slippage = account?.totalSlippageUsd || 0.0;
  const winRate = account?.winRatePct || 0.0;

  const [selectedTrade, setSelectedTrade] = useState<any | null>(null);

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Account Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-panel-100 to-panel-200 border-cyan-500/30">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>VIRTUAL ACCOUNT BALANCE</span>
            <Wallet className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-3xl font-bold text-gray-100">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div className="mt-2 text-xs text-gray-400">Initial Capital: ${initial.toLocaleString()} USDT</div>
        </Card>

        <Card>
          <div className="text-xs text-gray-400 mb-1">CUMULATIVE PERFORMANCE METRICS</div>
          <div className="grid grid-cols-2 gap-2 text-xs mt-3">
            <div>
              <span className="text-gray-400 block">Total Net PnL:</span>
              <span className={`font-bold text-base ${netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netPnl >= 0 ? '+' : ''}${netPnl.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">Win Rate:</span>
              <span className="font-bold text-base text-gray-200">{winRate.toFixed(1)}%</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-xs text-gray-400 mb-1">SIMULATED EXECUTION COSTS</div>
          <div className="grid grid-cols-2 gap-2 text-xs mt-3">
            <div>
              <span className="text-gray-400 block">Total Fees Paid:</span>
              <span className="font-bold text-rose-400">-${fees.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Total Slippage Cost:</span>
              <span className="font-bold text-amber-400">-${slippage.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Safety Notice */}
      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between text-xs text-emerald-300">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Paper Executions Engine Active — Real-time execution across 4 independent research strategy engines. Zero live Binance orders.</span>
        </div>
      </div>

      {/* Generic Multi-Strategy Executed Paper Trades Feed */}
      <Card title="GENERIC PAPER TRADE EXECUTIONS FEED" subtitle="Unified execution ledger across all 4 research strategies">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-panel-300 text-gray-400 pb-2">
                <th className="pb-2">TIME</th>
                <th className="pb-2">STRATEGY</th>
                <th className="pb-2">SYMBOL / PATH</th>
                <th className="pb-2">SIDE</th>
                <th className="pb-2">QUANTITY</th>
                <th className="pb-2">GROSS P&L</th>
                <th className="pb-2">FEES</th>
                <th className="pb-2">SLIPPAGE</th>
                <th className="pb-2">NET PROFIT</th>
                <th className="pb-2">LATENCY</th>
                <th className="pb-2 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-300/40">
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-6 text-center text-gray-500">
                    No paper trades executed yet. Evaluating live market data across strategy engines...
                  </td>
                </tr>
              ) : (
                trades.map((t: any) => (
                  <tr key={t.id} className="hover:bg-panel-200/50 transition-colors">
                    <td className="py-2.5 text-gray-400">{new Date(t.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2.5 font-bold text-cyan-400">{t.strategyName || 'Triangular Arbitrage'}</td>
                    <td className="py-2.5 font-bold text-gray-100">{t.symbol || t.cyclePath}</td>
                    <td className="py-2.5 font-bold text-emerald-400">{t.side || 'ARBITRAGE'}</td>
                    <td className="py-2.5 text-gray-300">{t.quantity || 1.0}</td>
                    <td className="py-2.5 text-emerald-400">+${(t.grossProfitUsd || 0).toFixed(4)}</td>
                    <td className="py-2.5 text-rose-400">-${(t.totalFeesUsd || t.feeUsd || 0).toFixed(4)}</td>
                    <td className="py-2.5 text-amber-400">-${(t.totalSlippageUsd || t.slippageUsd || 0).toFixed(4)}</td>
                    <td className={`py-2.5 font-bold ${t.netProfitUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.netProfitUsd >= 0 ? '+' : ''}${(t.netProfitUsd || t.netPnlUsd || 0).toFixed(4)}
                    </td>
                    <td className="py-2.5 text-gray-400">{t.executionDurationMs || 50}ms</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => setSelectedTrade(t)}
                        className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded font-bold"
                      >
                        VIEW DETAILS
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Trade Details Modal */}
      {selectedTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-panel-100 border border-panel-300 rounded-xl p-6 max-w-xl w-full space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-panel-300 pb-3">
              <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" /> STRATEGY EXECUTION DETAILS
              </h3>
              <button onClick={() => setSelectedTrade(null)} className="text-gray-400 hover:text-gray-200 font-bold text-sm">✕</button>
            </div>

            <div className="space-y-2 text-gray-300">
              <div>Trade ID: <span className="font-bold text-gray-100">{selectedTrade.id}</span></div>
              <div>Strategy: <span className="font-bold text-cyan-400">{selectedTrade.strategyName || 'Triangular Arbitrage'}</span></div>
              <div>Path / Symbol: <span className="font-bold text-gray-100">{selectedTrade.cyclePath || selectedTrade.symbol}</span></div>
              <div>Gross Profit: <span className="font-bold text-emerald-400">+${(selectedTrade.grossProfitUsd || 0).toFixed(4)}</span></div>
              <div>Total Fees: <span className="font-bold text-rose-400">-${(selectedTrade.totalFeesUsd || 0).toFixed(4)}</span></div>
              <div>Total Slippage: <span className="font-bold text-amber-400">-${(selectedTrade.totalSlippageUsd || 0).toFixed(4)}</span></div>
              <div>Net Profit: <span className="font-bold text-emerald-400">+${(selectedTrade.netProfitUsd || 0).toFixed(4)}</span></div>
            </div>

            <button onClick={() => setSelectedTrade(null)} className="w-full py-2 bg-panel-200 hover:bg-panel-300 text-gray-200 font-bold rounded-lg border border-panel-300">
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
