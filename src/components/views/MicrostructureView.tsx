import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { MicrostructureFeatureSet, MicrostructureTradeRecord } from '../../lib/types';
import { Zap, Activity, Clock, Shield, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

export const MicrostructureView: React.FC = () => {
  const [symbol, setSymbol] = useState<'BTCUSDT' | 'ETHUSDT' | 'BNBUSDT' | 'SOLUSDT'>('BTCUSDT');
  const [data, setData] = useState<{
    activeSignal: MicrostructureFeatureSet | null;
    openPositions: MicrostructureTradeRecord[];
    trades: MicrostructureTradeRecord[];
  }>({
    activeSignal: null,
    openPositions: [],
    trades: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/microstructure/trades?symbol=${symbol}&limit=50`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error('Error fetching microstructure data:', e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, [symbol]);

  const signal = data.activeSignal || {
    symbol,
    timestamp: Date.now(),
    midPrice: 70000,
    spreadUsd: 0.1,
    spreadPct: 0.0014,
    imbalanceTop5: 0.25,
    imbalanceTop10: 0.32,
    imbalanceTop20: 0.28,
    depthImbalance01: 0.55,
    tradeFlowRatio: 1.45,
    tradesPerSec: 12.4,
    volumePerSec: 1.85,
    momentum1s: 0.02,
    momentum3s: 0.05,
    momentum5s: 0.08,
    momentum10s: 0.12,
    momentum30s: 0.25,
    volatility: 1.2,
    signalScore: 78,
    signalDirection: 'LONG' as const,
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header & Symbol Selector */}
      <div className="flex items-center justify-between p-4 bg-panel-200/40 rounded-xl border border-panel-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <Zap className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100">ORDER-BOOK MICROSTRUCTURE RESEARCH</h2>
            <p className="text-xs text-gray-400">Short-Term Predictive Order-Book & Trade Flow Dynamics</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Target Symbol:</span>
            <select
              value={symbol}
              onChange={(e: any) => setSymbol(e.target.value)}
              className="px-3 py-1.5 bg-panel-200 border border-panel-300 rounded-lg text-cyan-400 font-bold focus:outline-none"
            >
              <option value="BTCUSDT">BTCUSDT</option>
              <option value="ETHUSDT">ETHUSDT</option>
              <option value="BNBUSDT">BNBUSDT</option>
              <option value="SOLUSDT">SOLUSDT</option>
            </select>
          </div>

          <div className="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-lg font-bold">
            RESEARCH MODE
          </div>
        </div>
      </div>

      {/* Main Signal & Indicators Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Composite Research Score Card */}
        <Card className="border-l-4 border-l-purple-500 flex flex-col justify-between">
          <span className="text-gray-400 text-[10px] font-bold">COMPOSITE RESEARCH SCORE</span>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-purple-400">{signal.signalScore}</span>
            <span className="text-sm text-gray-400">/ 100</span>
          </div>
          <div className="p-2 bg-panel-200/60 rounded border border-panel-300 text-[10px] text-gray-400">
            RESEARCH SCORE (Not win probability). Formed by Imbalance + Flow + Momentum.
          </div>
        </Card>

        {/* Current Signal Direction */}
        <Card className="border-l-4 border-l-cyan-500 flex flex-col justify-between">
          <span className="text-gray-400 text-[10px] font-bold">CURRENT SIGNAL DIRECTION</span>
          <div className="my-3 flex items-center gap-2">
            {signal.signalDirection === 'LONG' ? (
              <div className="flex items-center gap-2 text-emerald-400 text-2xl font-bold">
                <ArrowUpRight className="w-8 h-8" />
                <span>LONG</span>
              </div>
            ) : signal.signalDirection === 'SHORT' ? (
              <div className="flex items-center gap-2 text-rose-400 text-2xl font-bold">
                <ArrowDownRight className="w-8 h-8" />
                <span>SHORT</span>
              </div>
            ) : (
              <span className="text-gray-400 text-2xl font-bold">NEUTRAL</span>
            )}
          </div>
          <div className="text-[11px] text-gray-400">Mid Price: ${signal.midPrice}</div>
        </Card>

        {/* Order Book Imbalance (Top 10) */}
        <Card className="border-l-4 border-l-amber-500 flex flex-col justify-between">
          <span className="text-gray-400 text-[10px] font-bold">ORDER BOOK IMBALANCE (TOP 10)</span>
          <div className="my-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${signal.imbalanceTop10 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {signal.imbalanceTop10 >= 0 ? '+' : ''}{(signal.imbalanceTop10 * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-gray-400">Net Bid Vol</span>
          </div>
          <div className="text-[11px] text-gray-400">
            Top 5: {(signal.imbalanceTop5 * 100).toFixed(1)}% | Top 20: {(signal.imbalanceTop20 * 100).toFixed(1)}%
          </div>
        </Card>

        {/* Trade Flow Buy/Sell Ratio */}
        <Card className="border-l-4 border-l-emerald-500 flex flex-col justify-between">
          <span className="text-gray-400 text-[10px] font-bold">TRADE FLOW BUY/SELL RATIO</span>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">{signal.tradeFlowRatio.toFixed(2)}x</span>
            <span className="text-xs text-gray-400">Pressure</span>
          </div>
          <div className="text-[11px] text-gray-400">
            Trades/Sec: {signal.tradesPerSec} | Vol/Sec: {signal.volumePerSec}
          </div>
        </Card>
      </div>

      {/* Microstructure Feature Details & Short-Term Momentum */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="SHORT-TERM PRICE MOMENTUM & RETURNS" subtitle="Return metrics evaluated over ultra-short time horizons">
          <div className="grid grid-cols-5 gap-3 text-center">
            <div className="p-3 bg-panel-200/50 rounded-lg border border-panel-300">
              <span className="text-gray-400 text-[10px] block">1s Return</span>
              <span className={`font-bold mt-1 block ${signal.momentum1s >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {signal.momentum1s >= 0 ? '+' : ''}{signal.momentum1s}%
              </span>
            </div>
            <div className="p-3 bg-panel-200/50 rounded-lg border border-panel-300">
              <span className="text-gray-400 text-[10px] block">3s Return</span>
              <span className={`font-bold mt-1 block ${signal.momentum3s >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {signal.momentum3s >= 0 ? '+' : ''}{signal.momentum3s}%
              </span>
            </div>
            <div className="p-3 bg-panel-200/50 rounded-lg border border-panel-300">
              <span className="text-gray-400 text-[10px] block">5s Return</span>
              <span className={`font-bold mt-1 block ${signal.momentum5s >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {signal.momentum5s >= 0 ? '+' : ''}{signal.momentum5s}%
              </span>
            </div>
            <div className="p-3 bg-panel-200/50 rounded-lg border border-panel-300">
              <span className="text-gray-400 text-[10px] block">10s Return</span>
              <span className={`font-bold mt-1 block ${signal.momentum10s >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {signal.momentum10s >= 0 ? '+' : ''}{signal.momentum10s}%
              </span>
            </div>
            <div className="p-3 bg-panel-200/50 rounded-lg border border-panel-300">
              <span className="text-gray-400 text-[10px] block">30s Return</span>
              <span className={`font-bold mt-1 block ${signal.momentum30s >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {signal.momentum30s >= 0 ? '+' : ''}{signal.momentum30s}%
              </span>
            </div>
          </div>
        </Card>

        <Card title="ORDER BOOK DEPTH & SPREAD QUALITY" subtitle="Spread and liquidity indicators">
          <div className="space-y-2">
            <div className="flex justify-between p-2 bg-panel-200/40 rounded border border-panel-300">
              <span className="text-gray-400">Bid-Ask Spread:</span>
              <span className="font-bold text-gray-200">${signal.spreadUsd} ({signal.spreadPct}%)</span>
            </div>
            <div className="flex justify-between p-2 bg-panel-200/40 rounded border border-panel-300">
              <span className="text-gray-400">Depth Imbalance (0.01% of Mid):</span>
              <span className="font-bold text-cyan-400">{(signal.depthImbalance01 * 100).toFixed(1)}% Bid Depth</span>
            </div>
            <div className="flex justify-between p-2 bg-panel-200/40 rounded border border-panel-300">
              <span className="text-gray-400">Short-Term Volatility:</span>
              <span className="font-bold text-purple-400">{signal.volatility}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Trade History Table */}
      <Card title="MICROSTRUCTURE PAPER TRADE HISTORY" subtitle="Ultra short-term paper executions with fees, slippage, and signal scores">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-panel-300 text-gray-400 pb-2">
                <th className="pb-2">TIME</th>
                <th className="pb-2">SYMBOL</th>
                <th className="pb-2">DIRECTION</th>
                <th className="pb-2">ENTRY</th>
                <th className="pb-2">EXIT</th>
                <th className="pb-2">HOLDING TIME</th>
                <th className="pb-2">SCORE</th>
                <th className="pb-2">FEES</th>
                <th className="pb-2">NET P&L</th>
                <th className="pb-2 text-right">EXIT REASON</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-300/40">
              {data.trades.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-gray-500">
                    Evaluating live market data for qualified microstructure signals...
                  </td>
                </tr>
              ) : (
                data.trades.map((t) => (
                  <tr key={t.id} className="hover:bg-panel-200/50">
                    <td className="py-2.5 text-gray-400">{new Date(t.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2.5 font-bold text-gray-200">{t.symbol}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded font-bold ${t.direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {t.direction}
                      </span>
                    </td>
                    <td className="py-2.5">${t.entryPrice}</td>
                    <td className="py-2.5">${t.exitPrice}</td>
                    <td className="py-2.5 text-cyan-300">{(t.holdingTimeMs / 1000).toFixed(1)}s</td>
                    <td className="py-2.5 text-purple-400 font-bold">{t.signalScore}/100</td>
                    <td className="py-2.5 text-rose-400">-${t.feeUsd}</td>
                    <td className={`py-2.5 font-bold ${t.netPnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.netPnlUsd >= 0 ? '+' : ''}${t.netPnlUsd} ({t.netPnlPct >= 0 ? '+' : ''}{t.netPnlPct}%)
                    </td>
                    <td className="py-2.5 text-right font-bold text-gray-300">{t.exitReason}</td>
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
