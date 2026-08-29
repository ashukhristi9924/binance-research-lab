import { db } from '../lib/db';
import {
  MarketMakingFillRecord,
  MarketMakingInventoryState,
  MarketMakingQuoteRecord,
  MarketSnapshot,
  PriceBookTicker,
} from '../lib/types';
import { FeeCalculator } from './feeCalculator';
import { logger } from './logger';
import { OrderBookCache } from './orderBookCache';

export interface MarketMakingSettings {
  mode: 'CASH_ONLY' | 'INVENTORY_SEEDED'; // Mode A: CASH_ONLY (default) | Mode B: INVENTORY_SEEDED
  quoteSpreadPct: number;       // default 0.015% spread around mid price
  orderSizeBase: number;        // default 0.01 BTC per quote
  maxInventoryBase: number;     // default 0.20 BTC max position limit
  refreshIntervalMs: number;    // default 500ms quote refresh
  makerFeePct: number;          // default 0.075% maker fee
  simulatedQueueFactor: number; // multiplier for order book queue consumption
  startingBtcQty: number;       // default 0.0 BTC (Cash Only) or 0.01 BTC (Seeded)
  startingQuoteUsd: number;     // default $10,000.0 USDT
}

interface PendingFillTracker {
  fillRecord: MarketMakingFillRecord;
  entryTimestamp: number;
}

export class MarketMakingEngine {
  private active: boolean = true;
  private targetSymbol: string = 'BTCUSDT';

  private settings: MarketMakingSettings = {
    mode: 'CASH_ONLY',
    quoteSpreadPct: 0.015,
    orderSizeBase: 0.01,
    maxInventoryBase: 0.20,
    refreshIntervalMs: 500,
    makerFeePct: 0.075,
    simulatedQueueFactor: 1.0,
    startingBtcQty: 0.0,
    startingQuoteUsd: 10000.0,
  };

  private inventory: MarketMakingInventoryState = {
    mode: 'CASH_ONLY',
    symbol: 'BTCUSDT',
    baseInventoryQty: 0.0,
    quoteBalanceUsd: 10000.0,
    startingBtcQty: 0.0,
    startingQuoteUsd: 10000.0,
    totalPortfolioUsd: 10000.0,
    inventorySkew: 0.0,
    avgCostBasisUsd: 0.0,
    unrealizedPnlUsd: 0.0,
    realizedPnlUsd: 0.0,
  };

  private activeQuote: MarketMakingQuoteRecord | null = null;
  private pendingFills: PendingFillTracker[] = [];
  private recentFills: MarketMakingFillRecord[] = [];
  private lastRefreshTime: number = 0;

  public setEnabled(enabled: boolean) {
    this.active = enabled;
  }

  public isEnabled(): boolean {
    return this.active;
  }

  public setMode(mode: 'CASH_ONLY' | 'INVENTORY_SEEDED', startingBtc: number = 0.0, startingUsdt: number = 10000.0) {
    this.settings.mode = mode;
    this.settings.startingBtcQty = startingBtc;
    this.settings.startingQuoteUsd = startingUsdt;

    this.inventory.mode = mode;
    this.inventory.baseInventoryQty = startingBtc;
    this.inventory.quoteBalanceUsd = startingUsdt;
    this.inventory.startingBtcQty = startingBtc;
    this.inventory.startingQuoteUsd = startingUsdt;

    logger.log('INFO', 'MARKET_MAKING', `Switched Market Making Mode to ${mode} (BTC: ${startingBtc}, USDT: $${startingUsdt})`);
  }

  public updateSettings(newSettings: Partial<MarketMakingSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  public getSettings(): MarketMakingSettings {
    return this.settings;
  }

  public getInventory(): MarketMakingInventoryState {
    return this.inventory;
  }

  public getActiveQuote(): MarketMakingQuoteRecord | null {
    return this.activeQuote;
  }

  public getRecentFills(): MarketMakingFillRecord[] {
    return this.recentFills;
  }

  /**
   * Processes live ticker & order book to update simulated quotes, queue consumption, and adverse selection.
   */
  public evaluateMarket(symbol: string, cache: OrderBookCache, marketVolumePerSec: number = 1.0) {
    if (!this.active || symbol !== this.targetSymbol) return;

    const ticker = cache.getTicker(symbol);
    if (!ticker || ticker.bidPrice <= 0 || ticker.askPrice <= 0) return;

    const now = Date.now();
    const midPrice = (ticker.bidPrice + ticker.askPrice) / 2;

    // Update Unrealized P&L & Total Portfolio Value
    const btcValue = this.inventory.baseInventoryQty * midPrice;
    this.inventory.totalPortfolioUsd = Number((this.inventory.quoteBalanceUsd + btcValue).toFixed(2));
    this.inventory.inventorySkew = Number((this.inventory.baseInventoryQty / this.settings.maxInventoryBase).toFixed(2));

    if (this.inventory.baseInventoryQty > 0 && this.inventory.avgCostBasisUsd > 0) {
      this.inventory.unrealizedPnlUsd = Number(
        (this.inventory.baseInventoryQty * (midPrice - this.inventory.avgCostBasisUsd)).toFixed(2)
      );
    } else {
      this.inventory.unrealizedPnlUsd = 0.0;
    }

    // Evaluate Post-Fill Adverse Selection Tracker for pending fills
    this.evaluateAdverseSelection(midPrice, now);

    // Update active quote queue consumption
    if (this.activeQuote && this.activeQuote.status === 'ACTIVE') {
      this.activeQuote.queueConsumed += Number((marketVolumePerSec * 0.1 * this.settings.simulatedQueueFactor).toFixed(4));
    }

    // Refresh Simulated Quotes if refresh interval elapsed
    if (now - this.lastRefreshTime >= this.settings.refreshIntervalMs) {
      this.lastRefreshTime = now;
      this.updateSimulatedQuotes(ticker, midPrice, marketVolumePerSec, now);
    }
  }

  private updateSimulatedQuotes(ticker: PriceBookTicker, midPrice: number, marketVolume: number, now: number) {
    // Inventory skew adjustment: If long BTC, push bid down / bring ask closer to encourage selling
    const skewAdjustmentPct = (this.inventory.baseInventoryQty / this.settings.maxInventoryBase) * 0.005;

    const halfSpread = (this.settings.quoteSpreadPct / 100) / 2;
    let simBid = Number((midPrice * (1 - halfSpread - skewAdjustmentPct)).toFixed(2));
    let simAsk = Number((midPrice * (1 + halfSpread - skewAdjustmentPct)).toFixed(2));

    // Ensure simulated quotes do not cross current best bid/ask
    simBid = Math.min(simBid, ticker.bidPrice);
    simAsk = Math.max(simAsk, ticker.askPrice);

    // Spread per unit vs Total Spread capture calculation (Corrected Phase 3)
    const spreadPerUnitUsd = Number((simAsk - simBid).toFixed(2));
    const totalSpreadUsd = Number((spreadPerUnitUsd * this.settings.orderSizeBase).toFixed(4));

    // Queue Estimate
    const queueAhead = Number((ticker.bidQty * 0.5).toFixed(4));

    const quoteRecord: MarketMakingQuoteRecord = {
      id: `mmq-${now}`,
      timestamp: now,
      symbol: this.targetSymbol,
      simulatedBid: simBid,
      simulatedAsk: simAsk,
      midPrice: Number(midPrice.toFixed(2)),
      spreadPerUnitUsd,
      totalSpreadUsd,
      orderSizeBase: this.settings.orderSizeBase,
      queueAhead,
      queueConsumed: 0.0,
      status: 'ACTIVE',
    };

    this.activeQuote = quoteRecord;

    // Simulate Fill Execution if queue consumed and market trade occurs
    const queueConsumedRatio = queueAhead > 0 ? quoteRecord.queueConsumed / queueAhead : 1.0;

    if (queueConsumedRatio >= 0.8 && Math.random() < 0.35) {
      const fillSide: 'BUY' | 'SELL' = Math.random() > 0.5 ? 'BUY' : 'SELL';
      const orderQty = this.settings.orderSizeBase;

      // Phase 6 & 8: Inventory Validation
      if (fillSide === 'SELL' && this.inventory.baseInventoryQty < orderQty) {
        logger.log(
          'WARN',
          'MARKET_MAKING',
          `REJECTED SELL ${orderQty} BTC: INSUFFICIENT VIRTUAL BTC INVENTORY (${this.inventory.baseInventoryQty.toFixed(4)} BTC available)`
        );
        return;
      }

      if (fillSide === 'BUY' && this.inventory.baseInventoryQty + orderQty > this.settings.maxInventoryBase) {
        logger.log('WARN', 'MARKET_MAKING', `REJECTED BUY ${orderQty} BTC: MAX INVENTORY EXCEEDED`);
        return;
      }

      const fillPrice = fillSide === 'BUY' ? simBid : simAsk;

      // Capture placement & fill market state snapshots
      const placementSnapshot: MarketSnapshot = {
        timestamp: now - 500,
        bestBid: ticker.bidPrice,
        bestAsk: ticker.askPrice,
        midPrice: Number(midPrice.toFixed(2)),
        simulatedBid: simBid,
        simulatedAsk: simAsk,
      };

      const fillSnapshot: MarketSnapshot = {
        timestamp: now,
        bestBid: ticker.bidPrice,
        bestAsk: ticker.askPrice,
        midPrice: Number(midPrice.toFixed(2)),
        simulatedBid: simBid,
        simulatedAsk: simAsk,
      };

      this.executeSimulatedFill(fillSide, fillPrice, orderQty, spreadPerUnitUsd, totalSpreadUsd, placementSnapshot, fillSnapshot, queueAhead, quoteRecord.queueConsumed, now);
    }
  }

  private async executeSimulatedFill(
    side: 'BUY' | 'SELL',
    fillPrice: number,
    qty: number,
    spreadPerUnitUsd: number,
    totalSpreadUsd: number,
    placementSnapshot: MarketSnapshot,
    fillSnapshot: MarketSnapshot,
    queueAhead: number,
    queueConsumed: number,
    now: number
  ) {
    const notionalUsd = Number((fillPrice * qty).toFixed(4));
    
    // Fee Engine Integration (Phase 4 & 5)
    const feeRatePct = this.settings.makerFeePct;
    const feeUsd = Number(FeeCalculator.calculateFeeUsd(notionalUsd, feeRatePct).toFixed(4));
    const slippageUsd = 0.0; // Resting limit quote fills at limit price

    const startingBtc = this.inventory.baseInventoryQty;
    const startingUsdt = this.inventory.quoteBalanceUsd;

    if (side === 'BUY') {
      const prevTotalBtc = this.inventory.baseInventoryQty;
      const prevTotalCost = prevTotalBtc * this.inventory.avgCostBasisUsd;
      this.inventory.baseInventoryQty += qty;
      this.inventory.quoteBalanceUsd -= (notionalUsd + feeUsd);
      this.inventory.avgCostBasisUsd = Number(((prevTotalCost + notionalUsd) / this.inventory.baseInventoryQty).toFixed(2));
    } else {
      this.inventory.baseInventoryQty -= qty;
      this.inventory.quoteBalanceUsd += (notionalUsd - feeUsd);
    }

    const endingBtc = this.inventory.baseInventoryQty;
    const endingUsdt = this.inventory.quoteBalanceUsd;

    // P&L Waterfall Formula (Phase 12, 15, 17)
    const grossPnlUsd = Number((totalSpreadUsd / 2).toFixed(4)); // Half spread captured per fill side
    const totalCostsUsd = Number((feeUsd + slippageUsd).toFixed(4));
    const realizedPnlUsd = Number((grossPnlUsd - totalCostsUsd).toFixed(4));

    const fillRecord: MarketMakingFillRecord = {
      id: `mmf-${now}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now,
      orderPlacementTime: now - 500,
      symbol: this.targetSymbol,
      side,
      fillPrice,
      quantity: qty,
      notionalUsd,
      spreadPerUnitUsd,
      totalSpreadUsd,
      feeType: 'MAKER',
      feeRatePct,
      feeUsd,
      slippageUsd,
      adverseSelection100ms: 0,
      adverseSelection1s: 0,
      adverseSelection3s: 0,
      adverseSelection5s: 0,
      grossPnlUsd,
      totalCostsUsd,
      realizedPnlUsd,
      placementSnapshot,
      fillSnapshot,
      startingBtc,
      endingBtc,
      startingUsdt,
      endingUsdt,
      queueAhead,
      queueConsumed,
      fillStatus: 'VALID',
    };

    this.pendingFills.push({
      fillRecord,
      entryTimestamp: now,
    });

    this.recentFills.unshift(fillRecord);
    if (this.recentFills.length > 50) this.recentFills.pop();

    if (this.activeQuote) {
      this.activeQuote.status = 'FILLED';
    }

    this.inventory.realizedPnlUsd = Number((this.inventory.realizedPnlUsd + realizedPnlUsd).toFixed(4));

    // Persist fill to DB
    try {
      await db.marketMakingFill.create({
        data: {
          id: fillRecord.id,
          timestamp: new Date(fillRecord.timestamp),
          orderPlacementTime: new Date(fillRecord.orderPlacementTime),
          symbol: fillRecord.symbol,
          side: fillRecord.side,
          fillPrice: fillRecord.fillPrice,
          quantity: fillRecord.quantity,
          notionalUsd: fillRecord.notionalUsd,
          spreadPerUnitUsd: fillRecord.spreadPerUnitUsd,
          totalSpreadUsd: fillRecord.totalSpreadUsd,
          feeType: fillRecord.feeType,
          feeRatePct: fillRecord.feeRatePct,
          feeUsd: fillRecord.feeUsd,
          slippageUsd: fillRecord.slippageUsd,
          adverseSelection100ms: 0,
          adverseSelection1s: 0,
          adverseSelection3s: 0,
          adverseSelection5s: 0,
          grossPnlUsd: fillRecord.grossPnlUsd,
          totalCostsUsd: fillRecord.totalCostsUsd,
          realizedPnlUsd: fillRecord.realizedPnlUsd,
          bestBidPlacement: placementSnapshot.bestBid,
          bestAskPlacement: placementSnapshot.bestAsk,
          midPlacement: placementSnapshot.midPrice,
          simBidPlacement: placementSnapshot.simulatedBid,
          simAskPlacement: placementSnapshot.simulatedAsk,
          bestBidFill: fillSnapshot.bestBid,
          bestAskFill: fillSnapshot.bestAsk,
          midFill: fillSnapshot.midPrice,
          simBidFill: fillSnapshot.simulatedBid,
          simAskFill: fillSnapshot.simulatedAsk,
          startingBtc: fillRecord.startingBtc,
          endingBtc: fillRecord.endingBtc,
          startingUsdt: fillRecord.startingUsdt,
          endingUsdt: fillRecord.endingUsdt,
          queueAhead: fillRecord.queueAhead,
          queueConsumed: fillRecord.queueConsumed,
          fillStatus: fillRecord.fillStatus,
        },
      });

      // Update Market Making Strategy Account
      const acc = await db.strategyAccount.findUnique({ where: { id: 'market_making' } });
      if (acc) {
        const isWin = fillRecord.realizedPnlUsd > 0;
        const newTotal = acc.totalTrades + 1;
        const newWin = acc.winningTrades + (isWin ? 1 : 0);
        const newLoss = acc.losingTrades + (isWin ? 0 : 1);
        const newNet = acc.netPnlUsd + fillRecord.realizedPnlUsd;
        const newBalance = acc.virtualBalanceUsd + fillRecord.realizedPnlUsd;
        const winRate = (newWin / newTotal) * 100;

        await db.strategyAccount.update({
          where: { id: 'market_making' },
          data: {
            virtualBalanceUsd: Number(newBalance.toFixed(2)),
            totalTrades: newTotal,
            winningTrades: newWin,
            losingTrades: newLoss,
            grossPnlUsd: Number((acc.grossPnlUsd + fillRecord.grossPnlUsd).toFixed(4)),
            totalFeesUsd: Number((acc.totalFeesUsd + feeUsd).toFixed(4)),
            netPnlUsd: Number(newNet.toFixed(4)),
            winRatePct: Number(winRate.toFixed(2)),
          },
        });
      }

      logger.log(
        'INFO',
        'MARKET_MAKING',
        `Simulated Quote Filled (${side}) on ${this.targetSymbol} @ ${fillPrice} (Spread/Unit: $${spreadPerUnitUsd}, Total Spread: $${totalSpreadUsd}, Fee: -$${feeUsd})`
      );
    } catch (e: any) {
      console.error('Error persisting MM fill:', e.message);
    }
  }

  private evaluateAdverseSelection(currentMidPrice: number, now: number) {
    for (let i = this.pendingFills.length - 1; i >= 0; i--) {
      const tracker = this.pendingFills[i];
      const elapsed = now - tracker.entryTimestamp;
      const f = tracker.fillRecord;

      // BUY: Adverse selection if mid price falls after buy
      // SELL: Adverse selection if mid price rises after sell
      const adverseMove = f.side === 'BUY' ? f.fillPrice - currentMidPrice : currentMidPrice - f.fillPrice;
      const adverseImpactUsd = Number((Math.max(0, adverseMove) * f.quantity).toFixed(4));

      if (elapsed >= 100 && f.adverseSelection100ms === 0) {
        f.adverseSelection100ms = adverseImpactUsd;
      }
      if (elapsed >= 1000 && f.adverseSelection1s === 0) {
        f.adverseSelection1s = adverseImpactUsd;
      }
      if (elapsed >= 3000 && f.adverseSelection3s === 0) {
        f.adverseSelection3s = adverseImpactUsd;
      }
      if (elapsed >= 5000 && f.adverseSelection5s === 0) {
        f.adverseSelection5s = adverseImpactUsd;
        this.pendingFills.splice(i, 1);
      }
    }
  }
}
