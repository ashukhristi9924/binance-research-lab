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
import { useDashboardSocket } from '../hooks/useDashboardSocket';
import { ArbitrageOpportunityCalc } from '../lib/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState('btc-lead-lag');
  const [selectedOpp, setSelectedOpp] = useState<ArbitrageOpportunityCalc | null>(null);

  const { status, opportunities, paperTrades, tickers, account, refreshData } = useDashboardSocket();

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
