import { db } from '../lib/db';
import { MicrostructureFeatureSet, MicrostructureTradeRecord, OrderBookDepth, PriceBookTicker } from '../lib/types';
import { OrderBookCache } from './orderBookCache';
import { TradeFlowTracker } from './tradeFlowTracker';
import { logger } from './logger';

export interface MicrostructureSettings {
  minSignalScore: number;       // default 75
  takeProfitPct: number;        // default 0.03%
  stopLossPct: number;          // default 0.02%
  maxHoldingTimeMs: number;     // default 5000ms
  tradeSizeUsd: number;         // default 1000 USDT
  imbalanceThreshold: number;   // default 0.35 (35% net bid/ask volume imbalance)
  takerFeePct: number;          // default 0.10%
  simulatedLatencyMs: number;   // default 75ms (20ms WS + 5ms decision + 50ms execution)
}

interface PriceHistoryEntry {
  price: number;
  timestamp: number;
}

export class MicrostructureEngine {
  private active: boolean = true;
  private settings: MicrostructureSettings = {
    minSignalScore: 75,
    takeProfitPct: 0.03,
    stopLossPct: 0.02,
    maxHoldingTimeMs: 5000,
    tradeSizeUsd: 1000,
    imbalanceThreshold: 0.35,
    takerFeePct: 0.10,
    simulatedLatencyMs: 75,
  };

  private priceHistories = new Map<string, PriceHistoryEntry[]>();
  private openPositions: MicrostructureTradeRecord[] = [];
  private activeSignals = new Map<string, MicrostructureFeatureSet>();

  public setEnabled(enabled: boolean) {
    this.active = enabled;
  }

  public isEnabled(): boolean {
    return this.active;
  }

  public updateSettings(newSettings: Partial<MicrostructureSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  public getSettings(): MicrostructureSettings {
    return this.settings;
  }

  /**
   * Processes live market depth, ticker, and trade flow to compute microstructure features & signals.
   */
  public evaluateMarket(
    symbol: string,
    cache: OrderBookCache,
    tradeFlowTracker: TradeFlowTracker
  ): MicrostructureFeatureSet | null {
    const ticker = cache.getTicker(symbol);
    const depth = cache.getDepth(symbol);

    if (!ticker || ticker.bidPrice <= 0 || ticker.askPrice <= 0) return null;

    const now = Date.now();
    const midPrice = (ticker.bidPrice + ticker.askPrice) / 2;
    const spreadUsd = ticker.askPrice - ticker.bidPrice;
    const spreadPct = (spreadUsd / midPrice) * 100;

    // Record price history for return & momentum calculations
    if (!this.priceHistories.has(symbol)) {
      this.priceHistories.set(symbol, []);
    }
    const history = this.priceHistories.get(symbol)!;
    history.push({ price: midPrice, timestamp: now });

    // Clean up history older than 60s
    while (history.length > 0 && history[0].timestamp < now - 60000) {
      history.shift();
    }

    // Compute returns
    const momentum1s = this.calculateReturn(history, now, 1000);
    const momentum3s = this.calculateReturn(history, now, 3000);
    const momentum5s = this.calculateReturn(history, now, 5000);
    const momentum10s = this.calculateReturn(history, now, 10000);
    const momentum30s = this.calculateReturn(history, now, 30000);

    // Compute short-term volatility (standard deviation of 1-second returns over last 10s)
    const volatility = this.calculateVolatility(history, now, 10000);

    // Compute Order Book Imbalance (Top 5, 10, 20 levels)
    const asks = depth?.asks || [{ price: ticker.askPrice, qty: ticker.askQty }];
    const bids = depth?.bids || [{ price: ticker.bidPrice, qty: ticker.bidQty }];

    const imbalanceTop5 = this.calculateImbalance(bids, asks, 5);
    const imbalanceTop10 = this.calculateImbalance(bids, asks, 10);
    const imbalanceTop20 = this.calculateImbalance(bids, asks, 20);

    // Compute Depth Imbalance within 0.01% of mid price
    const depthImbalance01 = this.calculateDepthImbalance(bids, asks, midPrice, 0.01);

    // Trade flow metrics
    const tf = tradeFlowTracker.getSnapshot(symbol);

    // =========================================================================
    // COMPOSITE RESEARCH SIGNAL SCORE (0 - 100)
    // =========================================================================
    // Component 1: Order-Book Imbalance Weight (40 points)
    const imbalanceScore = Math.min(40, Math.max(0, (imbalanceTop10 + 1) * 20));

    // Component 2: Trade Flow Buy/Sell Ratio Weight (30 points)
    const flowScore = Math.min(30, Math.max(0, (tf.buySellRatio / 2.0) * 15));

    // Component 3: 1s & 3s Short-term Momentum Weight (20 points)
    const momScore = Math.min(20, Math.max(0, 10 + (momentum1s + momentum3s) * 200));

    // Component 4: Spread Quality Weight (10 points max for tight spreads < 0.01%)
    const spreadScore = Math.max(0, 10 - spreadPct * 500);

    const totalRawScore = Math.round(imbalanceScore + flowScore + momScore + spreadScore);
    const signalScore = Math.min(100, Math.max(0, totalRawScore));

    let signalDirection: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
    if (signalScore >= this.settings.minSignalScore && imbalanceTop10 > this.settings.imbalanceThreshold && tf.buySellRatio > 1.2) {
      signalDirection = 'LONG';
    } else if (signalScore <= 100 - this.settings.minSignalScore && imbalanceTop10 < -this.settings.imbalanceThreshold && tf.buySellRatio < 0.8) {
      signalDirection = 'SHORT';
    }

    const featureSet: MicrostructureFeatureSet = {
      symbol,
      timestamp: now,
      midPrice: Number(midPrice.toFixed(4)),
      spreadUsd: Number(spreadUsd.toFixed(4)),
      spreadPct: Number(spreadPct.toFixed(4)),
      imbalanceTop5: Number(imbalanceTop5.toFixed(4)),
      imbalanceTop10: Number(imbalanceTop10.toFixed(4)),
      imbalanceTop20: Number(imbalanceTop20.toFixed(4)),
      depthImbalance01: Number(depthImbalance01.toFixed(4)),
      tradeFlowRatio: tf.buySellRatio,
      tradesPerSec: tf.tradeCountPerSec,
      volumePerSec: tf.volumePerSec,
      momentum1s: Number(momentum1s.toFixed(4)),
      momentum3s: Number(momentum3s.toFixed(4)),
      momentum5s: Number(momentum5s.toFixed(4)),
      momentum10s: Number(momentum10s.toFixed(4)),
      momentum30s: Number(momentum30s.toFixed(4)),
      volatility: Number(volatility.toFixed(4)),
      signalScore,
      signalDirection,
    };

    this.activeSignals.set(symbol, featureSet);

    // Evaluate open paper position exits
    this.evaluateOpenPositions(symbol, ticker, now);

    // Evaluate new paper position entry if signal active
    if (this.active && signalDirection !== 'NEUTRAL') {
      this.triggerPaperEntry(featureSet, ticker, asks, bids);
    }

    return featureSet;
  }

  private calculateImbalance(bids: { qty: number }[], asks: { qty: number }[], levelsCount: number): number {
    let bidVol = 0;
    let askVol = 0;

    for (let i = 0; i < Math.min(levelsCount, bids.length); i++) {
      bidVol += bids[i].qty;
    }

    for (let i = 0; i < Math.min(levelsCount, asks.length); i++) {
      askVol += asks[i].qty;
    }

    const total = bidVol + askVol;
    if (total <= 0) return 0;
    return (bidVol - askVol) / total;
  }

  private calculateDepthImbalance(
    bids: { price: number; qty: number }[],
    asks: { price: number; qty: number }[],
    midPrice: number,
    depthPct: number
  ): number {
    const range = midPrice * (depthPct / 100);
    const minBidPrice = midPrice - range;
    const maxAskPrice = midPrice + range;

    let bidVol = 0;
    let askVol = 0;

    for (const b of bids) {
      if (b.price >= minBidPrice) bidVol += b.qty;
    }

    for (const a of asks) {
      if (a.price <= maxAskPrice) askVol += a.qty;
    }

    const total = bidVol + askVol;
    return total > 0 ? bidVol / total : 0.5;
  }

  private calculateReturn(history: PriceHistoryEntry[], now: number, windowMs: number): number {
    if (history.length < 2) return 0;

    const targetTime = now - windowMs;
    let pastPrice = history[0].price;

    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].timestamp <= targetTime) {
        pastPrice = history[i].price;
        break;
      }
    }

    const currentPrice = history[history.length - 1].price;
    return pastPrice > 0 ? ((currentPrice - pastPrice) / pastPrice) * 100 : 0;
  }

  private calculateVolatility(history: PriceHistoryEntry[], now: number, windowMs: number): number {
    const cutoff = now - windowMs;
    const recent = history.filter((h) => h.timestamp >= cutoff);
    if (recent.length < 3) return 0;

    let sum = 0;
    for (const r of recent) sum += r.price;
    const mean = sum / recent.length;

    let varSum = 0;
    for (const r of recent) varSum += Math.pow(r.price - mean, 2);
    return Math.sqrt(varSum / recent.length);
  }

  private triggerPaperEntry(
    featureSet: MicrostructureFeatureSet,
    ticker: PriceBookTicker,
    asks: { price: number; qty: number }[],
    bids: { price: number; qty: number }[]
  ) {
    // Limit to max 3 concurrent microstructure positions per symbol
    const existing = this.openPositions.filter((p) => p.symbol === featureSet.symbol);
    if (existing.length >= 3) return;

    const isLong = featureSet.signalDirection === 'LONG';
    const entryPrice = isLong ? ticker.askPrice : ticker.bidPrice;
    const qty = Number((this.settings.tradeSizeUsd / entryPrice).toFixed(6));

    const tradeRecord: MicrostructureTradeRecord = {
      id: `ms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      symbol: featureSet.symbol,
      direction: featureSet.signalDirection as 'LONG' | 'SHORT',
      entryPrice,
      exitPrice: 0,
      quantity: qty,
      signalScore: featureSet.signalScore,
      holdingTimeMs: 0,
      grossPnlUsd: 0,
      feeUsd: 0,
      slippageUsd: 0,
      netPnlUsd: 0,
      netPnlPct: 0,
      exitReason: 'MAX_HOLDING',
      imbalanceRatio: featureSet.imbalanceTop10,
      tradeFlowRatio: featureSet.tradeFlowRatio,
      momentum1s: featureSet.momentum1s,
    };

    this.openPositions.push(tradeRecord);
    logger.log(
      'INFO',
      'MICROSTRUCTURE',
      `Opened Paper Microstructure ${tradeRecord.direction} on ${tradeRecord.symbol} @ ${entryPrice} (Score ${featureSet.signalScore}/100)`
    );
  }

  private async evaluateOpenPositions(symbol: string, ticker: PriceBookTicker, now: number) {
    const toClose: MicrostructureTradeRecord[] = [];

    for (const pos of this.openPositions) {
      if (pos.symbol !== symbol) continue;

      const holdingTime = now - pos.timestamp;
      const isLong = pos.direction === 'LONG';
      const currentPrice = isLong ? ticker.bidPrice : ticker.askPrice;

      let pnlPct = isLong
        ? ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100
        : ((pos.entryPrice - currentPrice) / pos.entryPrice) * 100;

      let exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MAX_HOLDING' | 'IMBALANCE_REVERSAL' | null = null;

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
        const grossPnl = isLong ? (currentPrice - pos.entryPrice) * pos.quantity : (pos.entryPrice - currentPrice) * pos.quantity;
        const fees = (notional * (this.settings.takerFeePct / 100)) * 2; // entry + exit fee
        const slippage = notional * 0.0001; // 0.01% simulated execution slippage
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
      await this.persistTrade(pos);
    }
  }

  private async persistTrade(trade: MicrostructureTradeRecord) {
    try {
      await db.microstructureTrade.create({
        data: {
          id: trade.id,
          timestamp: new Date(trade.timestamp),
          symbol: trade.symbol,
          direction: trade.direction,
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          quantity: trade.quantity,
          signalScore: trade.signalScore,
          holdingTimeMs: trade.holdingTimeMs,
          grossPnlUsd: trade.grossPnlUsd,
          feeUsd: trade.feeUsd,
          slippageUsd: trade.slippageUsd,
          netPnlUsd: trade.netPnlUsd,
          netPnlPct: trade.netPnlPct,
          exitReason: trade.exitReason,
          imbalanceRatio: trade.imbalanceRatio,
          tradeFlowRatio: trade.tradeFlowRatio,
          momentum1s: trade.momentum1s,
        },
      });

      // Update Microstructure Strategy Account stats
      const acc = await db.strategyAccount.findUnique({ where: { id: 'microstructure' } });
      if (acc) {
        const isWin = trade.netPnlUsd > 0;
        const newTotal = acc.totalTrades + 1;
        const newWin = acc.winningTrades + (isWin ? 1 : 0);
        const newLoss = acc.losingTrades + (isWin ? 0 : 1);
        const newNet = acc.netPnlUsd + trade.netPnlUsd;
        const newBalance = acc.virtualBalanceUsd + trade.netPnlUsd;
        const winRate = (newWin / newTotal) * 100;

        await db.strategyAccount.update({
          where: { id: 'microstructure' },
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
        'MICROSTRUCTURE',
        `Closed Microstructure ${trade.direction} on ${trade.symbol} (${trade.exitReason}): Net PnL $${trade.netPnlUsd} (${trade.netPnlPct}%)`
      );
    } catch (e: any) {
      console.error('Error persisting microstructure trade:', e.message);
    }
  }

  public getActiveSignals(): Map<string, MicrostructureFeatureSet> {
    return this.activeSignals;
  }

  public getOpenPositions(): MicrostructureTradeRecord[] {
    return this.openPositions;
  }
}
