import { db } from '../lib/db';
import { PriceBookTicker, ScalperFeatureSet, ScalperSignalCalc, ScalperTradeRecord } from '../lib/types';
import { OrderBookCache } from './orderBookCache';
import { ScalperFeatureEngine } from './scalperFeatureEngine';
import { ScalperSignalEngine } from './scalperSignalEngine';
import { UniverseManager } from './universeManager';
import { logger } from './logger';

export interface MicroScalperSettings {
  maxSimultaneousPositions: number; // default 5
  positionSizePct: number;          // default 10% of virtual capital ($1,000)
  maxTotalDeployedPct: number;      // default 50%
  takeProfitPct: number;            // default 0.03%
  stopLossPct: number;              // default 0.02%
  maxHoldingTimeMs: number;         // default 10000ms (10 seconds)
  takerFeePct: number;              // default 0.10%
  simulatedLatencyMs: number;       // default 50ms
  dailyLossLimitPct: number;        // default 2.0%
}

export class MicroScalperEngine {
  private active: boolean = true;
  private isPaused: boolean = false;
  private settings: MicroScalperSettings = {
    maxSimultaneousPositions: 5,
    positionSizePct: 10.0,
    maxTotalDeployedPct: 50.0,
    takeProfitPct: 0.03,
    stopLossPct: 0.02,
    maxHoldingTimeMs: 10000,
    takerFeePct: 0.10,
    simulatedLatencyMs: 50,
    dailyLossLimitPct: 2.0,
  };

  public universeManager = new UniverseManager();
  public featureEngine = new ScalperFeatureEngine();
  public signalEngine = new ScalperSignalEngine();

  private openPositions: ScalperTradeRecord[] = [];
  private activeSignals: ScalperSignalCalc[] = [];
  private recentTrades: ScalperTradeRecord[] = [];

  public setEnabled(enabled: boolean) {
    this.active = enabled;
  }

  public isEnabled(): boolean {
    return this.active;
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  public isEnginePaused(): boolean {
    return this.isPaused;
  }

  public updateSettings(newSettings: Partial<MicroScalperSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  public getSettings(): MicroScalperSettings {
    return this.settings;
  }

  public getUniverseManager(): UniverseManager {
    return this.universeManager;
  }

  public getActiveSignals(): ScalperSignalCalc[] {
    return this.activeSignals;
  }

  public getOpenPositions(): ScalperTradeRecord[] {
    return this.openPositions;
  }

  public getRecentTrades(): ScalperTradeRecord[] {
    return this.recentTrades;
  }

  /**
   * Processes tick for a universe pair and evaluates portfolio risk rules.
   */
  public evaluatePair(symbol: string, cache: OrderBookCache, tradeFlowTracker: any) {
    if (!this.active) return;

    const ticker = cache.getTicker(symbol);
    if (!ticker) return;

    const now = Date.now();

    // 1. Evaluate Open Positions Exits
    this.evaluateOpenPositionExits(symbol, ticker, now);

    if (this.isPaused) return;

    // 2. Compute Features & Signal
    const features = this.featureEngine.processPair(symbol, cache, tradeFlowTracker);
    if (!features) return;

    const signal = this.signalEngine.evaluateSignal(features, 1000);

    // Update pair metrics in Universe Manager
    this.universeManager.updatePairMetrics(
      symbol,
      features.spreadPct,
      0.015,
      features.tradeFlowRatio,
      signal.scalperScore
    );

    // Update active signals list
    this.activeSignals = this.activeSignals.filter((s) => s.symbol !== symbol);
    this.activeSignals.unshift(signal);
    if (this.activeSignals.length > 50) this.activeSignals.pop();

    // Check Portfolio Risk Limits
    if (!signal.isQualified) return;

    if (this.openPositions.length >= this.settings.maxSimultaneousPositions) {
      signal.isQualified = false;
      signal.pipelineStatus = 'REJECTED_BY_RISK';
      signal.rejectionReason = 'MAX_POSITIONS_REACHED';
      return;
    }

    // Check single position per symbol constraint
    const hasPosition = this.openPositions.some((p) => p.symbol === symbol);
    if (hasPosition) {
      signal.isQualified = false;
      signal.pipelineStatus = 'REJECTED_BY_RISK';
      signal.rejectionReason = 'COOLDOWN_ACTIVE';
      return;
    }

    signal.pipelineStatus = 'PAPER_ENTRY_TRIGGERED';

    // Trigger Paper Entry for Top Qualified Signal
    this.triggerPaperEntry(signal, ticker, now);
  }

  private triggerPaperEntry(signal: ScalperSignalCalc, ticker: PriceBookTicker, now: number) {
    const entryPrice = ticker.askPrice; // Long-only spot Ask execution
    const positionUsd = 1000.0;
    const quantity = Number((positionUsd / entryPrice).toFixed(6));

    const tradeRecord: ScalperTradeRecord = {
      id: `sclp-${now}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now,
      symbol: signal.symbol,
      entryPrice,
      exitPrice: 0,
      quantity,
      holdingTimeMs: 0,
      grossPnlUsd: 0,
      feeUsd: 0,
      slippageUsd: 0,
      netPnlUsd: 0,
      netPnlPct: 0,
      scalperScore: signal.scalperScore,
      volatilityRegime: signal.volatilityRegime,
      exitReason: 'MAX_HOLDING',
    };

    this.openPositions.push(tradeRecord);
    logger.log(
      'INFO',
      'SCALPER',
      `Opened Paper Micro-Scalp LONG on ${tradeRecord.symbol} @ ${entryPrice} (Score ${signal.scalperScore}/100, Expected Net: +$${signal.expectedNetProfitUsd})`
    );
  }

  private async evaluateOpenPositionExits(symbol: string, ticker: PriceBookTicker, now: number) {
    const toClose: ScalperTradeRecord[] = [];

    for (const pos of this.openPositions) {
      if (pos.symbol !== symbol) continue;

      const holdingTime = now - pos.timestamp;
      const currentPrice = ticker.bidPrice; // Long-only spot Bid exit execution

      const pnlPct = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;

      let exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MAX_HOLDING' | 'SIGNAL_REVERSAL' | 'RISK_LIMIT' | null = null;

      if (pnlPct >= this.settings.takeProfitPct) {
        exitReason = 'TAKE_PROFIT';
      } else if (pnlPct <= -this.settings.stopLossPct) {
        exitReason = 'STOP_LOSS';
      } else if (holdingTime >= this.settings.maxHoldingTimeMs) {
        exitReason = 'MAX_HOLDING';
      }

      if (exitReason) {
        pos.exitPrice = currentPrice;
        pos.holdingTimeMs = holdingTime;
        pos.exitReason = exitReason;

        const notional = pos.quantity * currentPrice;
        const grossPnl = (currentPrice - pos.entryPrice) * pos.quantity;
        const fees = (notional * (this.settings.takerFeePct / 100)) * 2;
        const slippage = notional * 0.0001; // 0.01% simulated order book VWAP slippage
        const netPnl = grossPnl - fees - slippage;
        const netPnlPct = (netPnl / (pos.quantity * pos.entryPrice)) * 100;

        pos.grossPnlUsd = Number(grossPnl.toFixed(4));
        pos.feeUsd = Number(fees.toFixed(4));
        pos.slippageUsd = Number(slippage.toFixed(4));
        pos.netPnlUsd = Number(netPnl.toFixed(4));
        pos.netPnlPct = Number(netPnlPct.toFixed(4));

        toClose.push(pos);
      }
    }

    for (const pos of toClose) {
      this.openPositions = this.openPositions.filter((p) => p.id !== pos.id);
      this.recentTrades.unshift(pos);
      if (this.recentTrades.length > 100) this.recentTrades.pop();
      await this.persistTrade(pos);
    }
  }

  private async persistTrade(trade: ScalperTradeRecord) {
    try {
      await db.scalperTrade.create({
        data: {
          id: trade.id,
          timestamp: new Date(trade.timestamp),
          symbol: trade.symbol,
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          quantity: trade.quantity,
          holdingTimeMs: trade.holdingTimeMs,
          grossPnlUsd: trade.grossPnlUsd,
          feeUsd: trade.feeUsd,
          slippageUsd: trade.slippageUsd,
          netPnlUsd: trade.netPnlUsd,
          netPnlPct: trade.netPnlPct,
          scalperScore: trade.scalperScore,
          volatilityRegime: trade.volatilityRegime,
          exitReason: trade.exitReason,
        },
      });

      // Update Scalper Strategy Account
      const acc = await db.strategyAccount.findUnique({ where: { id: 'scalper' } });
      if (acc) {
        const isWin = trade.netPnlUsd > 0;
        const newTotal = acc.totalTrades + 1;
        const newWin = acc.winningTrades + (isWin ? 1 : 0);
        const newLoss = acc.losingTrades + (isWin ? 0 : 1);
        const newNet = acc.netPnlUsd + trade.netPnlUsd;
        const newBalance = acc.virtualBalanceUsd + trade.netPnlUsd;
        const winRate = (newWin / newTotal) * 100;

        await db.strategyAccount.update({
          where: { id: 'scalper' },
          data: {
            virtualBalanceUsd: Number(newBalance.toFixed(2)),
            totalTrades: newTotal,
            winningTrades: newWin,
            losingTrades: newLoss,
            grossPnlUsd: Number((acc.grossPnlUsd + trade.grossPnlUsd).toFixed(4)),
            totalFeesUsd: Number((acc.totalFeesUsd + trade.feeUsd).toFixed(4)),
            totalSlippageUsd: Number((acc.totalSlippageUsd + trade.slippageUsd).toFixed(4)),
            netPnlUsd: Number(newNet.toFixed(4)),
            winRatePct: Number(winRate.toFixed(2)),
          },
        });
      }

      logger.log(
        'INFO',
        'SCALPER',
        `Closed Micro-Scalp LONG on ${trade.symbol} (${trade.exitReason}): Net PnL $${trade.netPnlUsd} (${trade.netPnlPct}%)`
      );
    } catch (e: any) {
      console.error('Error persisting scalper trade:', e.message);
    }
  }
}
