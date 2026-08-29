import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { DebugPanel } from '../dashboard/DebugPanel';
import { ArbitrageOpportunityCalc, PaperTradeRecord, PriceBookTicker } from '../../lib/types';
import { TrendingUp, Wallet, Award, Activity, Layers, Scale } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface DashboardViewProps {
  opportunities?: ArbitrageOpportunityCalc[];
  paperTrades?: PaperTradeRecord[];
  tickers?: PriceBookTicker[];
  account?: any;
  status?: any;
  onSelectPath?: (opp: ArbitrageOpportunityCalc) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  opportunities = [],
  paperTrades = [],
  tickers = [],
  account,
  status = {},
  onSelectPath,
}) => {
  const safeOpportunities = Array.isArray(opportunities) ? opportunities : [];
  const safeTrades = Array.isArray(paperTrades) ? paperTrades : [];
  const safeTickers = Array.isArray(tickers) ? tickers : [];

  const currentBalance = account?.virtualBalanceUsd || 10000.0;
  const initialCapital = account?.initialCapitalUsd || 10000.0;
  const totalNetPnl = account?.netPnlUsd || 0.0;
  const roiPct = initialCapital > 0 ? (totalNetPnl / initialCapital) * 100 : 0;
  const winRate = account?.winRatePct || 0.0;
  const totalTrades = account?.totalTrades || 0;

  const counters = status?.counters || {
    uniqueCyclesMonitored: status?.discoveredCyclesCount || 0,
    rawCalculations: 0,
    theoreticalOpportunities: 0,
    profitableAfterFees: 0,
    executableAfterLiquidity: 0,
    paperExecutions: safeTrades.length,
  };

  const pnlTrendData = safeTrades
    .slice()
    .reverse()
    .map((t, idx) => ({
      trade: `#${idx + 1}`,
      pnl: t.netProfitUsd,
      cumPnl: safeTrades.slice(0, idx + 1).reduce((acc, curr) => acc + curr.netProfitUsd, 0),
    }));

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Debug Panel */}
      <DebugPanel status={status} opportunitiesCount={safeOpportunities.length} />

      {/* Requirement 12: 6 Distinct Opportunity Counters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
        <div className="p-3 bg-panel-100 border border-panel-300 rounded-xl">
          <span className="text-gray-400 block text-[10px]">1. CYCLES MONITORED</span>
          <span className="text-lg font-bold text-cyan-400 mt-0.5 block">{counters.uniqueCyclesMonitored}</span>
        </div>
        <div className="p-3 bg-panel-100 border border-panel-300 rounded-xl">
          <span className="text-gray-400 block text-[10px]">2. RAW CALCULATIONS</span>
          <span className="text-lg font-bold text-gray-200 mt-0.5 block">{counters.rawCalculations?.toLocaleString() || 0}</span>
        </div>
        <div className="p-3 bg-panel-100 border border-panel-300 rounded-xl">
          <span className="text-gray-400 block text-[10px]">3. THEORETICAL OPPS</span>
          <span className="text-lg font-bold text-amber-400 mt-0.5 block">{counters.theoreticalOpportunities}</span>
        </div>
        <div className="p-3 bg-panel-100 border border-panel-300 rounded-xl">
          <span className="text-gray-400 block text-[10px]">4. PROFIT AFTER FEES</span>
          <span className="text-lg font-bold text-purple-400 mt-0.5 block">{counters.profitableAfterFees}</span>
        </div>
        <div className="p-3 bg-panel-100 border border-panel-300 rounded-xl">
          <span className="text-gray-400 block text-[10px]">5. EXECUTABLE LIQUIDITY</span>
          <span className="text-lg font-bold text-emerald-400 mt-0.5 block">{counters.executableAfterLiquidity}</span>
        </div>
        <div className="p-3 bg-panel-100 border border-panel-300 rounded-xl">
          <span className="text-gray-400 block text-[10px]">6. PAPER EXECUTIONS</span>
          <span className="text-lg font-bold text-emerald-300 mt-0.5 block">{counters.paperExecutions}</span>
        </div>
      </div>

      {/* Main Account Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span>VIRTUAL BALANCE</span>
            <Wallet className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className="text-2xl font-bold text-gray-100">${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="text-xs text-gray-400">USDT</span>
          </div>
          <div className="mt-2 text-xs font-mono text-gray-400">Initial: ${initialCapital.toLocaleString()}</div>
        </Card>

        <Card className={`border-l-4 ${totalNetPnl >= 0 ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span>REALISTIC NET P&L</span>
            <TrendingUp className={`w-4 h-4 ${totalNetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className={`text-2xl font-bold ${totalNetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalNetPnl >= 0 ? '+' : ''}${totalNetPnl.toFixed(2)}
            </span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${roiPct >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {roiPct >= 0 ? '+' : ''}{roiPct.toFixed(2)}% ROI
            </span>
          </div>
          <div className="mt-2 text-xs font-mono text-gray-400">
            Fees: -${account?.totalFeesUsd?.toFixed(2) || '0.00'} | Slippage: -${account?.totalSlippageUsd?.toFixed(2) || '0.00'}
          </div>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span>PAPER TRADING STATS</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className="text-2xl font-bold text-gray-100">{winRate.toFixed(1)}%</span>
            <span className="text-xs text-gray-400">Win Rate ({totalTrades} trades)</span>
          </div>
          <div className="mt-2 text-xs font-mono text-gray-400">
            Qualified Executions: <span className="text-cyan-400 font-bold">{safeTrades.length}</span>
          </div>
        </Card>
      </div>

      {/* Opportunities & Market Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="LIVE TRIANGULAR OPPORTUNITIES" subtitle="Deduplicated real-time calculations showing Theoretical vs Cost-Adjusted vs Realistic P&L" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-panel-300 text-gray-400 pb-2">
                  <th className="pb-2">TIME</th>
                  <th className="pb-2">PATH</th>
                  <th className="pb-2">THEORETICAL</th>
                  <th className="pb-2">COST-ADJUSTED</th>
                  <th className="pb-2">FEES</th>
                  <th className="pb-2">REALISTIC NET</th>
                  <th className="pb-2">STATUS</th>
                  <th className="pb-2 text-right">DEBUG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-300/40">
                {safeOpportunities.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-gray-500">
                      Scanning Binance live ticker streams for triangular opportunities...
                    </td>
                  </tr>
                ) : (
                  safeOpportunities.slice(0, 7).map((opp) => (
                    <tr key={opp.id} className="hover:bg-panel-200/50 transition-colors">
                      <td className="py-2.5 text-gray-400">{new Date(opp.timestamp).toLocaleTimeString()}</td>
                      <td className="py-2.5 font-bold text-gray-200">{opp.cycle?.id || (opp as any).cyclePath}</td>
                      <td className="py-2.5 text-cyan-400">+${opp.theoreticalProfitUsd?.toFixed(2) || (opp as any).grossProfitUsd?.toFixed(2) || '0.00'}</td>
                      <td className="py-2.5 text-amber-400">${opp.costAdjustedProfitUsd?.toFixed(2) || '0.00'}</td>
                      <td className="py-2.5 text-rose-400">-${opp.totalFeesUsd?.toFixed(2) || '0.00'}</td>
                      <td className={`py-2.5 font-bold ${(opp.realisticProfitUsd ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {(opp.realisticProfitUsd ?? 0) >= 0 ? '+' : ''}${opp.realisticProfitUsd?.toFixed(2) || '0.00'}
                      </td>
                      <td className="py-2.5">
                        <Badge status={opp.status} classification={opp.classification} />
                      </td>
                      <td className="py-2.5 text-right">
                        {onSelectPath && (
                          <button
                            onClick={() => onSelectPath(opp)}
                            className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded text-[11px] border border-cyan-500/30 transition-colors"
                          >
                            Debug
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Live Market Overview Panel */}
        <Card title="LIVE MARKET OVERVIEW" subtitle="Streaming top-of-book Binance tickers">
          <div className="space-y-3 font-mono text-xs">
            {safeTickers.length === 0 ? (
              <div className="py-6 text-center text-gray-500">Connecting to Binance market feeds...</div>
            ) : (
              safeTickers.slice(0, 6).map((t) => {
                const spread = Math.max(0, t.askPrice - t.bidPrice);
                const spreadPct = t.bidPrice > 0 ? (spread / t.bidPrice) * 100 : 0;
                return (
                  <div key={t.symbol} className="p-2.5 rounded-lg bg-panel-200/40 border border-panel-300 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-200 block">{t.symbol}</span>
                      <span className="text-[10px] text-gray-400">Spread: {spreadPct.toFixed(3)}%</span>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-bold">BID: {t.bidPrice}</div>
                      <div className="text-rose-400">ASK: {t.askPrice}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* P&L Performance Chart */}
      <Card title="CUMULATIVE PAPER TRADING P&L" subtitle="Paper execution performance trajectory ($ USDT)">
        <div className="h-64 w-full pt-2">
          {pnlTrendData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">
              No paper trades executed yet. Engine is scanning live market data for qualified opportunities...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pnlTrendData}>
                <defs>
                  <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="trade" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e2330', borderColor: '#3c465e', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="cumPnl" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#pnlGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
};
