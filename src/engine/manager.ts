import WebSocket from 'ws';
import { db, ensureDefaultRecords } from '../lib/db';
import {
  ArbitrageOpportunityCalc,
  DashboardWsMessage,
  MarketMakingFillRecord,
  MarketMakingQuoteRecord,
  MicrostructureFeatureSet,
  MicrostructureTradeRecord,
  OpportunityCounters,
  ScalperSignalCalc,
  ScalperTradeRecord,
  StrategyMetricsSummary,
  TriangularCycle,
  UniversePairInfo,
} from '../lib/types';
import { ArbitrageEngine, EngineSettings } from './arbitrageEngine';
import { BinanceWsClient, MarketDataStatusReport } from './binanceWsClient';
import { DemoDataGenerator } from './demoDataGenerator';
import { logger } from './logger';
import { MarketGraph } from './marketGraph';
import { BtcLeadLagEngine } from './btcLeadLagEngine';
import { MarketMakingEngine } from './marketMakingEngine';
import { MicroScalperEngine } from './microScalperEngine';
import { MicrostructureEngine } from './microstructureEngine';
import { OrderBookCache } from './orderBookCache';
import { PaperTradingEngine } from './paperTradingEngine';
import { TradeFlowTracker } from './tradeFlowTracker';

const globalForEngine = globalThis as unknown as { engineManager?: EngineManager };

export class EngineManager {
  public marketGraph = new MarketGraph();
  public cache = new OrderBookCache();
  public tradeFlowTracker = new TradeFlowTracker();
  public binanceWs: BinanceWsClient;
  public demoGen = new DemoDataGenerator();

  // 5 Independent Strategy Engines
  public paperEngine = new PaperTradingEngine();
  public microstructureEngine = new MicrostructureEngine();
  public marketMakingEngine = new MarketMakingEngine();
  public scalperEngine = new MicroScalperEngine();
  public btcLeadLagEngine = new BtcLeadLagEngine();

  private cycles: TriangularCycle[] = [];
  private wsClients = new Set<WebSocket>();
  private startTime = Date.now();

  private settings: EngineSettings = {
    startingCapital: 10000.0,
    makerFeePct: 0.075,
    takerFeePct: 0.10,
    maxAllowedSlippagePct: 0.20,
    minLiquidityUsd: 100.0,
    simulatedLatencyMs: 50,
  };

  private minNetProfitPct: number = 0.05;
  private minNetProfitUsd: number = 0.50;
  private maxTradeSize: number = 5000.0;
  private enablePaperTrading: boolean = true;
  private enableOpportunityDetection: boolean = true;
  private enableMicrostructure: boolean = true;
  private enableMarketMaking: boolean = true;
  private enableScalper: boolean = true;
  private enableBtcLeadLag: boolean = true;
  private demoMode: boolean = false;

  private latestOpportunities: ArbitrageOpportunityCalc[] = [];
  private lastEmittedFingerprints = new Map<string, number>();

  // 5 Strategy Accounts
  private strategyAccounts: Record<string, StrategyMetricsSummary> = {
    triangular: {
      strategyId: 'triangular',
      strategyName: 'Triangular Arbitrage v1.0',
      virtualBalanceUsd: 10000.0,
      initialCapitalUsd: 10000.0,
      grossPnlUsd: 0,
      totalFeesUsd: 0,
      totalSlippageUsd: 0,
      netPnlUsd: 0,
      roiPct: 0,
      totalTrades: 0,
      winRatePct: 0,
      profitFactor: 1.0,
      maxDrawdownPct: 0,
      avgTradeUsd: 0,
      medianTradeUsd: 0,
      status: 'RUNNING',
    },
    microstructure: {
      strategyId: 'microstructure',
      strategyName: 'Order-Book Microstructure v1.0',
      virtualBalanceUsd: 10000.0,
      initialCapitalUsd: 10000.0,
      grossPnlUsd: 0,
      totalFeesUsd: 0,
      totalSlippageUsd: 0,
      netPnlUsd: 0,
      roiPct: 0,
      totalTrades: 0,
      winRatePct: 0,
      profitFactor: 1.0,
      maxDrawdownPct: 0,
      avgTradeUsd: 0,
      medianTradeUsd: 0,
      status: 'RUNNING',
    },
    market_making: {
      strategyId: 'market_making',
      strategyName: 'Market Making v1.0',
      virtualBalanceUsd: 10000.0,
      initialCapitalUsd: 10000.0,
      grossPnlUsd: 0,
      totalFeesUsd: 0,
      totalSlippageUsd: 0,
      netPnlUsd: 0,
      roiPct: 0,
      totalTrades: 0,
      winRatePct: 0,
      profitFactor: 1.0,
      maxDrawdownPct: 0,
      avgTradeUsd: 0,
      medianTradeUsd: 0,
      status: 'RUNNING',
    },
    scalper: {
      strategyId: 'scalper',
      strategyName: 'Multi-Asset Adaptive Scalper v1.0',
      virtualBalanceUsd: 10000.0,
      initialCapitalUsd: 10000.0,
      grossPnlUsd: 0,
      totalFeesUsd: 0,
      totalSlippageUsd: 0,
      netPnlUsd: 0,
      roiPct: 0,
      totalTrades: 0,
      winRatePct: 0,
      profitFactor: 1.0,
      maxDrawdownPct: 0,
      avgTradeUsd: 0,
      medianTradeUsd: 0,
      status: 'RUNNING',
    },
    btc_lead_lag: {
      strategyId: 'btc_lead_lag',
      strategyName: 'BTC Lead-Lag + Relative-Value v1',
      virtualBalanceUsd: 10000.0,
      initialCapitalUsd: 10000.0,
      grossPnlUsd: 0,
      totalFeesUsd: 0,
      totalSlippageUsd: 0,
      netPnlUsd: 0,
      roiPct: 0,
      totalTrades: 0,
      winRatePct: 0,
      profitFactor: 1.0,
      maxDrawdownPct: 0,
      avgTradeUsd: 0,
      medianTradeUsd: 0,
      status: 'RUNNING',
    },
  };

  private counters: OpportunityCounters = {
    uniqueCyclesMonitored: 0,
    rawCalculations: 0,
    theoreticalOpportunities: 0,
    profitableAfterFees: 0,
    executableAfterLiquidity: 0,
    paperExecutions: 0,
  };

  public constructor() {
    this.binanceWs = new BinanceWsClient(
      this.cache,
      (symbol) => this.onMarketTick(symbol),
      () => this.broadcastStatus()
    );
  }

  public static getInstance(): EngineManager {
    if (!globalForEngine.engineManager) {
      globalForEngine.engineManager = new EngineManager();
    }
    return globalForEngine.engineManager;
  }

  public async initialize() {
    await ensureDefaultRecords();
    await this.ensureStrategyAccounts();
    await this.loadSettingsFromDb();

    this.marketGraph.loadFallbackSymbols();
    this.cycles = this.marketGraph.discoverTriangularCycles('USDT');
    this.counters.uniqueCyclesMonitored = this.cycles.length;

    // Stream 50 active universe symbols dynamically
    const universeSymbols = this.scalperEngine.getUniverseManager().getActiveSymbols();
    this.binanceWs.setSymbols(universeSymbols);

    await logger.log('INFO', 'SYSTEM', `Multi-Strategy Engine initialized: 4 Independent Strategy Engines active across 50 pairs.`);

    if (this.demoMode) {
      this.demoGen.start(this.cache, (s) => this.onMarketTick(s));
    } else {
      this.binanceWs.connect();
    }
  }

  private async ensureStrategyAccounts() {
    const ids = ['triangular', 'microstructure', 'market_making', 'scalper'];
    const names = [
      'Triangular Arbitrage v1.0',
      'Order-Book Microstructure v1.0',
      'Market Making v1.0',
      'Multi-Asset Adaptive Scalper v1.0',
    ];

    for (let i = 0; i < ids.length; i++) {
      const existing = await db.strategyAccount.findUnique({ where: { id: ids[i] } });
      if (!existing) {
        await db.strategyAccount.create({
          data: {
            id: ids[i],
            strategyName: names[i],
            virtualBalanceUsd: 10000.0,
            initialCapitalUsd: 10000.0,
          },
        });
      } else {
        this.strategyAccounts[ids[i]] = {
          strategyId: ids[i] as any,
          strategyName: existing.strategyName,
          virtualBalanceUsd: existing.virtualBalanceUsd,
          initialCapitalUsd: existing.initialCapitalUsd,
          grossPnlUsd: existing.grossPnlUsd,
          totalFeesUsd: existing.totalFeesUsd,
          totalSlippageUsd: existing.totalSlippageUsd,
          netPnlUsd: existing.netPnlUsd,
          roiPct: existing.initialCapitalUsd > 0 ? (existing.netPnlUsd / existing.initialCapitalUsd) * 100 : 0,
          totalTrades: existing.totalTrades,
          winRatePct: existing.winRatePct,
          profitFactor: 1.0,
          maxDrawdownPct: existing.maxDrawdownPct,
          avgTradeUsd: existing.totalTrades > 0 ? existing.netPnlUsd / existing.totalTrades : 0,
          medianTradeUsd: 0,
          status: 'RUNNING',
        };
      }
    }
  }

  public async loadSettingsFromDb() {
    try {
      const s = await db.strategySettings.findUnique({ where: { id: 'default' } });
      if (s) {
        this.settings = {
          startingCapital: s.startingCapital,
          makerFeePct: s.makerFeePct,
          takerFeePct: s.takerFeePct,
          maxAllowedSlippagePct: s.maxAllowedSlippagePct,
          minLiquidityUsd: s.minLiquidityUsd,
          simulatedLatencyMs: s.simulatedLatencyMs,
        };
        this.minNetProfitPct = s.minNetProfitPct;
        this.minNetProfitUsd = s.minNetProfitUsd;
        this.maxTradeSize = s.maxTradeSize;
        this.enablePaperTrading = s.enablePaperTrading;
        this.enableOpportunityDetection = s.enableOpportunityDetection;
        this.enableMicrostructure = s.enableMicrostructureEngine;
        this.enableMarketMaking = s.enableMarketMakingEngine;
        this.enableScalper = s.enableScalperEngine;
        this.demoMode = s.demoMode;

        this.paperEngine.setEnabled(s.enablePaperTrading);
        this.microstructureEngine.setEnabled(s.enableMicrostructureEngine);
        this.marketMakingEngine.setEnabled(s.enableMarketMakingEngine);
        this.scalperEngine.setEnabled(s.enableScalperEngine);
        this.scalperEngine.getUniverseManager().setTargetSize(s.scalperUniverseSize);
      }
    } catch (e: any) {
      console.error('Error loading settings:', e.message);
    }
  }

  private onMarketTick(symbol: string) {
    // 1. Strategy 1: Triangular Arbitrage
    if (this.enableOpportunityDetection) {
      this.evaluateTriangular(symbol);
    }

    // 2. Strategy 2: Order-Book Microstructure
    if (this.enableMicrostructure) {
      const signal = this.microstructureEngine.evaluateMarket(symbol, this.cache, this.tradeFlowTracker);
      if (signal) {
        this.broadcast({ type: 'MICROSTRUCTURE_SIGNAL', data: signal });
      }
    }

    // 3. Strategy 3: Market Making
    if (this.enableMarketMaking) {
      const tf = this.tradeFlowTracker.getSnapshot(symbol);
      this.marketMakingEngine.evaluateMarket(symbol, this.cache, tf.volumePerSec);
      const quote = this.marketMakingEngine.getActiveQuote();
      if (quote) {
        this.broadcast({ type: 'MARKET_MAKING_QUOTE', data: quote });
      }
    }

    // 4. Strategy 4: Multi-Asset Adaptive Micro-Scalper
    if (this.enableScalper) {
      this.scalperEngine.evaluatePair(symbol, this.cache, this.tradeFlowTracker);
    }

    // 5. Strategy 5: BTC Lead-Lag + Relative-Value Engine
    if (this.enableBtcLeadLag) {
      const ticker = this.cache.getTicker(symbol);
      if (ticker) {
        this.btcLeadLagEngine.processTicker(ticker, this.cache, this.tradeFlowTracker);
      }
    }

    const ticker = this.cache.getTicker(symbol);
    if (ticker) {
      this.broadcast({ type: 'TICK', data: ticker });
    }
  }

  private evaluateTriangular(symbol: string) {
    const fullSettings: EngineSettings & { minNetProfitPct: number; minNetProfitUsd: number; maxTradeSize: number } = {
      ...this.settings,
      minNetProfitPct: this.minNetProfitPct,
      minNetProfitUsd: this.minNetProfitUsd,
      maxTradeSize: this.maxTradeSize,
    };

    for (const cycle of this.cycles) {
      if (cycle.leg1.symbol === symbol || cycle.leg2.symbol === symbol || cycle.leg3.symbol === symbol) {
        this.counters.rawCalculations++;

        const opp = ArbitrageEngine.calculateOpportunity(cycle, this.cache, fullSettings);
        if (opp) {
          if (opp.theoreticalProfitUsd > 0) this.counters.theoreticalOpportunities++;
          if (opp.costAdjustedProfitUsd > 0) this.counters.profitableAfterFees++;
          if (opp.isFullyExecutable && opp.realisticProfitUsd > 0) this.counters.executableAfterLiquidity++;

          const lastTime = this.lastEmittedFingerprints.get(opp.fingerprint) || 0;
          if (Date.now() - lastTime > 1000) {
            this.lastEmittedFingerprints.set(opp.fingerprint, Date.now());
            if (this.lastEmittedFingerprints.size > 500) this.lastEmittedFingerprints.clear();

            this.latestOpportunities.unshift(opp);
            if (this.latestOpportunities.length > 50) this.latestOpportunities.pop();

            this.broadcast({ type: 'OPPORTUNITY', data: opp });

            this.paperEngine.processOpportunity(opp, fullSettings, (executedTrade) => {
              this.counters.paperExecutions++;
              this.broadcast({ type: 'PAPER_TRADE', data: executedTrade });
            });
          }
        }
      }
    }
  }

  public registerWsClient(ws: WebSocket) {
    this.wsClients.add(ws);
    ws.on('close', () => this.wsClients.delete(ws));
    ws.send(JSON.stringify({ type: 'STATUS', data: this.getMarketDataStatus() }));
  }

  public broadcast(msg: DashboardWsMessage) {
    const payload = JSON.stringify(msg);
    for (const client of this.wsClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  public broadcastStatus() {
    this.broadcast({
      type: 'STATUS',
      data: this.getMarketDataStatus(),
    });
  }

  public getMarketDataStatus(): MarketDataStatusReport & {
    arbitrageEngineRunning: boolean;
    microstructureEngineRunning: boolean;
    marketMakingEngineRunning: boolean;
    scalperEngineRunning: boolean;
    btcLeadLagEngineRunning: boolean;
    discoveredCyclesCount: number;
    dbConnected: boolean;
    uptimeSeconds: number;
    counters: OpportunityCounters;
    strategyAccounts: Record<string, StrategyMetricsSummary>;
  } {
    const report = this.binanceWs.getStatusReport(this.demoMode);
    return {
      ...report,
      arbitrageEngineRunning: this.enableOpportunityDetection,
      microstructureEngineRunning: this.enableMicrostructure,
      marketMakingEngineRunning: this.enableMarketMaking,
      scalperEngineRunning: this.enableScalper,
      btcLeadLagEngineRunning: this.enableBtcLeadLag,
      discoveredCyclesCount: this.cycles.length,
      dbConnected: true,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      counters: this.counters,
      strategyAccounts: this.strategyAccounts,
    };
  }

  public getStrategyAccounts(): Record<string, StrategyMetricsSummary> {
    return this.strategyAccounts;
  }

  public getLatestOpportunities(): ArbitrageOpportunityCalc[] {
    return this.latestOpportunities;
  }

  public setDemoMode(enable: boolean) {
    this.demoMode = enable;
  }
}

export const engineManager = EngineManager.getInstance();
