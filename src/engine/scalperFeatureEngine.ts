import { OrderBookDepth, PriceBookTicker, ScalperFeatureSet, VolatilityRegime } from '../lib/types';
import { OrderBookCache } from './orderBookCache';
import { TradeFlowTracker } from './tradeFlowTracker';

interface PriceTickHistory {
  price: number;
  timestamp: number;
}

export class ScalperFeatureEngine {
  private priceHistories = new Map<string, PriceTickHistory[]>();

  public processPair(
    symbol: string,
    cache: OrderBookCache,
    tradeFlowTracker: TradeFlowTracker
  ): ScalperFeatureSet | null {
    const ticker = cache.getTicker(symbol);
    const depth = cache.getDepth(symbol);

    if (!ticker || ticker.bidPrice <= 0 || ticker.askPrice <= 0) return null;

    const now = ticker.updatedAt || Date.now();
    const midPrice = (ticker.bidPrice + ticker.askPrice) / 2;
    const spreadUsd = ticker.askPrice - ticker.bidPrice;
    const spreadPct = (spreadUsd / midPrice) * 100;

    // Track rolling price history
    if (!this.priceHistories.has(symbol)) {
      this.priceHistories.set(symbol, []);
    }
    const history = this.priceHistories.get(symbol)!;
    history.push({ price: midPrice, timestamp: now });

    // Prune history older than 60s
    while (history.length > 0 && history[0].timestamp < now - 60000) {
      history.shift();
    }

    // Compute returns
    const return100ms = this.calculateReturn(history, now, 100);
    const return500ms = this.calculateReturn(history, now, 500);
    const return1s = this.calculateReturn(history, now, 1000);
    const return5s = this.calculateReturn(history, now, 5000);
    const return10s = this.calculateReturn(history, now, 10000);
    const return30s = this.calculateReturn(history, now, 30000);
    const return60s = this.calculateReturn(history, now, 60000);

    // Compute 10s volatility
    const volatilityPct = this.calculateVolatilityPct(history, now, 10000);

    // Classify Volatility Regime
    const volatilityRegime = this.classifyVolatilityRegime(volatilityPct);

    // Calculate Adaptive Movement Threshold based on Volatility Regime
    const adaptiveThresholdPct = this.calculateAdaptiveThreshold(symbol, volatilityRegime, volatilityPct);

    // Order book imbalance (top 10 levels)
    const asks = depth?.asks || [{ price: ticker.askPrice, qty: ticker.askQty }];
    const bids = depth?.bids || [{ price: ticker.bidPrice, qty: ticker.bidQty }];
    const imbalanceRatio = this.calculateImbalance(bids, asks, 10);

    // Trade flow metrics
    const tf = tradeFlowTracker.getSnapshot(symbol);

    return {
      symbol,
      timestamp: now,
      midPrice: Number(midPrice.toFixed(4)),
      bidPrice: ticker.bidPrice,
      askPrice: ticker.askPrice,
      spreadUsd: Number(spreadUsd.toFixed(4)),
      spreadPct: Number(spreadPct.toFixed(4)),
      return100ms: Number(return100ms.toFixed(4)),
      return500ms: Number(return500ms.toFixed(4)),
      return1s: Number(return1s.toFixed(4)),
      return5s: Number(return5s.toFixed(4)),
      return10s: Number(return10s.toFixed(4)),
      return30s: Number(return30s.toFixed(4)),
      return60s: Number(return60s.toFixed(4)),
      volatilityRegime,
      adaptiveThresholdPct: Number(adaptiveThresholdPct.toFixed(4)),
      imbalanceRatio: Number(imbalanceRatio.toFixed(4)),
      tradeFlowRatio: tf.buySellRatio,
    };
  }

  private calculateReturn(history: PriceTickHistory[], now: number, windowMs: number): number {
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

  private calculateVolatilityPct(history: PriceTickHistory[], now: number, windowMs: number): number {
    const cutoff = now - windowMs;
    const recent = history.filter((h) => h.timestamp >= cutoff);
    if (recent.length < 3) return 0.01;

    let sum = 0;
    for (const r of recent) sum += r.price;
    const mean = sum / recent.length;

    let varSum = 0;
    for (const r of recent) varSum += Math.pow(r.price - mean, 2);
    const stdDev = Math.sqrt(varSum / recent.length);
    return mean > 0 ? (stdDev / mean) * 100 : 0.01;
  }

  public classifyVolatilityRegime(volatilityPct: number): VolatilityRegime {
    if (volatilityPct < 0.01) return 'VERY_LOW';
    if (volatilityPct < 0.03) return 'LOW';
    if (volatilityPct < 0.08) return 'MEDIUM';
    if (volatilityPct < 0.15) return 'HIGH';
    return 'VERY_HIGH';
  }

  public calculateAdaptiveThreshold(symbol: string, regime: VolatilityRegime, volatilityPct: number): number {
    // Dynamic adaptive threshold based on asset type & volatility regime
    let base = 0.03; // 0.03% base expected movement requirement

    if (symbol.startsWith('BTC')) base = 0.025;
    else if (symbol.startsWith('ETH')) base = 0.030;
    else if (symbol.startsWith('SOL')) base = 0.040;
    else if (symbol.startsWith('DOGE') || symbol.startsWith('SHIB') || symbol.startsWith('PEPE')) base = 0.060;

    switch (regime) {
      case 'VERY_LOW':
        return base * 0.8;
      case 'LOW':
        return base * 1.0;
      case 'MEDIUM':
        return base * 1.3;
      case 'HIGH':
        return base * 1.8;
      case 'VERY_HIGH':
        return base * 2.5;
      default:
        return base;
    }
  }

  private calculateImbalance(bids: { qty: number }[], asks: { qty: number }[], levels: number): number {
    let bidVol = 0;
    let askVol = 0;

    for (let i = 0; i < Math.min(levels, bids.length); i++) bidVol += bids[i].qty;
    for (let i = 0; i < Math.min(levels, asks.length); i++) askVol += asks[i].qty;

    const total = bidVol + askVol;
    return total > 0 ? (bidVol - askVol) / total : 0;
  }
}
