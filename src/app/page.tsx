'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { DashboardView } from '../components/views/DashboardView';
import { StrategyOverviewView } from '../components/views/StrategyOverviewView';
import { TriangularPathView } from '../components/views/TriangularPathView';
import { MicrostructureView } from '../components/views/MicrostructureView';
import { MarketMakingView } from '../components/views/MarketMakingView';
import { BtcLeadLagView } from '../components/views/BtcLeadLagView';
import { MicroScalperView } from '../components/views/MicroScalperView';
import { MarketUniverseView } from '../components/views/MarketUniverseView';
import { CoinPerformanceView } from '../components/views/CoinPerformanceView';
import { ScalperAnalyticsView } from '../components/views/ScalperAnalyticsView';
import { ScalperBaselinesView } from '../components/views/ScalperBaselinesView';
import { StrategyComparisonView } from '../components/views/StrategyComparisonView';
import { ExperimentsView } from '../components/views/ExperimentsView';
import { PaperTradingView } from '../components/views/PaperTradingView';
import { AnalyticsView } from '../components/views/AnalyticsView';
import { ResearchLogsView } from '../components/views/ResearchLogsView';
import { SettingsView } from '../components/views/SettingsView';
import { ArbitrageOpportunityCalc, PaperTradeRecord, PriceBookTicker } from '../lib/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState('btc-lead-lag');
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunityCalc[]>([]);
  const [paperTrades, setPaperTrades] = useState<PaperTradeRecord[]>([]);
  const [tickers, setTickers] = useState<PriceBookTicker[]>([]);
  const [selectedOpp, setSelectedOpp] = useState<ArbitrageOpportunityCalc | null>(null);
  const [account, setAccount] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [oppRes, tradeRes, statusRes, accountRes] = await Promise.all([
          fetch('/api/opportunities?limit=50'),
          fetch('/api/trades?limit=50'),
          fetch('/api/market-data/status'),
          fetch('/api/paper-account'),
        ]);

        if (oppRes.ok) {
          const json = await oppRes.json();
          setOpportunities(Array.isArray(json) ? json : []);
        }
        if (tradeRes.ok) {
          const json = await tradeRes.json();
          setPaperTrades(Array.isArray(json) ? json : []);
        }
        if (statusRes.ok) {
          const s = await statusRes.json();
          setStatus(s);
          if (s.symbolUpdates) {
            const list: PriceBookTicker[] = Object.entries(s.symbolUpdates).map(([symbol, val]: [string, any]) => ({
              symbol,
              bidPrice: val.bid,
              bidQty: 10,
              askPrice: val.ask,
              askQty: 10,
              updatedAt: Date.now(),
            }));
            setTickers(list);
          }
        }
        if (accountRes.ok) setAccount(await accountRes.json());
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-panel-50 text-gray-100 overflow-hidden font-mono text-xs">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} status={status} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header status={status || {}} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              opportunities={opportunities}
              paperTrades={paperTrades}
              tickers={tickers}
              account={account}
              status={status || {}}
              onSelectPath={(opp) => {
                setSelectedOpp(opp);
                setActiveTab('triangular');
              }}
            />
          )}

          {activeTab === 'strategies-overview' && (
            <StrategyOverviewView status={status} onNavigate={(tab) => setActiveTab(tab)} />
          )}

          {activeTab === 'btc-lead-lag' && <BtcLeadLagView />}

          {activeTab === 'triangular' && (
            <TriangularPathView
              opportunity={selectedOpp}
              allOpportunities={opportunities}
              onSelectOpp={(opp) => setSelectedOpp(opp)}
            />
          )}

          {activeTab === 'microstructure' && <MicrostructureView />}

          {activeTab === 'market-making' && <MarketMakingView />}

          {activeTab === 'micro-scalper' && <MicroScalperView />}

          {activeTab === 'market-universe' && <MarketUniverseView />}

          {activeTab === 'coin-performance' && <CoinPerformanceView />}

          {activeTab === 'scalper-analytics' && <ScalperAnalyticsView />}

          {activeTab === 'scalper-baselines' && <ScalperBaselinesView />}

          {activeTab === 'strategy-comparison' && <StrategyComparisonView />}

          {activeTab === 'experiments' && <ExperimentsView />}

          {activeTab === 'trades' && <PaperTradingView account={account} trades={paperTrades} />}

          {activeTab === 'analytics' && <AnalyticsView opportunities={opportunities} trades={paperTrades} account={account} />}

          {activeTab === 'logs' && <ResearchLogsView logs={[]} />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}
