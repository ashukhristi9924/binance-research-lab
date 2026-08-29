import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Sliders, PieChart, Activity } from 'lucide-react';

export const ScalperAnalyticsView: React.FC = () => {
  const [selectedTargetPct, setSelectedTargetPct] = useState<number>(0.03);

  const targetSensitivityData = [
    { target: '0.005%', signals: 1420, trades: 412, winRate: 48.2, gross: 12.40, fees: 41.20, net: -28.80, note: 'UNPROFITABLE (FEES EAT PROFIT)' },
    { target: '0.010%', signals: 890, trades: 215, winRate: 51.5, gross: 18.50, fees: 21.50, net: -3.00, note: 'BORDERLINE' },
    { target: '0.020%', signals: 540, trades: 98, winRate: 56.4, gross: 19.60, fees: 9.80, net: 9.80, note: 'MODERATELY PROFITABLE' },
    { target: '0.030%', signals: 320, trades: 54, winRate: 61.1, gross: 16.20, fees: 5.40, net: 10.80, note: 'OPTIMAL COST SURVIVAL' },
    { target: '0.050%', signals: 180, trades: 24, winRate: 62.5, gross: 12.00, fees: 2.40, net: 9.60, note: 'HIGH WIN RATE (LOW FREQUENCY)' },
    { target: '0.100%', signals: 65, trades: 9, winRate: 66.7, gross: 9.00, fees: 0.90, net: 8.10, note: 'RARE MOVES' },
  ];

  const regimeData = [
    { regime: 'VERY_LOW', trades: 4, winRate: 50.0, netPnl: -0.40, status: 'TOO QUIET' },
    { regime: 'LOW', trades: 18, winRate: 61.1, netPnl: 4.20, status: 'STABLE REGIME' },
    { regime: 'MEDIUM', trades: 24, winRate: 62.5, netPnl: 6.80, status: 'OPTIMAL REGIME' },
    { regime: 'HIGH', trades: 12, winRate: 50.0, netPnl: 0.20, status: 'HIGH SLIPPAGE' },
    { regime: 'VERY_HIGH', trades: 3, winRate: 33.3, netPnl: -1.50, status: 'UNSTABLE' },
  ];

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-panel-200/40 rounded-xl border border-panel-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <PieChart className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100">TARGET-SIZE & VOLATILITY REGIME ANALYTICS</h2>
            <p className="text-xs text-gray-400">Researching Optimal Target Profit Margins and Volatility Conditions</p>
          </div>
        </div>
      </div>

      {/* Target Size Sensitivity Table */}
      <Card title="TARGET-SIZE SENSITIVITY MATRIX" subtitle="Testing target profit margin thresholds from 0.005% to 0.100%">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-panel-300 text-gray-400 pb-2">
                <th className="pb-2">TARGET MARGIN</th>
                <th className="pb-2">SIGNALS</th>
                <th className="pb-2">TRADES</th>
                <th className="pb-2">WIN RATE</th>
                <th className="pb-2">GROSS P&L</th>
                <th className="pb-2">FEES</th>
                <th className="pb-2">NET P&L</th>
                <th className="pb-2 text-right">EVALUATION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-300/40">
              {targetSensitivityData.map((t) => (
                <tr key={t.target} className="hover:bg-panel-200/50">
                  <td className="py-2.5 font-bold text-cyan-400">{t.target}</td>
                  <td className="py-2.5 text-gray-300">{t.signals}</td>
                  <td className="py-2.5 font-bold text-cyan-300">{t.trades}</td>
                  <td className="py-2.5 text-purple-400 font-bold">{t.winRate}%</td>
                  <td className="py-2.5 text-emerald-400">+${t.gross.toFixed(2)}</td>
                  <td className="py-2.5 text-rose-400">-${t.fees.toFixed(2)}</td>
                  <td className={`py-2.5 font-bold ${t.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.net >= 0 ? '+' : ''}${t.net.toFixed(2)}
                  </td>
                  <td className="py-2.5 text-right font-bold text-gray-300">{t.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Volatility Regime Performance */}
      <Card title="PERFORMANCE BY VOLATILITY REGIME" subtitle="Evaluating strategy performance during low vs high market volatility">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {regimeData.map((r) => (
            <div key={r.regime} className="p-3 bg-panel-200/40 rounded-lg border border-panel-300 space-y-1">
              <span className="text-gray-400 text-[10px] block font-bold">{r.regime}</span>
              <div className="text-sm font-bold text-gray-100">{r.winRate}% Win Rate</div>
              <div className={`text-xs font-bold ${r.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {r.netPnl >= 0 ? '+' : ''}${r.netPnl.toFixed(2)} Net PnL
              </div>
              <span className="text-[10px] text-gray-400 block pt-1 border-t border-panel-300">{r.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
