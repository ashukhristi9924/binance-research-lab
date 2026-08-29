import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ArbitrageOpportunityCalc } from '../../lib/types';
import { ArrowRight, GitCommit, CheckCircle2, AlertTriangle, Scale } from 'lucide-react';

interface TriangularPathViewProps {
  opportunity: ArbitrageOpportunityCalc | null;
  allOpportunities: ArbitrageOpportunityCalc[];
  onSelectOpp: (opp: ArbitrageOpportunityCalc) => void;
}

export const TriangularPathView: React.FC<TriangularPathViewProps> = ({
  opportunity,
  allOpportunities,
  onSelectOpp,
}) => {
  const opp = opportunity || allOpportunities[0];

  if (!opp) {
    return (
      <Card title="CALCULATION DEBUG & PATH VISUALIZER">
        <div className="py-8 text-center text-gray-500 font-mono text-xs">
          No arbitrage opportunity selected yet. Select an opportunity from Dashboard or Scanner to inspect full step-by-step debug metrics.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card
        title={
          <div className="flex items-center gap-3">
            <GitCommit className="w-5 h-5 text-cyan-400" />
            <span>CALCULATION DEBUG & STEP-BY-STEP CONVERSION DIAGRAM</span>
          </div>
        }
        subtitle={`Path: ${opp.cycle?.id || (opp as any).cyclePath} | Fingerprint: ${opp.fingerprint || opp.id}`}
        action={
          <select
            onChange={(e) => {
              const found = allOpportunities.find((o) => o.id === e.target.value);
              if (found) onSelectOpp(found);
            }}
            value={opp.id}
            className="px-3 py-1.5 bg-panel-200 border border-panel-300 rounded-lg text-gray-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
          >
            {allOpportunities.map((o) => (
              <option key={o.id} value={o.id}>
                {o.cycle?.id || (o as any).cyclePath} ({new Date(o.timestamp).toLocaleTimeString()})
              </option>
            ))}
          </select>
        }
      >
        {/* 3 Result Layers Summary Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-panel-200/50 rounded-xl border border-panel-300 font-mono text-xs mb-6">
          {/* Layer 1: Theoretical */}
          <div className="p-3 bg-panel-100/60 rounded border border-cyan-500/30">
            <div className="text-gray-400 text-[11px] font-bold">1. THEORETICAL (0 Fees / 0 Slippage)</div>
            <div className="text-lg font-bold text-cyan-400 mt-1">${opp.theoreticalFinalUsd} USDT</div>
            <div className="text-[11px] text-cyan-300">
              Theoretical PnL: {opp.theoreticalProfitUsd >= 0 ? '+' : ''}${opp.theoreticalProfitUsd} ({opp.theoreticalProfitPct >= 0 ? '+' : ''}{opp.theoreticalProfitPct}%)
            </div>
          </div>

          {/* Layer 2: Cost-Adjusted */}
          <div className="p-3 bg-panel-100/60 rounded border border-amber-500/30">
            <div className="text-gray-400 text-[11px] font-bold">2. COST-ADJUSTED (Fees Deducted)</div>
            <div className="text-lg font-bold text-amber-400 mt-1">${opp.costAdjustedFinalUsd} USDT</div>
            <div className="text-[11px] text-amber-300">
              Cost-Adjusted PnL: {opp.costAdjustedProfitUsd >= 0 ? '+' : ''}${opp.costAdjustedProfitUsd} ({opp.costAdjustedProfitPct >= 0 ? '+' : ''}{opp.costAdjustedProfitPct}%)
            </div>
          </div>

          {/* Layer 3: Realistic */}
          <div className={`p-3 bg-panel-100/60 rounded border ${opp.realisticProfitUsd >= 0 ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
            <div className="text-gray-400 text-[11px] font-bold">3. REALISTIC (Fees + VWAP + Liquidity)</div>
            <div className={`text-lg font-bold mt-1 ${opp.realisticProfitUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${opp.realisticFinalUsd} USDT
            </div>
            <div className={`text-[11px] ${opp.realisticProfitUsd >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              Net Realistic PnL: {opp.realisticProfitUsd >= 0 ? '+' : ''}${opp.realisticProfitUsd} ({opp.realisticProfitPct >= 0 ? '+' : ''}{opp.realisticProfitPct}%)
            </div>
          </div>
        </div>

        {/* Detailed 3-Leg Step-by-Step Flow Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
          {opp.legs.map((leg) => (
            <div key={leg.legIndex} className="bg-panel-200/40 p-5 rounded-xl border border-panel-300 space-y-3">
              <div className="flex items-center justify-between border-b border-panel-300 pb-2">
                <span className="font-bold text-cyan-400">LEG #{leg.legIndex}</span>
                <span className="px-2 py-0.5 rounded bg-panel-300 text-gray-200 text-[10px] font-bold uppercase">
                  {leg.action} {leg.symbol}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm font-bold text-gray-100 py-1">
                <span>{leg.fromAsset}</span>
                <ArrowRight className="w-4 h-4 text-cyan-400" />
                <span>{leg.toAsset}</span>
              </div>

              <div className="space-y-1.5 text-xs text-gray-300 bg-panel-100/60 p-3 rounded border border-panel-300/50">
                <div className="flex justify-between">
                  <span className="text-gray-400">Top Book Price:</span>
                  <span className="font-bold text-gray-200">{leg.topBookPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">VWAP Exec Price:</span>
                  <span className="font-bold text-cyan-300">{leg.vwapPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Input Quantity:</span>
                  <span>{leg.inputQty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Output Quantity:</span>
                  <span className="font-bold text-emerald-400">{leg.outputQty}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-panel-300/50">
                  <span className="text-gray-400">Executed Leg Fee:</span>
                  <span className="text-rose-400">-${leg.feeUsd} ({leg.feePercentage}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Slippage Cost:</span>
                  <span className="text-amber-400">-${leg.slippageUsd} ({leg.slippagePct}%)</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-panel-300/50">
                  <span className="text-gray-400">Required Liquidity:</span>
                  <span>{leg.requiredLiquidityQty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Available Liquidity:</span>
                  <span>{leg.availableLiquidityQty}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-gray-400">Liquidity Shortfall:</span>
                  <span className={leg.shortfallQty > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    {leg.shortfallQty > 0 ? `${leg.shortfallQty} (SHORT)` : '0 (OK)'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Calculation Audit Footer */}
        <div className="mt-6 p-4 bg-panel-200/20 border border-panel-300 rounded-xl font-mono text-xs text-gray-300 space-y-1">
          <div className="font-bold text-gray-100 mb-1">TRANSPARENT ACCOUNTING AUDIT</div>
          <div>Starting Balance: ${opp.startingCapitalUsd} USDT</div>
          <div>Leg 1 Fee: -${opp.legs[0]?.feeUsd} | Leg 2 Fee: -${opp.legs[1]?.feeUsd} | Leg 3 Fee: -${opp.legs[2]?.feeUsd}</div>
          <div>Total Leg Fees Deducted: -${opp.totalFeesUsd}</div>
          <div>Total VWAP Order Book Slippage: -${opp.totalSlippageUsd}</div>
          <div className="pt-1 font-bold text-emerald-400 border-t border-panel-300/60">
            Final Realistic Net Balance: ${opp.realisticFinalUsd} USDT ({opp.realisticProfitUsd >= 0 ? '+' : ''}${opp.realisticProfitUsd})
          </div>
        </div>
      </Card>
    </div>
  );
};
