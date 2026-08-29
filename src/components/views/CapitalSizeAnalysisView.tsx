import React from 'react';
import { Card } from '../ui/Card';
import { Maximize2, Layers } from 'lucide-react';

export const CapitalSizeAnalysisView: React.FC = () => {
  const tiers = [
    { capital: 100, grossPct: 0.12, feePct: 0.08, slippagePct: 0.01, liquidityOk: true },
    { capital: 500, grossPct: 0.12, feePct: 0.08, slippagePct: 0.02, liquidityOk: true },
    { capital: 1000, grossPct: 0.12, feePct: 0.08, slippagePct: 0.04, liquidityOk: true },
    { capital: 5000, grossPct: 0.12, feePct: 0.08, slippagePct: 0.09, liquidityOk: true },
    { capital: 10000, grossPct: 0.12, feePct: 0.08, slippagePct: 0.15, liquidityOk: false },
    { capital: 50000, grossPct: 0.12, feePct: 0.08, slippagePct: 0.45, liquidityOk: false },
  ];

  return (
    <Card
      title={
        <div className="flex items-center gap-3">
          <Maximize2 className="w-5 h-5 text-cyan-400" />
          <span>CAPITAL-SIZE SCALING SIMULATION LABORATORY</span>
        </div>
      }
      subtitle="Evaluating how triangular arbitrage profitability decays as trade capital scales up against order book depth"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-panel-300 text-gray-400 pb-2">
              <th className="pb-2">VIRTUAL TRADE CAPITAL</th>
              <th className="pb-2">EST. GROSS PROFIT</th>
              <th className="pb-2">EST. TRADING FEES</th>
              <th className="pb-2">EST. SLIPPAGE</th>
              <th className="pb-2">LIQUIDITY IMPACT</th>
              <th className="pb-2">NET SIMULATED PROFIT</th>
              <th className="pb-2 text-right">RETURN %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-panel-300/40">
            {tiers.map((t) => {
              const grossUsd = (t.grossPct / 100) * t.capital;
              const feeUsd = (t.feePct / 100) * t.capital;
              const slippageUsd = (t.slippagePct / 100) * t.capital;
              const netUsd = grossUsd - feeUsd - slippageUsd;
              const netPct = (netUsd / t.capital) * 100;

              return (
                <tr key={t.capital} className="hover:bg-panel-200/50 transition-colors">
                  <td className="py-3 font-bold text-gray-100">${t.capital.toLocaleString()} USDT</td>
                  <td className="py-3 text-gray-200">+${grossUsd.toFixed(2)}</td>
                  <td className="py-3 text-rose-400">-${feeUsd.toFixed(2)}</td>
                  <td className="py-3 text-amber-400">-${slippageUsd.toFixed(2)}</td>
                  <td className="py-3">
                    {t.liquidityOk ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
                        OPTIMAL LIQUIDITY
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px]">
                        SLIPPAGE DECAY
                      </span>
                    )}
                  </td>
                  <td className={`py-3 font-bold ${netUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {netUsd >= 0 ? '+' : ''}${netUsd.toFixed(2)}
                  </td>
                  <td className={`py-3 text-right font-bold ${netPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {netPct >= 0 ? '+' : ''}{netPct.toFixed(3)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-panel-200/30 border border-panel-300 rounded-xl font-mono text-xs text-gray-300">
        <span className="font-bold text-cyan-400 block mb-1">RESEARCH LABORATORY FINDING:</span>
        Triangular arbitrage opportunities are typically small-capacity trades. As capital increases beyond $5,000 - $10,000, market depth consumption causes exponential slippage increase, reducing net return and eventually turning theoretical opportunities unprofitable.
      </div>
    </Card>
  );
};
