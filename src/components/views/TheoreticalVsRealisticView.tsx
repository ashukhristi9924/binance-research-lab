import React from 'react';
import { Card } from '../ui/Card';
import { ArbitrageOpportunityCalc } from '../../lib/types';
import { Scale, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';

interface TheoreticalVsRealisticViewProps {
  opportunities: ArbitrageOpportunityCalc[];
}

export const TheoreticalVsRealisticView: React.FC<TheoreticalVsRealisticViewProps> = ({ opportunities }) => {
  let totalTheoreticalProfit = 0;
  let totalRealisticProfit = 0;
  let totalFeesDeducted = 0;
  let totalSlippageDeducted = 0;

  for (const opp of opportunities) {
    totalTheoreticalProfit += Math.max(0, opp.theoreticalProfitUsd ?? (opp as any).grossProfitUsd ?? 0);
    totalRealisticProfit += opp.realisticProfitUsd ?? (opp as any).netProfitUsd ?? 0;
    totalFeesDeducted += opp.totalFeesUsd ?? 0;
    totalSlippageDeducted += opp.totalSlippageUsd ?? 0;
  }

  const gap = totalTheoreticalProfit - totalRealisticProfit;

  return (
    <div className="space-y-6">
      <Card
        title={
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-cyan-400" />
            <span>THEORETICAL VS REALISTIC SIMULATION COMPARISON</span>
          </div>
        }
        subtitle="Preventing misleading results by contrasting zero-cost naive math against real-world execution constraints"
      >
        {/* Side by Side Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs mb-6">
          {/* Theoretical Column */}
          <div className="p-6 bg-panel-200/40 rounded-xl border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-panel-300 pb-3">
              <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-cyan-400" />
                THEORETICAL OPPORTUNITY
              </h4>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px]">
                NAIVE MODEL
              </span>
            </div>

            <div className="space-y-2 text-gray-300">
              <p className="text-gray-400 italic">Assumptions:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Immediate instant execution</li>
                <li>Zero trading fees (0% spot fee)</li>
                <li>Infinite top-of-book liquidity</li>
                <li>Zero bid/ask spread slippage</li>
                <li>Zero decision or network latency</li>
              </ul>
            </div>

            <div className="pt-3 border-t border-panel-300 flex justify-between items-baseline">
              <span className="text-gray-400 font-bold">Total Theoretical Profit:</span>
              <span className="text-2xl font-bold text-cyan-400">+${totalTheoreticalProfit.toFixed(2)}</span>
            </div>
          </div>

          {/* Realistic Column */}
          <div className="p-6 bg-panel-200/40 rounded-xl border border-emerald-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-panel-300 pb-3">
              <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                REALISTIC EXECUTION SIMULATION
              </h4>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
                RESEARCH MODEL
              </span>
            </div>

            <div className="space-y-2 text-gray-300">
              <p className="text-gray-400 italic">Models & Deductions Included:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Binance spot trading fees applied per leg</li>
                <li>Actual bid/ask order book side selection</li>
                <li>Volume-weighted average price (VWAP) slippage</li>
                <li>Order book depth liquidity limits</li>
                <li>Simulated 75ms execution latency delay</li>
              </ul>
            </div>

            <div className="pt-3 border-t border-panel-300 flex justify-between items-baseline">
              <span className="text-gray-400 font-bold">Total Realistic Net Profit:</span>
              <span className={`text-2xl font-bold ${totalRealisticProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalRealisticProfit >= 0 ? '+' : ''}${totalRealisticProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Cost Deductions Breakdown Bar */}
        <div className="p-5 bg-panel-200/20 border border-panel-300 rounded-xl font-mono text-xs space-y-3">
          <h4 className="font-bold text-gray-200">REALITY GAP COST BREAKDOWN</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="text-gray-400 block">Total Fees Paid:</span>
              <span className="text-rose-400 font-bold text-sm">-${totalFeesDeducted.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Total Order Book Slippage:</span>
              <span className="text-amber-400 font-bold text-sm">-${totalSlippageDeducted.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Total Profit Reduction Gap:</span>
              <span className="text-rose-400 font-bold text-sm">-${gap.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
