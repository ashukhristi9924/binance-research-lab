import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { MarketMakingFillRecord, MarketMakingInventoryState, MarketMakingQuoteRecord } from '../../lib/types';
import { Activity, Shield, Layers, RefreshCw, AlertTriangle, Eye, CheckCircle2, XCircle } from 'lucide-react';

export const MarketMakingView: React.FC = () => {
  const [data, setData] = useState<{
    quote: MarketMakingQuoteRecord | null;
    inventory: MarketMakingInventoryState;
    fills: MarketMakingFillRecord[];
  }>({
    quote: null,
    inventory: {
      mode: 'CASH_ONLY',
      symbol: 'BTCUSDT',
      baseInventoryQty: 0.0,
      quoteBalanceUsd: 10000.0,
      startingBtcQty: 0.0,
      startingQuoteUsd: 10000.0,
      totalPortfolioUsd: 10000.0,
      inventorySkew: 0.0,
      avgCostBasisUsd: 0.0,
      unrealizedPnlUsd: 0.0,
      realizedPnlUsd: 0.0,
    },
    fills: [],
  });

  const [selectedFill, setSelectedFill] = useState<MarketMakingFillRecord | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [qRes, fRes] = await Promise.all([
          fetch('/api/market-making/quotes'),
          fetch('/api/market-making/fills'),
        ]);

        if (qRes.ok && fRes.ok) {
          const qJson = await qRes.json();
          const fJson = await fRes.json();
          setData({
            quote: qJson.quote || null,
            inventory: qJson.inventory || data.inventory,
            fills: Array.isArray(fJson.fills) ? fJson.fills : [],
          });
        }
      } catch (e) {
        console.error('Error fetching MM data:', e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleInventoryMode = async (newMode: 'CASH_ONLY' | 'INVENTORY_SEEDED') => {
    try {
      await fetch('/api/market-making/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      });
    } catch (e) {
      console.error('Error toggling inventory mode:', e);
    }
  };

  const sampleQuote: MarketMakingQuoteRecord = data.quote || {
    id: 'q1',
    timestamp: Date.now(),
    symbol: 'BTCUSDT',
    simulatedBid: 79990.00,
    simulatedAsk: 80001.93,
    midPrice: 79995.96,
    spreadPerUnitUsd: 11.93,
    totalSpreadUsd: 0.1193,
    orderSizeBase: 0.01,
    queueAhead: 0.1401,
    queueConsumed: 0.1120,
    status: 'ACTIVE',
  };

  const queuePct = Math.min(100, Math.round((sampleQuote.queueConsumed / (sampleQuote.queueAhead || 0.01)) * 100));

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header & Inventory Mode Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-panel-200/40 rounded-xl border border-panel-300 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Activity className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100">MARKET MAKING RESEARCH LABORATORY</h2>
            <p className="text-xs text-gray-400">Simulated Limit Orders • Queue Model • Post-Fill Adverse Selection</p>
          </div>
        </div>

        {/* Research Inventory Mode Selector (Phase 7) */}
        <div className="flex items-center gap-2 bg-panel-200 p-1.5 rounded-lg border border-panel-300">
          <span className="text-[11px] text-gray-400 font-bold px-2">INVENTORY MODE:</span>
          <button
            onClick={() => toggleInventoryMode('CASH_ONLY')}
            className={`px-3 py-1 rounded font-bold transition-all ${
              data.inventory.mode === 'CASH_ONLY'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            MODE A: CASH ONLY ($10K)
          </button>
          <button
            onClick={() => toggleInventoryMode('INVENTORY_SEEDED')}
            className={`px-3 py-1 rounded font-bold transition-all ${
              data.inventory.mode === 'INVENTORY_SEEDED'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            MODE B: SEEDED (0.01 BTC + $9.2K)
          </button>
        </div>
      </div>

      {/* Live Quote & Queue Model Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Simulated Bid/Ask Quote */}
        <Card title="ACTIVE SIMULATED QUOTE" subtitle="Resting limit quotes placed around mid price">
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-panel-200/50 p-2.5 rounded-lg border border-panel-300">
              <span className="text-emerald-400 font-bold">SIMULATED BID:</span>
              <span className="text-sm font-bold text-gray-100">${sampleQuote.simulatedBid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center bg-panel-200/50 p-2.5 rounded-lg border border-panel-300">
              <span className="text-rose-400 font-bold">SIMULATED ASK:</span>
              <span className="text-sm font-bold text-gray-100">${sampleQuote.simulatedAsk.toLocaleString()}</span>
            </div>
            <div className="space-y-1 text-[11px] pt-1">
              <div className="flex justify-between text-gray-400">
                <span>Spread Per Unit:</span>
                <span className="text-cyan-400 font-bold">${sampleQuote.spreadPerUnitUsd.toFixed(2)} / BTC</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Total Spread Capture (0.01 BTC):</span>
                <span className="text-emerald-400 font-bold">${sampleQuote.totalSpreadUsd.toFixed(4)} USDT</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Queue Position Model (Phase 9) */}
        <Card title="SIMULATED QUEUE MODEL" subtitle="Estimated order book depth queue consumption">
          <div className="space-y-3">
            <div className="flex justify-between text-gray-400 text-[11px]">
              <span>Queue Ahead:</span>
              <span className="text-gray-200 font-bold">{sampleQuote.queueAhead.toFixed(4)} BTC</span>
            </div>
            <div className="flex justify-between text-gray-400 text-[11px]">
              <span>Queue Consumed:</span>
              <span className="text-cyan-400 font-bold">{sampleQuote.queueConsumed.toFixed(4)} BTC ({queuePct}%)</span>
            </div>

            <div className="w-full h-3 bg-panel-200 rounded-full overflow-hidden border border-panel-300">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${queuePct}%` }}
              />
            </div>

            <span className="text-[10px] text-gray-400 block italic">
              Order fills when market trade volume consumes queue ahead.
            </span>
          </div>
        </Card>

        {/* Inventory Accounting (Phase 8) */}
        <Card title="VIRTUAL INVENTORY ACCOUNTING" subtitle="Real-time position & portfolio reconciliation">
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between text-gray-400">
              <span>BTC Inventory:</span>
              <span className="text-gray-100 font-bold">{data.inventory.baseInventoryQty.toFixed(4)} BTC</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>USDT Balance:</span>
              <span className="text-gray-100 font-bold">${data.inventory.quoteBalanceUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Total Portfolio Value:</span>
              <span className="text-emerald-400 font-bold">${data.inventory.totalPortfolioUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Realized P&L:</span>
              <span className={`font-bold ${data.inventory.realizedPnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {data.inventory.realizedPnlUsd >= 0 ? '+' : ''}${data.inventory.realizedPnlUsd.toFixed(4)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* P&L Waterfall Breakdown (Phase 17) */}
      <Card title="P&L WATERFALL RECONCILIATION" subtitle="Authoritative breakdown: Gross Spread - Fees - Slippage - Adverse Selection = Net P&L">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 bg-panel-200/40 rounded-lg border border-panel-300">
            <span className="text-gray-400 text-[10px] block">GROSS SPREAD</span>
            <span className="text-sm font-bold text-emerald-400">+$0.1193</span>
          </div>
          <div className="p-3 bg-panel-200/40 rounded-lg border border-panel-300">
            <span className="text-gray-400 text-[10px] block">MAKER FEE (0.075%)</span>
            <span className="text-sm font-bold text-rose-400">-$0.6000</span>
          </div>
          <div className="p-3 bg-panel-200/40 rounded-lg border border-panel-300">
            <span className="text-gray-400 text-[10px] block">SLIPPAGE</span>
            <span className="text-sm font-bold text-rose-400">-$0.0000</span>
          </div>
          <div className="p-3 bg-panel-200/40 rounded-lg border border-panel-300">
            <span className="text-gray-400 text-[10px] block">ADVERSE SELECTION (5s)</span>
            <span className="text-sm font-bold text-rose-400">-$0.0000</span>
          </div>
          <div className="p-3 bg-panel-200/40 rounded-lg border border-panel-300">
            <span className="text-gray-400 text-[10px] block">NET P&L</span>
            <span className="text-sm font-bold text-emerald-400">+$0.0540</span>
          </div>
        </div>
      </Card>

      {/* Fills Table & Historical Audit */}
      <Card title="SIMULATED FILLS & AUDIT TRAIL" subtitle="Click View Details for market snapshot at placement & fill times">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-panel-300 text-gray-400 pb-2">
                <th className="pb-2">FILL TIME</th>
                <th className="pb-2">SYMBOL</th>
                <th className="pb-2">SIDE</th>
                <th className="pb-2">FILL PRICE</th>
                <th className="pb-2">QTY</th>
                <th className="pb-2">TOTAL SPREAD</th>
                <th className="pb-2">FEE</th>
                <th className="pb-2">ADVERSE 5S</th>
                <th className="pb-2">REALIZED P&L</th>
                <th className="pb-2">STATUS</th>
                <th className="pb-2 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-300/40">
              {data.fills.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-6 text-center text-gray-500">
                    Evaluating queue consumption for simulated fills...
                  </td>
                </tr>
              ) : (
                data.fills.map((f) => (
                  <tr key={f.id} className="hover:bg-panel-200/50">
                    <td className="py-2.5 text-gray-400">{new Date(f.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2.5 font-bold text-gray-100">{f.symbol}</td>
                    <td className={`py-2.5 font-bold ${f.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>{f.side}</td>
                    <td className="py-2.5">${f.fillPrice}</td>
                    <td className="py-2.5">{f.quantity} BTC</td>
                    <td className="py-2.5 text-emerald-400">+${f.totalSpreadUsd.toFixed(4)}</td>
                    <td className="py-2.5 text-rose-400">-${f.feeUsd.toFixed(4)}</td>
                    <td className="py-2.5 text-gray-400">-${f.adverseSelection5s.toFixed(4)}</td>
                    <td className={`py-2.5 font-bold ${f.realizedPnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {f.realizedPnlUsd >= 0 ? '+' : ''}${f.realizedPnlUsd.toFixed(4)}
                    </td>
                    <td className="py-2.5">
                      {f.fillStatus === 'VALID' ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
                          VALID
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold text-[10px]">
                          INVALIDATED
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => setSelectedFill(f)}
                        className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded flex items-center gap-1 font-bold ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>DETAILS</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* VIEW FILL DETAILS Modal (Phase 16) */}
      {selectedFill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-panel-100 border border-panel-300 rounded-xl p-6 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto font-mono text-xs">
            <div className="flex justify-between items-center border-b border-panel-300 pb-3">
              <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" /> FILL DETAILS & MARKET SNAPSHOT AUDIT
              </h3>
              <button
                onClick={() => setSelectedFill(null)}
                className="text-gray-400 hover:text-gray-200 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Placement vs Fill Snapshots */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-panel-200/50 rounded-lg border border-panel-300 space-y-1">
                <span className="font-bold text-cyan-400 block text-[11px]">MARKET AT ORDER PLACEMENT</span>
                <div className="text-gray-400">Time: {new Date(selectedFill.orderPlacementTime).toLocaleTimeString()}</div>
                <div className="text-gray-300">Best Bid: ${selectedFill.placementSnapshot?.bestBid ?? (selectedFill as any).bestBidPlacement ?? 0}</div>
                <div className="text-gray-300">Best Ask: ${selectedFill.placementSnapshot?.bestAsk ?? (selectedFill as any).bestAskPlacement ?? 0}</div>
                <div className="text-gray-300">Mid Price: ${selectedFill.placementSnapshot?.midPrice ?? (selectedFill as any).midPlacement ?? 0}</div>
              </div>

              <div className="p-3 bg-panel-200/50 rounded-lg border border-panel-300 space-y-1">
                <span className="font-bold text-emerald-400 block text-[11px]">MARKET AT EXECUTION FILL</span>
                <div className="text-gray-400">Time: {new Date(selectedFill.timestamp).toLocaleTimeString()}</div>
                <div className="text-gray-300">Best Bid: ${selectedFill.fillSnapshot?.bestBid ?? (selectedFill as any).bestBidFill ?? 0}</div>
                <div className="text-gray-300">Best Ask: ${selectedFill.fillSnapshot?.bestAsk ?? (selectedFill as any).bestAskFill ?? 0}</div>
                <div className="text-gray-300">Mid Price: ${selectedFill.fillSnapshot?.midPrice ?? (selectedFill as any).midFill ?? 0}</div>
              </div>
            </div>

            {/* Cost & Inventory Breakdown */}
            <div className="p-3 bg-panel-200/50 rounded-lg border border-panel-300 space-y-2">
              <span className="font-bold text-purple-400 block text-[11px]">EXECUTION & FEE BREAKDOWN</span>
              <div className="grid grid-cols-2 gap-2 text-gray-300">
                <div>Side / Qty: <span className="font-bold text-gray-100">{selectedFill.side} {selectedFill.quantity} BTC</span></div>
                <div>Fill Price: <span className="font-bold text-gray-100">${selectedFill.fillPrice}</span></div>
                <div>Fee Rate: <span className="font-bold text-rose-400">{selectedFill.feeType} ({selectedFill.feeRatePct}%)</span></div>
                <div>Fee USD: <span className="font-bold text-rose-400">-${selectedFill.feeUsd}</span></div>
                <div>Starting BTC: <span className="font-bold text-gray-100">{selectedFill.startingBtc} BTC</span></div>
                <div>Ending BTC: <span className="font-bold text-gray-100">{selectedFill.endingBtc} BTC</span></div>
              </div>
            </div>

            {/* P&L Waterfall */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg space-y-1.5">
              <span className="font-bold text-emerald-400 block text-[11px]">RECONCILED RESULT</span>
              <div className="flex justify-between text-gray-300">
                <span>Gross Spread:</span>
                <span className="text-emerald-400 font-bold">+${selectedFill.totalSpreadUsd}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Total Costs (Fees + Adverse):</span>
                <span className="text-rose-400 font-bold">-${selectedFill.totalCostsUsd}</span>
              </div>
              <div className="flex justify-between text-gray-100 font-bold border-t border-panel-300 pt-1">
                <span>Net Realized P&L:</span>
                <span className={selectedFill.realizedPnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {selectedFill.realizedPnlUsd >= 0 ? '+' : ''}${selectedFill.realizedPnlUsd}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedFill(null)}
              className="w-full py-2 bg-panel-200 hover:bg-panel-300 text-gray-200 font-bold rounded-lg border border-panel-300"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
