import { PriceBookTicker, BtcShockFeatureSet } from '../lib/types';

interface PriceTick {
  price: number;
  timestamp: number;
}

export class BtcShockEngine {
  private priceHistory: PriceTick[] = [];
  private tradeCountHistory: PriceTick[] = [];

  public processTicker(ticker: PriceBookTicker, bookImbalance: number = 0.5): BtcShockFeatureSet | null {
    if (!ticker || ticker.symbol !== 'BTCUSDT' || ticker.bidPrice <= 0 || ticker.askPrice <= 0) {
      return null;
    }

    const now = ticker.updatedAt || Date.now();
    const midPrice = (ticker.bidPrice + ticker.askPrice) / 2;

    this.priceHistory.push({ price: midPrice, timestamp: now });
    this.tradeCountHistory.push({ price: midPrice, timestamp: now });

    // Keep up to 60 seconds of tick history
    const cutoff60s = now - 60000;
    while (this.priceHistory.length > 0 && this.priceHistory[0].timestamp < cutoff60s) {
      this.priceHistory.shift();
    }
    while (this.tradeCountHistory.length > 0 && this.tradeCountHistory[0].timestamp < now - 10000) {
      this.tradeCountHistory.shift();
    }

    // Multi-horizon return helper
    const getReturn = (windowMs: number): number => {
      if (this.priceHistory.length < 2) return 0;
      const targetTime = now - windowMs;
      let pastPrice = this.priceHistory[0].price;
      for (let i = this.priceHistory.length - 1; i >= 0; i--) {
        if (this.priceHistory[i].timestamp <= targetTime) {
          pastPrice = this.priceHistory[i].price;
          break;
        }
      }
      return ((midPrice - pastPrice) / pastPrice) * 100;
    };

    const return50ms = getReturn(50);
    const return100ms = getReturn(100);
    const return250ms = getReturn(250);
    const return500ms = getReturn(500);
    const return1s = getReturn(1000);
    const return2s = getReturn(2000);
    const return3s = getReturn(3000);
    const return5s = getReturn(5000);
    const return10s = getReturn(10000);
    const return30s = getReturn(30000);
    const return60s = getReturn(60000);

    // Compute rolling 60s volatility (std dev of 1s returns)
    let sum = 0;
    const returnList: number[] = [];
    for (let i = 1; i < this.priceHistory.length; i++) {
      const ret = (this.priceHistory[i].price - this.priceHistory[i - 1].price) / this.priceHistory[i - 1].price;
      returnList.push(ret * 100);
      sum += ret * 100;
    }
    const mean = returnList.length > 0 ? sum / returnList.length : 0;
    let varSum = 0;
    for (const r of returnList) {
      varSum += (r - mean) * (r - mean);
    }
    const volatility = returnList.length > 1 ? Math.sqrt(varSum / returnList.length) : 0.05;

    // Calculate Adaptive BTC Shock Score (0-100)
    const abs1s = Math.abs(return1s);
    const abs5s = Math.abs(return5s);
    const normShock = (abs1s / (volatility + 0.001)) * 25 + (abs5s / (volatility * 2 + 0.001)) * 25;
    const btcShockScore = Math.min(100, Math.max(0, Math.round(normShock)));

    // Classify Market Regime
    let marketRegime: BtcShockFeatureSet['marketRegime'] = 'NORMAL';
    if (volatility < 0.02) {
      marketRegime = 'LOW_VOLATILITY';
    } else if (volatility > 0.15) {
      marketRegime = 'EXTREME_VOLATILITY';
    } else if (volatility > 0.08) {
      marketRegime = 'HIGH_VOLATILITY';
    } else if (btcShockScore >= 60) {
      marketRegime = 'BTC_SHOCK';
    } else if (Math.abs(return60s) > 0.3) {
      marketRegime = 'BTC_TRENDING';
    } else if (Math.abs(return60s) < 0.05) {
      marketRegime = 'BTC_RANGING';
    }

    const tradeVelocity = this.tradeCountHistory.length;

    return {
      symbol: 'BTCUSDT',
      timestamp: now,
      price: midPrice,
      return50ms,
      return100ms,
      return250ms,
      return500ms,
      return1s,
      return2s,
      return3s,
      return5s,
      return10s,
      return30s,
      return60s,
      volatility,
      btcShockScore,
      marketRegime,
      tradeVelocity,
      bookImbalance,
    };
  }
}
