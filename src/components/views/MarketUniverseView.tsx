import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { UniversePairInfo } from '../../lib/types';
import { Layers, Activity, RefreshCw } from 'lucide-react';

export const MarketUniverseView: React.FC = () => {
  const [universe, setUniverse] = useState<UniversePairInfo[]>([]);
  const [targetSize, setTargetSize] = useState<number>(50);

  useEffect(() => {
    const fetchUniverse = async () => {
      try {
        const res = await fetch('/api/scalper/universe');
        if (res.ok) {
          const json = await res.json();
          setUniverse(json.universe || []);
          setTargetSize(json.targetSize || 50);
        }
      } catch (e) {
        console.error('Error fetching universe:', e);
      }
    };

    fetchUniverse();
    const interval = setInterval(fetchUniverse, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-panel-200/40 rounded-xl border border-panel-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Layers className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100">DYNAMIC MARKET UNIVERSE MANAGER</h2>
            <p className="text-xs text-gray-400">Live Quality Rankings Across {targetSize} Binance Spot USDT Pairs</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-gray-400 font-bold">Universe Size:</span>
          {[25, 50, 75, 100].map((sz) => (
            <button
              key={sz}
              onClick={() => setTargetSize(sz)}
              className={`px-3 py-1 rounded font-bold transition-all ${
                targetSize === sz ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-panel-200 text-gray-400'
              }`}
            >
              {sz} Pairs
            </button>
          ))}
        </div>
      </div>

      {/* Universe Table */}
      <Card title="ACTIVE MARKET UNIVERSE RANKINGS" subtitle="Selected and ranked by 24h volume, spread, depth, trade frequency & liquidity quality">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-panel-300 text-gray-400 pb-2">
                <th className="pb-2">RANK</th>
                <th className="pb-2">SYMBOL</th>
                <th className="pb-2">24H VOLUME</th>
                <th className="pb-2">SPREAD %</th>
                <th className="pb-2">DEPTH (USD)</th>
                <th className="pb-2">VOLATILITY</th>
                <th className="pb-2">TRADES/SEC</th>
                <th className="pb-2">LIQUIDITY SCORE</th>
                <th className="pb-2 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-300/40">
              {universe.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-gray-500">
                    Loading dynamic market universe rankings...
                  </td>
                </tr>
              ) : (
                universe.map((pair) => (
                  <tr key={pair.symbol} className="hover:bg-panel-200/50">
                    <td className="py-2.5 font-bold text-cyan-400">#{pair.rank}</td>
                    <td className="py-2.5 font-bold text-gray-100">{pair.symbol}</td>
                    <td className="py-2.5 text-gray-300">${(pair.volume24hUsd / 1000000).toFixed(1)}M</td>
                    <td className="py-2.5 text-emerald-400">{pair.spreadPct}%</td>
                    <td className="py-2.5 text-cyan-300">${pair.orderBookDepthUsd.toLocaleString()}</td>
                    <td className="py-2.5 text-purple-400">{pair.volatilityPct}%</td>
                    <td className="py-2.5 text-gray-300">{pair.tradeFrequencyPerSec} /s</td>
                    <td className="py-2.5 font-bold text-emerald-400">{pair.liquidityScore}/100</td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                        ACTIVE
                      </span>
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
