import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ArbitrageOpportunityCalc } from '../../lib/types';
import { Radar, Filter } from 'lucide-react';

interface ScannerViewProps {
  opportunities: ArbitrageOpportunityCalc[];
  onInspect: (opp: ArbitrageOpportunityCalc) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({ opportunities, onInspect }) => {
  const [filter, setFilter] = useState<'ALL' | 'PROFITABLE' | 'EXECUTED'>('ALL');

  const filtered = opportunities.filter((opp) => {
    if (filter === 'PROFITABLE') return (opp.realisticProfitUsd ?? 0) > 0;
    if (filter === 'EXECUTED') return opp.status === 'EXECUTED';
    return true;
  });

  return (
    <Card
      title="TRIANGULAR ARBITRAGE SCANNER"
      subtitle="Dynamic discovery and real-time scanning of 3-pair Binance trading cycles"
      action={
        <div className="flex items-center gap-2 font-mono text-xs">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filter === 'ALL' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-panel-200 text-gray-400'
            }`}
          >
            All ({opportunities.length})
          </button>
          <button
            onClick={() => setFilter('PROFITABLE')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filter === 'PROFITABLE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-panel-200 text-gray-400'
            }`}
          >
            Profitable Net
          </button>
          <button
            onClick={() => setFilter('EXECUTED')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filter === 'EXECUTED' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' : 'bg-panel-200 text-gray-400'
            }`}
          >
            Paper Executed
          </button>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-panel-300 text-gray-400 pb-2">
              <th className="pb-2">TIMESTAMP</th>
              <th className="pb-2">CYCLE PATH</th>
              <th className="pb-2">STARTING CAPITAL</th>
              <th className="pb-2">THEORETICAL FINAL</th>
              <th className="pb-2">GROSS P&L</th>
              <th className="pb-2">EST. FEES</th>
              <th className="pb-2">EST. SLIPPAGE</th>
              <th className="pb-2">NET REALISTIC P&L</th>
              <th className="pb-2">DURATION</th>
              <th className="pb-2">STATUS</th>
              <th className="pb-2 text-right">INSPECT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-panel-300/40">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-6 text-center text-gray-500">
                  No opportunities match the selected filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((opp) => (
                <tr key={opp.id} className="hover:bg-panel-200/50 transition-colors">
                  <td className="py-2.5 text-gray-400">{new Date(opp.timestamp).toLocaleTimeString()}</td>
                  <td className="py-2.5 font-bold text-cyan-400">{opp.cycle?.id || (opp as any).cyclePath}</td>
                  <td className="py-2.5 text-gray-300">${opp.startingCapitalUsd}</td>
                  <td className="py-2.5 text-gray-300">${opp.theoreticalFinalUsd}</td>
                  <td className="py-2.5 text-gray-200">+${opp.grossProfitUsd.toFixed(2)}</td>
                  <td className="py-2.5 text-rose-400">-${opp.totalFeesUsd.toFixed(2)}</td>
                  <td className="py-2.5 text-amber-400">-${opp.totalSlippageUsd.toFixed(2)}</td>
                  <td className={`py-2.5 font-bold ${(opp.realisticProfitUsd ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(opp.realisticProfitUsd ?? 0) >= 0 ? '+' : ''}${(opp.realisticProfitUsd ?? 0).toFixed(2)} ({(opp.realisticProfitPct ?? 0) >= 0 ? '+' : ''}${(opp.realisticProfitPct ?? 0).toFixed(2)}%)
                  </td>
                  <td className="py-2.5 text-gray-400">{opp.durationMs} ms</td>
                  <td className="py-2.5">
                    <Badge status={opp.status} classification={opp.classification} />
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => onInspect(opp)}
                      className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded border border-cyan-500/30 text-[11px] transition-colors"
                    >
                      View Path
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
