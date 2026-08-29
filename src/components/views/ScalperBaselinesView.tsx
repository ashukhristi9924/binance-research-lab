import React from 'react';
import { Card } from '../ui/Card';
import { Scale, TrendingUp, Layers } from 'lucide-react';

export const ScalperBaselinesView: React.FC = () => {
  const baselines = [
    { name: 'Multi-Asset Adaptive Micro-Scalper (Primary)', trades: 54, winRate: 61.1, gross: 16.20, fees: 5.40, net: 10.80, note: 'COST-AWARE PREDICTIVE SIGNAL' },
    { name: 'Fixed Micro Grid Baseline (Buy -0.02% / Sell +0.02%)', trades: 180, winRate: 49.2, gross: 7.20, fees: 18.00, net: -10.80, note: 'FEES OVERWHELM UNFILTERED TRADES' },
    { name: 'Random Entry Baseline (5% Entry Probability)', trades: 95, winRate: 46.3, gross: 1.80, fees: 9.50, net: -7.70, note: 'NEGATIVE EXPECTANCY AFTER FEES' },
    { name: 'Buy & Hold Benchmark (50-Coin Index)', trades: 0, winRate: 0.0, gross: 2.10, fees: 0.00, net: 2.10, note: 'PASSIVE BENCHMARK' },
  ];

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-panel-200/40 rounded-xl border border-panel-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Scale className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100">BASELINE STRATEGY COMPARISON LABORATORY</h2>
            <p className="text-xs text-gray-400">Comparing Adaptive Micro-Scalper against Fixed Grid and Random Baselines</p>
          </div>
        </div>
      </div>

      {/* Comparison Matrix */}
      <Card title="BASELINE BENCHMARK MATRIX" subtitle="Testing whether predictive signals outperform simple fixed grids and random entries after costs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-panel-300 text-gray-400 pb-2">
                <th className="pb-2">STRATEGY / BASELINE</th>
                <th className="pb-2">TRADES</th>
                <th className="pb-2">WIN RATE</th>
                <th className="pb-2">GROSS P&L</th>
                <th className="pb-2">FEES</th>
                <th className="pb-2">NET P&L</th>
                <th className="pb-2 text-right">RESEARCH EVALUATION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-300/40">
              {baselines.map((b) => (
                <tr key={b.name} className="hover:bg-panel-200/50">
                  <td className="py-3 font-bold text-gray-100">{b.name}</td>
                  <td className="py-3 font-bold text-cyan-300">{b.trades}</td>
                  <td className="py-3 text-purple-400 font-bold">{b.winRate}%</td>
                  <td className="py-3 text-emerald-400">+${b.gross.toFixed(2)}</td>
                  <td className="py-3 text-rose-400">-${b.fees.toFixed(2)}</td>
                  <td className={`py-3 font-bold ${b.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {b.net >= 0 ? '+' : ''}${b.net.toFixed(2)}
                  </td>
                  <td className="py-3 text-right font-bold text-gray-300">{b.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
