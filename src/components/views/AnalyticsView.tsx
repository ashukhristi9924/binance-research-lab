import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, PieChart as PieIcon, Activity } from 'lucide-react';

interface AnalyticsViewProps {
  opportunities?: any[];
  trades?: any[];
  account?: any;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ opportunities, trades, account: propAccount }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <Card title="RESEARCH STRATEGY ANALYTICS">
        <div className="py-8 text-center text-gray-500 font-mono text-xs">Computing research laboratory statistics...</div>
      </Card>
    );
  }

  const metrics = data.metrics || {};
  const pathPerformance = data.pathPerformance || [];
  const account = data.account || {};

  const winCount = account.winningTrades || 0;
  const lossCount = account.losingTrades || 0;
  const pieData = [
    { name: 'Winning Paper Trades', value: winCount, color: '#10b981' },
    { name: 'Losing Paper Trades', value: lossCount, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
        <Card className="border-l-4 border-l-cyan-500">
          <div className="text-gray-400">TOTAL OPPORTUNITIES SCAN</div>
          <div className="text-2xl font-bold text-gray-100 mt-1">{metrics.totalOpportunities || 0}</div>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <div className="text-gray-400">THEORETICAL GROSS P&L</div>
          <div className="text-2xl font-bold text-gray-200 mt-1">+${metrics.totalTheoreticalProfitUsd || '0.00'}</div>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <div className="text-gray-400">REALISTIC NET P&L</div>
          <div className={`text-2xl font-bold mt-1 ${(metrics.totalRealisticProfitUsd || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${metrics.totalRealisticProfitUsd || '0.00'}
          </div>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <div className="text-gray-400">COST & SLIPPAGE GAP</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">-${metrics.slippageGapUsd || '0.00'}</div>
        </Card>
      </div>

      {/* Middle Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
        {/* Win/Loss Pie Chart (1 Col) */}
        <Card title="PAPER TRADE WIN/LOSS DISTRIBUTION">
          <div className="h-56 w-full flex items-center justify-center">
            {winCount === 0 && lossCount === 0 ? (
              <div className="text-gray-500">No executed paper trades recorded yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e2330', borderColor: '#3c465e', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Path Performance Bar Chart (2 Cols) */}
        <Card title="NET P&L BY TRIANGULAR PATH" className="lg:col-span-2">
          <div className="h-56 w-full">
            {pathPerformance.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">No path stats collected yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pathPerformance}>
                  <XAxis dataKey="path" stroke="#6b7280" fontSize={10} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e2330', borderColor: '#3c465e', borderRadius: '8px' }} />
                  <Bar dataKey="netPnlUsd" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Strategy Breakdown Table */}
      <Card title="PERFORMANCE BREAKDOWN BY TRIANGULAR PATH" subtitle="Empirical win rate and net return across discovered 3-pair paths">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-panel-300 text-gray-400 pb-2">
                <th className="pb-2">TRIANGULAR PATH</th>
                <th className="pb-2">OPPORTUNITIES SCAN</th>
                <th className="pb-2">PAPER EXECUTED</th>
                <th className="pb-2">WIN RATE %</th>
                <th className="pb-2 text-right">SIMULATED NET P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-300/40">
              {pathPerformance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    No empirical path data collected yet.
                  </td>
                </tr>
              ) : (
                pathPerformance.map((p: any) => (
                  <tr key={p.path} className="hover:bg-panel-200/50 transition-colors">
                    <td className="py-2.5 font-bold text-cyan-400">{p.path}</td>
                    <td className="py-2.5 text-gray-300">{p.totalOpportunities}</td>
                    <td className="py-2.5 text-gray-200">{p.paperExecuted}</td>
                    <td className="py-2.5 text-gray-200">{p.winRatePct.toFixed(1)}%</td>
                    <td className={`py-2.5 text-right font-bold ${p.netPnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {p.netPnlUsd >= 0 ? '+' : ''}${p.netPnlUsd.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
