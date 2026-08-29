import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { ScalperSignalCalc, ScalperTradeRecord } from '../../lib/types';
import { Layers, Shield, Eye, CheckCircle2, AlertTriangle, ArrowUpRight, Activity } from 'lucide-react';

export const MicroScalperView: React.FC = () => {
  const [data, setData] = useState<{
    rankedOpportunities: ScalperSignalCalc[];
    openPositions: ScalperTradeRecord[];
    trades: ScalperTradeRecord[];
  }>({
    rankedOpportunities: [],
    openPositions: [],
    trades: [],
  });

  const [selectedOpp, setSelectedOpp] = useState<ScalperSignalCalc | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [oppRes, tradeRes] = await Promise.all([
          fetch('/api/scalper/opportunities'),
          fetch('/api/scalper/trades?limit=50'),
        ]);

        if (oppRes.ok && tradeRes.ok) {
          const oppJson = await oppRes.json();
          const tradeJson = await tradeRes.json();
          setData({
            rankedOpportunities: Array.isArray(oppJson.rankedOpportunities) ? oppJson.rankedOpportunities : [],
            openPositions: Array.isArray(tradeJson.openPositions) ? tradeJson.openPositions : [],
            trades: Array.isArray(tradeJson.trades) ? tradeJson.trades : [],
          });
        }
      } catch (e) {
        console.error('Error fetching scalper data:', e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header & Pipeline Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-panel-200/40 rounded-xl border border-panel-300 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Layers className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100">MULTI-ASSET ADAPTIVE MICRO-SCALPER</h2>
            <p className="text-xs text-gray-400">Live 50-Coin Opportunity Scanner & Itemized Cost Reconciler</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-lg font-bold">
            0.10% TAKER ENTRY + 0.10% TAKER EXIT FEE MODEL
          </span>
        </div>
      </div>

      {/* Live Opportunity Ranking Table */}
      <Card title="LIVE RANKED OPPORTUNITIES & WHY-NOT-TRADE TRACKER" subtitle="Itemized economic cost breakdown & mathematical reconciliation (Click any row for Why Qualified? details)">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-panel-300 text-gray-400 pb-2">
                <th className="pb-2">RANK</th>
                <th className="pb-2">SYMBOL</th>
                <th className="pb-2">MID PRICE</th>
                <th className="pb-2">POSITION NOTIONAL</th>
                <th className="pb-2">EXPECTED GROSS</th>
                <th className="pb-2">FEE (ENTRY+EXIT)</th>
                <th className="pb-2">SPREAD+SLIP+LATENCY</th>
                <th className="pb-2">TOTAL COSTS</th>
                <th className="pb-2">EXPECTED NET</th>
                <th className="pb-2">MICRO SCORE</th>
                <th className="pb-2 text-right">PIPELINE STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-300/40">
              {data.rankedOpportunities.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-gray-500">
                    Scanning 50 live Binance Spot USDT pairs for cost-aware net-profitable opportunities...
                  </td>
                </tr>
              ) : (
                data.rankedOpportunities.map((opp, idx) => {
                  const entryExitFee = (opp.entryFeeUsd || 1.0) + (opp.exitFeeUsd || 1.0);
                  const otherCosts = (opp.totalCostsUsd || 2.25) - entryExitFee;

                  return (
                    <tr
                      key={opp.id}
                      onClick={() => setSelectedOpp(opp)}
                      className="hover:bg-panel-200/60 cursor-pointer transition-colors"
                    >
                      <td className="py-3 font-bold text-cyan-400">#{idx + 1}</td>
                      <td className="py-3 font-bold text-gray-100 flex items-center gap-1.5">
                        <span>{opp.symbol}</span>
                        <Eye className="w-3.5 h-3.5 text-gray-400 hover:text-cyan-400" />
                      </td>
                      <td className="py-3">${opp.midPrice}</td>
                      <td className="py-3 text-gray-300">${opp.positionNotionalUsd || 1000}</td>
                      <td className="py-3 text-cyan-300 font-bold">
                        +${(opp.expectedGrossUsd || 0).toFixed(2)} (+{opp.expectedGrossMovementPct}%)
                      </td>
                      <td className="py-3 text-rose-400">-${entryExitFee.toFixed(2)}</td>
                      <td className="py-3 text-rose-400">-${otherCosts.toFixed(2)}</td>
                      <td className="py-3 text-rose-400 font-bold">-${(opp.totalCostsUsd || 0).toFixed(2)}</td>
                      <td className={`py-3 font-bold ${opp.expectedNetProfitUsd > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {opp.expectedNetProfitUsd > 0 ? '+' : ''}${opp.expectedNetProfitUsd.toFixed(2)} ({opp.expectedNetProfitPct}%)
                      </td>
                      <td className="py-3 text-purple-400 font-bold">{opp.scalperScore}/100</td>
                      <td className="py-3 text-right">
                        {opp.pipelineStatus === 'PAPER_ENTRY_TRIGGERED' ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                            PAPER ENTRY TRIGGERED
                          </span>
                        ) : opp.pipelineStatus === 'QUALIFIED_READY' ? (
                          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
                            QUALIFIED READY
                          </span>
                        ) : opp.pipelineStatus === 'REJECTED_BY_RISK' ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px]">
                            REJECTED BY RISK: {opp.rejectionReason}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold text-[10px]">
                            {opp.rejectionReason || 'REJECTED'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Open Positions & Trade History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="OPEN PAPER POSITIONS" subtitle="Active short-duration scalper positions">
          <div className="space-y-3">
            {data.openPositions.length === 0 ? (
              <div className="py-6 text-center text-gray-500">
                No active positions. Scanning 50 coins for qualified net-profitable opportunities...
              </div>
            ) : (
              data.openPositions.map((pos) => (
                <div key={pos.id} className="p-3 bg-panel-200/40 rounded-lg border border-panel-300 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-400 block">{pos.symbol} LONG</span>
                    <span className="text-[10px] text-gray-400">Entry: ${pos.entryPrice} | Score: {pos.scalperScore}/100</span>
                  </div>
                  <div className="text-right">
                    <span className="text-cyan-300 font-bold">Holding: {(pos.holdingTimeMs / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="SCALPER PAPER TRADE HISTORY" subtitle="Completed paper executions">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-panel-300 text-gray-400 pb-2">
                  <th className="pb-2">TIME</th>
                  <th className="pb-2">SYMBOL</th>
                  <th className="pb-2">FEES</th>
                  <th className="pb-2">NET P&L</th>
                  <th className="pb-2 text-right">REASON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-300/40">
                {data.trades.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">
                      Evaluating 50 coins for qualified opportunities...
                    </td>
                  </tr>
                ) : (
                  data.trades.slice(0, 5).map((t) => (
                    <tr key={t.id}>
                      <td className="py-2 text-gray-400">{new Date(t.timestamp).toLocaleTimeString()}</td>
                      <td className="py-2 font-bold text-gray-100">{t.symbol}</td>
                      <td className="py-2 text-rose-400">-${t.feeUsd}</td>
                      <td className={`py-2 font-bold ${t.netPnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.netPnlUsd >= 0 ? '+' : ''}${t.netPnlUsd}
                      </td>
                      <td className="py-2 text-right text-gray-300 font-bold">{t.exitReason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* "WHY QUALIFIED?" Detail Panel / Modal (Seventh Requirement) */}
      {selectedOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-panel-100 border border-panel-300 rounded-xl p-6 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto font-mono text-xs">
            <div className="flex justify-between items-center border-b border-panel-300 pb-3">
              <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" /> WHY QUALIFIED? OPPORTUNITY AUDIT PANEL — {selectedOpp.symbol}
              </h3>
              <button onClick={() => setSelectedOpp(null)} className="text-gray-400 hover:text-gray-200 font-bold text-sm">✕</button>
            </div>

            {/* Price Movement & Feature Indicators */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-panel-200/50 rounded-lg border border-panel-300 space-y-1">
                <span className="font-bold text-cyan-400 block text-[11px]">MARKET FEATURES</span>
                <div>Mid Price: <span className="font-bold text-gray-100">${selectedOpp.midPrice}</span></div>
                <div>Entry Ask: <span className="font-bold text-gray-100">${selectedOpp.entryAskPrice}</span></div>
                <div>Expected Gross: <span className="font-bold text-cyan-300">+{selectedOpp.expectedGrossMovementPct}% (+${(selectedOpp.expectedGrossUsd || 0).toFixed(2)})</span></div>
                <div>Volatility Regime: <span className="font-bold text-purple-400">{selectedOpp.volatilityRegime}</span></div>
              </div>

              <div className="p-3 bg-panel-200/50 rounded-lg border border-panel-300 space-y-1">
                <span className="font-bold text-purple-400 block text-[11px]">SIGNAL SCORE & RATIOS</span>
                <div>Micro-Scalp Score: <span className="font-bold text-purple-400">{selectedOpp.scalperScore} / 100</span></div>
                <div>Min Required Score: <span className="font-bold text-gray-400">70 / 100</span></div>
                <div>Spread Cost: <span className="font-bold text-rose-400">-${(selectedOpp.spreadCostUsd || 0.13).toFixed(2)}</span></div>
                <div>Slippage + Latency: <span className="font-bold text-rose-400">-${((selectedOpp.slippageCostUsd || 0.10) + (selectedOpp.latencyCostUsd || 0.025)).toFixed(3)}</span></div>
              </div>
            </div>

            {/* Itemized Cost Reconciliation Waterfall (Fourth, Fifth, Sixth Requirements) */}
            <div className="p-3 bg-panel-200/50 rounded-lg border border-panel-300 space-y-2">
              <span className="font-bold text-emerald-400 block text-[11px]">ITEMIZED ECONOMIC COST RECONCILIATION</span>
              <div className="space-y-1 text-gray-300 text-[11px]">
                <div className="flex justify-between">
                  <span>Position Notional:</span>
                  <span className="font-bold text-gray-100">${selectedOpp.positionNotionalUsd || 1000}.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Expected Gross Profit:</span>
                  <span className="font-bold text-cyan-400">+${(selectedOpp.expectedGrossUsd || 0).toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Entry Fee (0.10% Spot Taker):</span>
                  <span className="font-bold text-rose-400">-${(selectedOpp.entryFeeUsd || 1.0).toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Exit Fee (0.10% Spot Taker):</span>
                  <span className="font-bold text-rose-400">-${(selectedOpp.exitFeeUsd || 1.0).toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Spread Cost:</span>
                  <span className="font-bold text-rose-400">-${(selectedOpp.spreadCostUsd || 0.13).toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Slippage Cost (0.01% VWAP):</span>
                  <span className="font-bold text-rose-400">-${(selectedOpp.slippageCostUsd || 0.10).toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Latency Cost (50ms impact):</span>
                  <span className="font-bold text-rose-400">-${(selectedOpp.latencyCostUsd || 0.025).toFixed(4)}</span>
                </div>
                <div className="flex justify-between border-t border-panel-300 pt-1 font-bold text-gray-100">
                  <span>Total Estimated Costs:</span>
                  <span className="text-rose-400">-${(selectedOpp.totalCostsUsd || 0).toFixed(4)}</span>
                </div>
                <div className="flex justify-between border-t border-panel-300 pt-1 font-bold text-gray-100">
                  <span>Expected Net Profit:</span>
                  <span className={selectedOpp.expectedNetProfitUsd > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {selectedOpp.expectedNetProfitUsd > 0 ? '+' : ''}${selectedOpp.expectedNetProfitUsd.toFixed(4)} ({selectedOpp.expectedNetProfitPct}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Condition Gate Evaluation */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-2.5 bg-panel-200/50 rounded-lg border border-panel-300 text-center space-y-1">
                <span className="text-gray-400 text-[10px] block font-bold">ENTRY CONDITIONS</span>
                <span className={`font-bold text-xs ${selectedOpp.scalperScore >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedOpp.scalperScore >= 70 ? 'PASS' : 'FAIL'}
                </span>
              </div>
              <div className="p-2.5 bg-panel-200/50 rounded-lg border border-panel-300 text-center space-y-1">
                <span className="text-gray-400 text-[10px] block font-bold">RISK CONDITIONS</span>
                <span className={`font-bold text-xs ${!selectedOpp.rejectionReason || selectedOpp.rejectionReason !== 'MAX_POSITIONS_REACHED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {!selectedOpp.rejectionReason || selectedOpp.rejectionReason !== 'MAX_POSITIONS_REACHED' ? 'PASS' : 'FAIL'}
                </span>
              </div>
              <div className="p-2.5 bg-panel-200/50 rounded-lg border border-panel-300 text-center space-y-1">
                <span className="text-gray-400 text-[10px] block font-bold">EXECUTION CONDITIONS</span>
                <span className={`font-bold text-xs ${selectedOpp.expectedNetProfitUsd >= 0.15 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedOpp.expectedNetProfitUsd >= 0.15 ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOpp(null)}
              className="w-full py-2 bg-panel-200 hover:bg-panel-300 text-gray-200 font-bold rounded-lg border border-panel-300"
            >
              CLOSE AUDIT PANEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
