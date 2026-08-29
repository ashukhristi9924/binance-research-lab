import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Scale, TrendingUp, Sliders, Shield, Layers } from 'lucide-react';

export const StrategyComparisonView: React.FC = () => {
  const [timeWindow, setTimeWindow] = useState<'1h' | '6h' | '24h' | '3d' | '7d'>('24h');
  const [simCapital, setSimCapital] = useState<number>(10000);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/strategies/status');
        if (res.ok) {
          const json = await res.json();
          setStatus(json.status);
        }
      } catch (e) {
        console.error('Error fetching strategy comparison status:', e);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const accounts = status?.strategyAccounts || {
    triangular: {
      strategyName: 'Triangular Arbitrage v1.0',
      virtualBalanceUsd: 10000.0,
      initialCapitalUsd: 10000.0,
      grossPnlUsd: 0,
      totalFeesUsd: 0,
      totalSlippageUsd: 0,
      netPnlUsd: 0,
      roiPct: 0,
      totalTrades: 0,
      winRatePct: 0,
      maxDrawdownPct: 0,
      avgTradeUsd: 0,
      status: 'RUNNING',
    },
    microstructure: {
      strategyName: 'Order-Book Microstructure v1.0',
      virtualBalanceUsd: 10000.0,
      initialCapitalUsd: 10000.0,
      grossPnlUsd: 0,
      totalFeesUsd: 0,
      totalSlippageUsd: 0,
      netPnlUsd: 0,
      roiPct: 0,
      totalTrades: 0,
      winRatePct: 0,
      maxDrawdownPct: 0,
      avgTradeUsd: 0,
      status: 'RUNNING',
    },
    market_making: {
      strategyName: 'Market Making v1.0',
      virtualBalanceUsd: 10000.0,
      initialCapitalUsd: 10000.0,
      grossPnlUsd: 0,
      totalFeesUsd: 0,
      totalSlippageUsd: 0,
      netPnlUsd: 0,
      roiPct: 0,
      totalTrades: 0,
      winRatePct: 0,
      maxDrawdownPct: 0,
      avgTradeUsd: 0,
      status: 'RUNNING',
    },
  };

  const strategyList = [
    { key: 'triangular', ...accounts.triangular },
    { key: 'microstructure', ...accounts.microstructure },
    { key: 'market_making', ...accounts.market_making },
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
            <h2 className="text-base font-bold text-gray-100">STRATEGY PERFORMANCE COMPARISON</h2>
            <p className="text-xs text-gray-400">Objective Edge Comparison Across Equal Time Windows & Virtual Accounts</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400">Time Horizon:</span>
          {(['1h', '6h', '24h', '3d', '7d'] as const).map((tw) => (
            <button
              key={tw}
              onClick={() => setTimeWindow(tw)}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                timeWindow === tw ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-panel-200 text-gray-400 hover:text-gray-200'
              }`}
            >
              {tw}
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-Side Comparison Table */}
      <Card title="STRATEGY EDGE MATRIX" subtitle="Comparing Triangular Arbitrage vs Microstructure vs Market Making">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-panel-300 text-gray-400 pb-2">
                <th className="pb-2">STRATEGY</th>
                <th className="pb-2">VIRTUAL CAPITAL</th>
                <th className="pb-2">GROSS P&L</th>
                <th className="pb-2">FEES</th>
                <th className="pb-2">SLIPPAGE</th>
                <th className="pb-2">NET P&L</th>
                <th className="pb-2">ROI %</th>
                <th className="pb-2">TRADES</th>
                <th className="pb-2">WIN RATE</th>
                <th className="pb-2">AVG TRADE</th>
                <th className="pb-2 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-300/40">
              {strategyList.map((s) => (
                <tr key={s.key} className="hover:bg-panel-200/50">
                  <td className="py-3 font-bold text-gray-100">{s.strategyName}</td>
                  <td className="py-3">${s.initialCapitalUsd?.toLocaleString()}</td>
                  <td className={`py-3 ${s.grossPnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {s.grossPnlUsd >= 0 ? '+' : ''}${s.grossPnlUsd?.toFixed(2)}
                  </td>
                  <td className="py-3 text-rose-400">-${s.totalFeesUsd?.toFixed(2)}</td>
                  <td className="py-3 text-amber-400">-${s.totalSlippageUsd?.toFixed(2)}</td>
                  <td className={`py-3 font-bold ${s.netPnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {s.netPnlUsd >= 0 ? '+' : ''}${s.netPnlUsd?.toFixed(2)}
                  </td>
                  <td className={`py-3 font-bold ${s.roiPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {s.roiPct >= 0 ? '+' : ''}{s.roiPct?.toFixed(2)}%
                  </td>
                  <td className="py-3 font-bold text-cyan-300">{s.totalTrades}</td>
                  <td className="py-3 text-purple-400 font-bold">{s.winRatePct?.toFixed(1)}%</td>
                  <td className="py-3 text-gray-300">${s.avgTradeUsd?.toFixed(2)}</td>
                  <td className="py-3 text-right">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
                      RUNNING
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Capital Scaling Research Tool */}
      <Card title="CAPITAL SCALING & COST SENSITIVITY ANALYZER" subtitle="Simulate strategy liquidity impact across varying initial capital tiers">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 font-bold">Initial Capital Tier:</span>
            {[100, 500, 1000, 5000, 10000, 25000, 50000].map((cap) => (
              <button
                key={cap}
                onClick={() => setSimCapital(cap)}
                className={`px-3 py-1 rounded font-bold transition-all ${
                  simCapital === cap ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-panel-200 text-gray-400 hover:text-gray-200'
                }`}
              >
                ${cap.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-panel-200/40 rounded-lg border border-panel-300">
            <div className="space-y-1">
              <span className="text-gray-400 text-[10px]">ESTIMATED TRIANGULAR SLIPPAGE</span>
              <div className="text-base font-bold text-cyan-400">
                {simCapital <= 1000 ? '0.01%' : simCapital <= 10000 ? '0.08%' : '0.45% (LIQUIDITY LIMIT)'}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-gray-400 text-[10px]">MICROSTRUCTURE EXECUTION COST</span>
              <div className="text-base font-bold text-purple-400">
                {simCapital <= 5000 ? '0.10% Taker Fee' : '0.18% Taker + Depth Impact'}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-gray-400 text-[10px]">MARKET MAKING INVENTORY SKEW RISK</span>
              <div className="text-base font-bold text-emerald-400">
                {simCapital <= 10000 ? 'LOW INVENTORY RISK' : 'HIGH ADVERSE SELECTION SKEW'}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
