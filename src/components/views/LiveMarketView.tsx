import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { PriceBookTicker } from '../../lib/types';
import { Search, ArrowUpDown } from 'lucide-react';

interface LiveMarketViewProps {
  tickers: PriceBookTicker[];
}

export const LiveMarketView: React.FC<LiveMarketViewProps> = ({ tickers }) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'symbol' | 'bidPrice' | 'askPrice' | 'spreadPct'>('symbol');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = tickers.filter((t) => t.symbol.toLowerCase().includes(search.toLowerCase()));

  filtered.sort((a, b) => {
    let valA: any = sortField === 'spreadPct' ? (a.bidPrice > 0 ? ((a.askPrice - a.bidPrice) / a.bidPrice) * 100 : 0) : (a as any)[sortField];
    let valB: any = sortField === 'spreadPct' ? (b.bidPrice > 0 ? ((b.askPrice - b.bidPrice) / b.bidPrice) * 100 : 0) : (b as any)[sortField];

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: 'symbol' | 'bidPrice' | 'askPrice' | 'spreadPct') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <Card
      title="BINANCE LIVE MARKET PAIRS"
      subtitle="Real-time order book top-of-book tickers streaming via WebSocket"
      action={
        <div className="relative font-mono text-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search pair (e.g. BTC, ETH)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-panel-200 border border-panel-300 rounded-lg text-gray-200 focus:outline-none focus:border-cyan-500 w-64"
          />
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-panel-300 text-gray-400 pb-2">
              <th className="pb-2 cursor-pointer hover:text-white" onClick={() => toggleSort('symbol')}>
                <div className="flex items-center gap-1">SYMBOL <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="pb-2 cursor-pointer hover:text-white" onClick={() => toggleSort('bidPrice')}>
                <div className="flex items-center gap-1">BEST BID <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="pb-2">BID QTY</th>
              <th className="pb-2 cursor-pointer hover:text-white" onClick={() => toggleSort('askPrice')}>
                <div className="flex items-center gap-1">BEST ASK <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="pb-2">ASK QTY</th>
              <th className="pb-2">SPREAD</th>
              <th className="pb-2 cursor-pointer hover:text-white" onClick={() => toggleSort('spreadPct')}>
                <div className="flex items-center gap-1">SPREAD % <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="pb-2 text-right">LAST UPDATE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-panel-300/40">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-gray-500">
                  No market pairs matching search criteria.
                </td>
              </tr>
            ) : (
              filtered.map((t) => {
                const spread = Math.max(0, t.askPrice - t.bidPrice);
                const spreadPct = t.bidPrice > 0 ? (spread / t.bidPrice) * 100 : 0;
                const ageMs = Date.now() - t.updatedAt;

                return (
                  <tr key={t.symbol} className="hover:bg-panel-200/50 transition-colors">
                    <td className="py-2.5 font-bold text-gray-200">{t.symbol}</td>
                    <td className="py-2.5 text-emerald-400 font-semibold">{t.bidPrice}</td>
                    <td className="py-2.5 text-gray-400">{t.bidQty}</td>
                    <td className="py-2.5 text-rose-400 font-semibold">{t.askPrice}</td>
                    <td className="py-2.5 text-gray-400">{t.askQty}</td>
                    <td className="py-2.5 text-gray-300">{spread.toFixed(8)}</td>
                    <td className="py-2.5 text-cyan-400">{spreadPct.toFixed(4)}%</td>
                    <td className="py-2.5 text-right text-gray-500">{ageMs} ms ago</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
