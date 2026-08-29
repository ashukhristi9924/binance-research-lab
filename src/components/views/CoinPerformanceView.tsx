import React from 'react';
import { Card } from '../ui/Card';
import { Award, TrendingUp, Layers } from 'lucide-react';

export const CoinPerformanceView: React.FC = () => {
  const coinStats = [
    { symbol: 'SOLUSDT', signals: 142, trades: 18, winRate: 61.1, gross: 4.85, fees: 2.10, net: 2.75, avgHolding: '4.2s' },
    { symbol: 'ETHUSDT', signals: 185, trades: 22, winRate: 59.0, gross: 5.20, fees: 2.80, net: 2.40, avgHolding: '5.1s' },
    { symbol: 'BTCUSDT', signals: 210, trades: 15, winRate: 53.3, gross: 3.10, fees: 2.40, net: 0.70, avgHolding: '6.8s' },
    { symbol: 'BNBUSDT', signals: 98, trades: 8, winRate: 50.0, gross: 1.40, fees: 1.20, net: 0.20, avgHolding: '7.5s' },
    { symbol: 'DOGEUSDT', signals: 64, trades: 4, winRate: 25.0, gross: 0.40, fees: 0.85, net: -0.45, avgHolding: '3.1s' },
  ];

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-panel-200/40 rounded-xl border border-panel-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <Award className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100">PER-COIN PERFORMANCE ANALYTICS</h2>
            <p className="text-xs text-gray-400">Evaluating Tradeability and Net Profitability Across Individual Crypto Assets</p>
          </div>
        </div>
      </div>

      {/* Coin Matrix */}
      <Card title="PER-COIN EDGE MATRIX" subtitle="Ranking individual coins by realistic net P&L after fees and slippage">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-panel-300 text-gray-400 pb-2">
                <th className="pb-2">RANK</th>
                <th className="pb-2">SYMBOL</th>
                <th className="pb-2">SIGNALS</th>
                <th className="pb-2">TRADES</th>
                <th className="pb-2">WIN RATE</th>
                <th className="pb-2">GROSS P&L</th>
                <th className="pb-2">FEES</th>
                <th className="pb-2">NET P&L</th>
                <th className="pb-2 text-right">AVG HOLDING</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-300/40">
              {coinStats.map((c, idx) => (
                <tr key={c.symbol} className="hover:bg-panel-200/50">
                  <td className="py-2.5 font-bold text-cyan-400">#{idx + 1}</td>
                  <td className="py-2.5 font-bold text-gray-100">{c.symbol}</td>
                  <td className="py-2.5 text-gray-300">{c.signals}</td>
                  <td className="py-2.5 font-bold text-cyan-300">{c.trades}</td>
                  <td className="py-2.5 text-purple-400 font-bold">{c.winRate}%</td>
                  <td className="py-2.5 text-emerald-400">+${c.gross.toFixed(2)}</td>
                  <td className="py-2.5 text-rose-400">-${c.fees.toFixed(2)}</td>
                  <td className={`py-2.5 font-bold ${c.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {c.net >= 0 ? '+' : ''}${c.net.toFixed(2)}
                  </td>
                  <td className="py-2.5 text-right text-cyan-300 font-bold">{c.avgHolding}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
