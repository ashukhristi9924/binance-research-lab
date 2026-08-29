import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Zap,
  Layers,
  Scale,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  BarChart3,
  HelpCircle,
} from 'lucide-react';
import {
  BtcLeadLagSignalCalc,
  BtcLeadLagTradeRecord,
  BtcShockFeatureSet,
  LeadLagMatrixCell,
  BtcLeadLagEventRecord,
} from '../../lib/types';

export const BtcLeadLagView: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<BtcLeadLagSignalCalc[]>([]);
  const [openPositions, setOpenPositions] = useState<any[]>([]);
  const [trades, setTrades] = useState<BtcLeadLagTradeRecord[]>([]);
  const [events, setEvents] = useState<BtcLeadLagEventRecord[]>([]);
  const [heatmap, setHeatmap] = useState<LeadLagMatrixCell[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const [selectedSignal, setSelectedSignal] = useState<BtcLeadLagSignalCalc | null>(null);
  const [activeTab, setActiveTab] = useState<'signals' | 'heatmap' | 'events' | 'trades' | 'analytics'>('signals');

  const fetchData = async () => {
    try {
      const [statusRes, oppRes, heatmapRes, eventsRes, tradesRes, analyticsRes] = await Promise.all([
        fetch('/api/btc-lead-lag/status'),
        fetch('/api/btc-lead-lag/opportunities'),
        fetch('/api/btc-lead-lag/heatmap'),
        fetch('/api/btc-lead-lag/events'),
        fetch('/api/btc-lead-lag/trades'),
        fetch('/api/btc-lead-lag/analytics'),
      ]);

      if (statusRes.ok) {
        const json = await statusRes.json();
        setStatus(json.status);
        setAccount(json.account);
      }
      if (oppRes.ok) {
        const json = await oppRes.json();
        setOpportunities(json.opportunities || []);
        setOpenPositions(json.openPositions || []);
      }
      if (heatmapRes.ok) {
        const json = await heatmapRes.json();
        setHeatmap(json.heatmap || []);
      }
      if (eventsRes.ok) {
        const json = await eventsRes.json();
        setEvents(json.events || []);
      }
      if (tradesRes.ok) {
        const json = await tradesRes.json();
        setTrades(json.trades || []);
      }
      if (analyticsRes.ok) {
        const json = await analyticsRes.json();
        setAnalytics(json);
      }
    } catch (err) {
      // Ignore network errors during polling
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  const btcShock: BtcShockFeatureSet | null = status?.btcShock || null;
  const currentBalance = account?.virtualBalanceUsd || 10000.0;
  const netPnl = account?.netPnlUsd || 0.0;
  const winRate = account?.winRatePct || 0.0;
  const totalTradesCount = account?.totalTrades || 0;

  const longSignalsCount = opportunities.filter((o) => o.direction === 'LONG').length;
  const shortSignalsCount = opportunities.filter((o) => o.direction === 'SHORT').length;

  return (
    <div className="space-y-6 font-mono text-xs text-gray-200">
      {/* Research Mode Banner */}
      <div className="bg-panel-100/80 border border-panel-200 rounded-xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-amber-400">STRATEGY #5: BTC LEAD-LAG + RELATIVE-VALUE RESEARCH ENGINE</div>
            <div className="text-gray-400 text-xs">
              Model A (Momentum) & Model B (Relative-Value Mean Reversion) • 100% Paper Trading • Public WebSocket Stream
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 font-bold text-xs">
            LIVE MARKET FEED
          </span>
          <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-purple-400 font-bold text-xs">
            FUTURES SHORT SIMULATED
          </span>
        </div>
      </div>

      {/* Top Key Performance Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-panel-100/60 border border-panel-200 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-gray-400 text-[10px] font-bold tracking-wider">BTC SHOCK EVENTS</span>
          <span className="text-lg font-bold text-cyan-400 mt-1">{events.length}</span>
          <span className="text-[10px] text-gray-500 mt-0.5">Score ≥ 60 Events</span>
        </div>

        <div className="bg-panel-100/60 border border-panel-200 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-gray-400 text-[10px] font-bold tracking-wider">QUALIFIED SIGNALS</span>
          <span className="text-lg font-bold text-emerald-400 mt-1">
            {opportunities.filter((o) => o.isQualified).length}
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5">Score ≥ 65 & Net ≥ $0.15</span>
        </div>

        <div className="bg-panel-100/60 border border-panel-200 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-gray-400 text-[10px] font-bold tracking-wider">PAPER POSITIONS</span>
          <span className="text-lg font-bold text-purple-400 mt-1">{openPositions.length} / 5</span>
          <span className="text-[10px] text-gray-500 mt-0.5">Active Holding Positions</span>
        </div>

        <div className="bg-panel-100/60 border border-panel-200 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-gray-400 text-[10px] font-bold tracking-wider">LONG / SHORT</span>
          <span className="text-lg font-bold text-gray-200 mt-1">
            <span className="text-emerald-400">{longSignalsCount}</span> / <span className="text-rose-400">{shortSignalsCount}</span>
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5">Directional Signals</span>
        </div>

        <div className="bg-panel-100/60 border border-panel-200 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-gray-400 text-[10px] font-bold tracking-wider">WIN RATE</span>
          <span className="text-lg font-bold text-amber-400 mt-1">{winRate.toFixed(1)}%</span>
          <span className="text-[10px] text-gray-500 mt-0.5">{totalTradesCount} Total Trades</span>
        </div>

        <div className="bg-panel-100/60 border border-panel-200 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-gray-400 text-[10px] font-bold tracking-wider">NET REALIZED P&L</span>
          <span className={`text-lg font-bold mt-1 ${netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netPnl >= 0 ? '+' : ''}${netPnl.toFixed(2)}
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5">After Fees & Slippage</span>
        </div>

        <div className="bg-panel-100/60 border border-panel-200 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-gray-400 text-[10px] font-bold tracking-wider">EXPECTANCY / TRADE</span>
          <span className="text-lg font-bold text-cyan-400 mt-1">
            +${totalTradesCount > 0 ? (netPnl / totalTradesCount).toFixed(2) : '0.00'}
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5">Expected Value</span>
        </div>
      </div>

      {/* Live BTC Shock & Regime Control Panel */}
      <Card title="LIVE BTC SHOCK & MARKET REGIME MONITOR">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-2">
          <div className="bg-panel-200/50 rounded-lg p-3 border border-panel-300 flex flex-col justify-between">
            <span className="text-gray-400 text-[10px]">BTC MID PRICE</span>
            <span className="text-base font-bold text-cyan-400">${btcShock?.price?.toFixed(2) || '79,500.00'}</span>
            <span className="text-[10px] text-gray-500">Public Stream</span>
          </div>

          <div className="bg-panel-200/50 rounded-lg p-3 border border-panel-300 flex flex-col justify-between">
            <span className="text-gray-400 text-[10px]">BTC 1s RETURN</span>
            <span
              className={`text-base font-bold ${(btcShock?.return1s || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
            >
              {(btcShock?.return1s || 0) >= 0 ? '+' : ''}
              {(btcShock?.return1s || 0).toFixed(3)}%
            </span>
            <span className="text-[10px] text-gray-500">100ms: {(btcShock?.return100ms || 0).toFixed(3)}%</span>
          </div>

          <div className="bg-panel-200/50 rounded-lg p-3 border border-panel-300 flex flex-col justify-between">
            <span className="text-gray-400 text-[10px]">BTC 5s RETURN</span>
            <span
              className={`text-base font-bold ${(btcShock?.return5s || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
            >
              {(btcShock?.return5s || 0) >= 0 ? '+' : ''}
              {(btcShock?.return5s || 0).toFixed(3)}%
            </span>
            <span className="text-[10px] text-gray-500">10s: {(btcShock?.return10s || 0).toFixed(3)}%</span>
          </div>

          <div className="bg-panel-200/50 rounded-lg p-3 border border-panel-300 flex flex-col justify-between">
            <span className="text-gray-400 text-[10px]">ROLLING VOLATILITY</span>
            <span className="text-base font-bold text-amber-400">
              {((btcShock?.volatility || 0.05) * 100).toFixed(2)} bps
            </span>
            <span className="text-[10px] text-gray-500">60s Window</span>
          </div>

          <div className="bg-panel-200/50 rounded-lg p-3 border border-panel-300 flex flex-col justify-between">
            <span className="text-gray-400 text-[10px]">BTC SHOCK SCORE</span>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-cyan-400">{btcShock?.btcShockScore || 45} / 100</span>
              <div className="w-12 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all"
                  style={{ width: `${btcShock?.btcShockScore || 45}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] text-gray-500">Normalized Volatility</span>
          </div>

          <div className="bg-panel-200/50 rounded-lg p-3 border border-panel-300 flex flex-col justify-between">
            <span className="text-gray-400 text-[10px]">MARKET REGIME</span>
            <span className="text-xs font-bold px-2 py-0.5 bg-purple-500/20 border border-purple-500/40 text-purple-300 rounded self-start mt-1">
              {btcShock?.marketRegime || 'NORMAL'}
            </span>
            <span className="text-[10px] text-gray-500">Dynamic Classification</span>
          </div>
        </div>
      </Card>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-panel-200 pb-2">
        <button
          onClick={() => setActiveTab('signals')}
          className={`px-4 py-2 rounded-lg font-bold transition-all ${
            activeTab === 'signals'
              ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
              : 'text-gray-400 hover:bg-panel-100'
          }`}
        >
          LIVE FOLLOWER SCANNER ({opportunities.length})
        </button>

        <button
          onClick={() => setActiveTab('heatmap')}
          className={`px-4 py-2 rounded-lg font-bold transition-all ${
            activeTab === 'heatmap'
              ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
              : 'text-gray-400 hover:bg-panel-100'
          }`}
        >
          LEAD-LAG DELAY HEATMAP
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-lg font-bold transition-all ${
            activeTab === 'events'
              ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
              : 'text-gray-400 hover:bg-panel-100'
          }`}
        >
          BTC SHOCK EVENT LOG ({events.length})
        </button>

        <button
          onClick={() => setActiveTab('trades')}
          className={`px-4 py-2 rounded-lg font-bold transition-all ${
            activeTab === 'trades'
              ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
              : 'text-gray-400 hover:bg-panel-100'
          }`}
        >
          PAPER TRADE HISTORY ({trades.length})
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-lg font-bold transition-all ${
            activeTab === 'analytics'
              ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
              : 'text-gray-400 hover:bg-panel-100'
          }`}
        >
          QUANTITATIVE RESEARCH ANALYTICS
        </button>
      </div>

      {/* Tab 1: Live Follower Table */}
      {activeTab === 'signals' && (
        <Card title="DYNAMIC 50-FOLLOWER PAIR SCANNER & OPPORTUNITIES">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-panel-200 text-gray-400 text-[11px] font-bold">
                  <th className="py-2.5">RANK</th>
                  <th className="py-2.5">SYMBOL</th>
                  <th className="py-2.5">FOLLOWER RET</th>
                  <th className="py-2.5">BETA</th>
                  <th className="py-2.5">EXPECTED RET</th>
                  <th className="py-2.5">RESIDUAL</th>
                  <th className="py-2.5">SCORE</th>
                  <th className="py-2.5">DIRECTION</th>
                  <th className="py-2.5 text-right">EXPECTED GROSS</th>
                  <th className="py-2.5 text-right">EST. COSTS</th>
                  <th className="py-2.5 text-right">EXPECTED NET</th>
                  <th className="py-2.5">STATUS</th>
                  <th className="py-2.5 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-200/40">
                {opportunities.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-8 text-center text-gray-500">
                      Streaming 50 liquid USDT follower pairs from Binance public market data...
                    </td>
                  </tr>
                ) : (
                  opportunities.map((opp, idx) => (
                    <tr key={opp.id} className="hover:bg-panel-200/40 transition-colors">
                      <td className="py-2.5 text-gray-500">#{idx + 1}</td>
                      <td className="py-2.5 font-bold text-gray-200">{opp.symbol}</td>
                      <td
                        className={`py-2.5 font-bold ${
                          opp.actualReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {opp.actualReturnPct >= 0 ? '+' : ''}
                        {opp.actualReturnPct.toFixed(3)}%
                      </td>
                      <td className="py-2.5 text-amber-400">{opp.rollingBeta.toFixed(2)}</td>
                      <td
                        className={`py-2.5 ${
                          opp.expectedReturnPct >= 0 ? 'text-emerald-400/80' : 'text-rose-400/80'
                        }`}
                      >
                        {opp.expectedReturnPct >= 0 ? '+' : ''}
                        {opp.expectedReturnPct.toFixed(3)}%
                      </td>
                      <td
                        className={`py-2.5 font-bold ${
                          opp.residualPct >= 0 ? 'text-cyan-400' : 'text-purple-400'
                        }`}
                      >
                        {opp.residualPct >= 0 ? '+' : ''}
                        {opp.residualPct.toFixed(3)}%
                      </td>
                      <td className="py-2.5 font-bold text-cyan-300">{opp.leadLagScore}/100</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            opp.direction === 'LONG'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : opp.direction === 'SHORT'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : 'bg-gray-700/50 text-gray-400'
                          }`}
                        >
                          {opp.direction}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-bold text-emerald-400">
                        +${opp.expectedGrossUsd.toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right text-rose-400">-${opp.totalCostsUsd.toFixed(2)}</td>
                      <td
                        className={`py-2.5 text-right font-bold ${
                          opp.expectedNetProfitUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {opp.expectedNetProfitUsd >= 0 ? '+' : ''}${opp.expectedNetProfitUsd.toFixed(2)}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            opp.pipelineStatus === 'PAPER_ENTRY_TRIGGERED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : opp.pipelineStatus === 'QUALIFIED_READY'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {opp.pipelineStatus}
                        </span>
                      </td>
                      <td className="py-2.5 text-center">
                        <button
                          onClick={() => setSelectedSignal(opp)}
                          className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded font-bold transition-all text-[10px]"
                        >
                          WHY THIS SIGNAL?
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Lead-Lag Heatmap */}
      {activeTab === 'heatmap' && (
        <Card title="MULTI-HORIZON LEAD-LAG PREDICTIVE HEATMAP (50ms - 10s DELAYS)">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-panel-200 text-gray-400 text-[11px] font-bold">
                  <th className="py-2.5">FOLLOWER SYMBOL</th>
                  <th className="py-2.5 text-center">50ms</th>
                  <th className="py-2.5 text-center">100ms</th>
                  <th className="py-2.5 text-center">250ms</th>
                  <th className="py-2.5 text-center">500ms</th>
                  <th className="py-2.5 text-center">1s</th>
                  <th className="py-2.5 text-center">2s</th>
                  <th className="py-2.5 text-center">3s</th>
                  <th className="py-2.5 text-center">5s</th>
                  <th className="py-2.5 text-center">10s</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-200/40">
                {['ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'LINKUSDT'].map(
                  (sym) => (
                    <tr key={sym} className="hover:bg-panel-200/40">
                      <td className="py-3 font-bold text-gray-200">{sym}</td>
                      {[50, 100, 250, 500, 1000, 2000, 3000, 5000, 10000].map((delay) => {
                        const cell = heatmap.find((c) => c.followerSymbol === sym && c.delayMs === delay);
                        const corr = cell?.correlation || 0.65;
                        return (
                          <td key={delay} className="py-3 text-center">
                            <div className="inline-flex flex-col items-center p-1.5 rounded bg-panel-200/60 border border-panel-300">
                              <span className="text-cyan-400 font-bold">{corr.toFixed(2)}</span>
                              <span className="text-[9px] text-gray-400">
                                {cell?.directionalAccuracy?.toFixed(0) || 65}%
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: BTC Shock Event Study Log */}
      {activeTab === 'events' && (
        <Card title="BTC SHOCK EVENT STUDY LOG (RECORDED SHOCKS & FOLLOWER RESPONSES)">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-panel-200 text-gray-400 text-[11px] font-bold">
                  <th className="py-2.5">EVENT ID</th>
                  <th className="py-2.5">TIMESTAMP</th>
                  <th className="py-2.5">BTC 1s RET</th>
                  <th className="py-2.5">BTC SHOCK SCORE</th>
                  <th className="py-2.5">REGIME</th>
                  <th className="py-2.5">FOLLOWER</th>
                  <th className="py-2.5">ACTUAL RET</th>
                  <th className="py-2.5">EXPECTED RET</th>
                  <th className="py-2.5">RESIDUAL</th>
                  <th className="py-2.5">T+1s FOLLOWER RESPONSE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-200/40">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-gray-500">
                      No BTC shock events recorded yet (Shock Score ≥ 60 required)...
                    </td>
                  </tr>
                ) : (
                  events.map((evt) => (
                    <tr key={evt.id} className="hover:bg-panel-200/40">
                      <td className="py-2.5 font-bold text-cyan-400">{evt.eventId}</td>
                      <td className="py-2.5 text-gray-400">{new Date(evt.timestamp).toLocaleTimeString()}</td>
                      <td className={`py-2.5 font-bold ${evt.btcReturn1s >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {evt.btcReturn1s >= 0 ? '+' : ''}
                        {evt.btcReturn1s.toFixed(3)}%
                      </td>
                      <td className="py-2.5 font-bold text-cyan-300">{evt.btcShockScore}/100</td>
                      <td className="py-2.5 text-purple-300 font-bold">{evt.marketRegime}</td>
                      <td className="py-2.5 font-bold text-gray-200">{evt.followerSymbol}</td>
                      <td className="py-2.5 font-bold text-emerald-400">{evt.followerReturn.toFixed(3)}%</td>
                      <td className="py-2.5 text-amber-400">{evt.expectedReturn.toFixed(3)}%</td>
                      <td className="py-2.5 font-bold text-cyan-400">{evt.residual.toFixed(3)}%</td>
                      <td className="py-2.5 text-emerald-400 font-bold">
                        T+100ms: {evt.tPlus100ms?.toFixed(2)}% | T+1s: {evt.tPlus1s?.toFixed(2)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 4: Paper Trade History */}
      {activeTab === 'trades' && (
        <Card title="STRATEGY #5 PAPER TRADE HISTORY & RECONCILIATION">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-panel-200 text-gray-400 text-[11px] font-bold">
                  <th className="py-2.5">ID</th>
                  <th className="py-2.5">SYMBOL</th>
                  <th className="py-2.5">DIRECTION</th>
                  <th className="py-2.5">MODEL</th>
                  <th className="py-2.5">ENTRY PRICE</th>
                  <th className="py-2.5">EXIT PRICE</th>
                  <th className="py-2.5 text-right">GROSS P&L</th>
                  <th className="py-2.5 text-right">FEE</th>
                  <th className="py-2.5 text-right">NET P&L</th>
                  <th className="py-2.5">HOLDING</th>
                  <th className="py-2.5">REASON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-200/40">
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-gray-500">
                      No paper trades executed yet for Strategy #5...
                    </td>
                  </tr>
                ) : (
                  trades.map((t) => (
                    <tr key={t.id} className="hover:bg-panel-200/40">
                      <td className="py-2.5 text-gray-500 text-[10px]">{t.id.slice(-8)}</td>
                      <td className="py-2.5 font-bold text-gray-200">{t.symbol}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            t.direction === 'LONG'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          }`}
                        >
                          {t.direction}
                        </span>
                      </td>
                      <td className="py-2.5 text-cyan-300 font-bold text-[10px]">{t.modelType}</td>
                      <td className="py-2.5 text-gray-300">${t.entryPrice.toFixed(2)}</td>
                      <td className="py-2.5 text-gray-300">${t.exitPrice.toFixed(2)}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-400">+${t.grossPnlUsd.toFixed(2)}</td>
                      <td className="py-2.5 text-right text-rose-400">-${t.feeUsd.toFixed(2)}</td>
                      <td
                        className={`py-2.5 text-right font-bold ${
                          t.netPnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {t.netPnlUsd >= 0 ? '+' : ''}${t.netPnlUsd.toFixed(2)} ({t.netPnlPct.toFixed(2)}%)
                      </td>
                      <td className="py-2.5 text-gray-400">{(t.holdingTimeMs / 1000).toFixed(1)}s</td>
                      <td className="py-2.5 font-bold text-purple-300">{t.exitReason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 5: Quantitative Research Analytics */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Model A vs Model B Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="MODEL A: BTC LEAD-LAG MOMENTUM PERFORMANCE">
              <div className="space-y-3 p-2">
                <div className="flex justify-between border-b border-panel-200 pb-2">
                  <span className="text-gray-400">Total Executed Trades:</span>
                  <span className="font-bold text-gray-200">{analytics.models?.modelA?.totalTrades || 0}</span>
                </div>
                <div className="flex justify-between border-b border-panel-200 pb-2">
                  <span className="text-gray-400">Win Rate:</span>
                  <span className="font-bold text-emerald-400">{analytics.models?.modelA?.winRatePct || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Realized Net P&L:</span>
                  <span className="font-bold text-cyan-400">+${analytics.models?.modelA?.netPnlUsd || 0}</span>
                </div>
              </div>
            </Card>

            <Card title="MODEL B: RELATIVE-VALUE MEAN-REVERSION PERFORMANCE">
              <div className="space-y-3 p-2">
                <div className="flex justify-between border-b border-panel-200 pb-2">
                  <span className="text-gray-400">Total Executed Trades:</span>
                  <span className="font-bold text-gray-200">{analytics.models?.modelB?.totalTrades || 0}</span>
                </div>
                <div className="flex justify-between border-b border-panel-200 pb-2">
                  <span className="text-gray-400">Win Rate:</span>
                  <span className="font-bold text-emerald-400">{analytics.models?.modelB?.winRatePct || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Realized Net P&L:</span>
                  <span className="font-bold text-purple-400">+${analytics.models?.modelB?.netPnlUsd || 0}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Baseline Comparisons */}
          <Card title="BASELINE COMPARISON & EXPECTANCY PROFILES">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-panel-200 text-gray-400 text-[11px] font-bold">
                    <th className="py-2.5">STRATEGY / BASELINE MODEL</th>
                    <th className="py-2.5 text-center">WIN RATE %</th>
                    <th className="py-2.5 text-right">NET P&L ($)</th>
                    <th className="py-2.5 text-right">SHARPE RATIO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-panel-200/40">
                  {analytics.baselines?.map((b: any) => (
                    <tr key={b.name} className="hover:bg-panel-200/40">
                      <td className="py-2.5 font-bold text-gray-200">{b.name}</td>
                      <td className="py-2.5 text-center font-bold text-amber-400">{b.winRatePct}%</td>
                      <td
                        className={`py-2.5 text-right font-bold ${
                          b.netPnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {b.netPnlUsd >= 0 ? '+' : ''}${b.netPnlUsd.toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right text-cyan-300 font-bold">{b.sharpe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* WHY THIS SIGNAL DETAIL MODAL */}
      {selectedSignal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-panel-100 border border-panel-300 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-panel-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">WHY THIS SIGNAL EXISTS</h3>
                  <p className="text-gray-400 text-xs">{selectedSignal.symbol} • Strategy #5 Signal Audit</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSignal(null)}
                className="text-gray-400 hover:text-white font-bold p-2"
              >
                ✕
              </button>
            </div>

            {/* Execution Warning Label for Short Signals */}
            {selectedSignal.direction === 'SHORT' && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 flex items-center gap-3 text-purple-300 text-xs font-bold">
                <AlertTriangle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <span>SHORT SIGNAL - FUTURES EXECUTION REQUIRED (Simulated 1x Leverage)</span>
              </div>
            )}

            {/* Mathematical Justification Waterfall */}
            <div className="space-y-3 bg-panel-200/50 p-4 rounded-xl border border-panel-300 text-xs">
              <div className="flex justify-between border-b border-panel-200 pb-2">
                <span className="text-gray-400">BTC 1s Return:</span>
                <span className="font-bold text-cyan-400">{selectedSignal.btcReturn1sPct.toFixed(3)}%</span>
              </div>
              <div className="flex justify-between border-b border-panel-200 pb-2">
                <span className="text-gray-400">Follower Beta:</span>
                <span className="font-bold text-amber-400">{selectedSignal.rollingBeta.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-panel-200 pb-2">
                <span className="text-gray-400">Expected Follower Return (BTC Ret × Beta):</span>
                <span className="font-bold text-gray-200">{selectedSignal.expectedReturnPct.toFixed(3)}%</span>
              </div>
              <div className="flex justify-between border-b border-panel-200 pb-2">
                <span className="text-gray-400">Actual Follower Return:</span>
                <span className="font-bold text-emerald-400">{selectedSignal.actualReturnPct.toFixed(3)}%</span>
              </div>
              <div className="flex justify-between border-b border-panel-200 pb-2">
                <span className="text-gray-400">Residual (Actual - Expected):</span>
                <span className="font-bold text-purple-400">{selectedSignal.residualPct.toFixed(3)}%</span>
              </div>
              <div className="flex justify-between border-b border-panel-200 pb-2">
                <span className="text-gray-400">Model Type:</span>
                <span className="font-bold text-cyan-300">{selectedSignal.modelType}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1">
                <span className="text-gray-300">Final Signal Direction:</span>
                <span
                  className={selectedSignal.direction === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}
                >
                  {selectedSignal.direction}
                </span>
              </div>
            </div>

            {/* Itemized Cost Breakdown */}
            <div className="bg-panel-200/50 p-4 rounded-xl border border-panel-300 space-y-2 text-xs">
              <div className="text-gray-400 font-bold border-b border-panel-200 pb-1 mb-2">ITEMIZED COST WATERFALL</div>
              <div className="flex justify-between"><span className="text-gray-400">Position Notional:</span><span className="text-gray-200">${selectedSignal.positionNotionalUsd}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Expected Gross $:</span><span className="text-emerald-400">+${selectedSignal.expectedGrossUsd.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Entry Taker Fee (0.10%):</span><span className="text-rose-400">-${selectedSignal.entryFeeUsd.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Exit Taker Fee (0.10%):</span><span className="text-rose-400">-${selectedSignal.exitFeeUsd.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Spread Cost:</span><span className="text-rose-400">-${selectedSignal.spreadCostUsd.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Slippage (0.01% VWAP):</span><span className="text-rose-400">-${selectedSignal.slippageCostUsd.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Latency Cost (50ms):</span><span className="text-rose-400">-${selectedSignal.latencyCostUsd.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold border-t border-panel-200 pt-2"><span className="text-gray-200">Expected Net $:</span><span className="text-emerald-400">+${selectedSignal.expectedNetProfitUsd.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
