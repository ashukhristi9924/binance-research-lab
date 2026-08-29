import { FollowerBetaMetrics } from '../lib/types';

interface PriceSnapshot {
  timestamp: number;
  price: number;
}

export class RollingBetaCalculator {
  private btcHistory: PriceSnapshot[] = [];
  private followerHistories = new Map<string, PriceSnapshot[]>();

  public updateBtcPrice(price: number, timestamp: number = Date.now()) {
    if (price <= 0) return;
    this.btcHistory.push({ price, timestamp });
    const cutoff = timestamp - 24 * 3600 * 1000;
    while (this.btcHistory.length > 0 && this.btcHistory[0].timestamp < cutoff) {
      this.btcHistory.shift();
    }
  }

  public updateFollowerPrice(symbol: string, price: number, timestamp: number = Date.now()) {
    if (price <= 0) return;
    if (!this.followerHistories.has(symbol)) {
      this.followerHistories.set(symbol, []);
    }
    const history = this.followerHistories.get(symbol)!;
    history.push({ price, timestamp });
    const cutoff = timestamp - 24 * 3600 * 1000;
    while (history.length > 0 && history[0].timestamp < cutoff) {
      history.shift();
    }
  }

  public calculateBeta(symbol: string, windowMs: number = 300000): number {
    const followerHistory = this.followerHistories.get(symbol);
    if (!followerHistory || followerHistory.length < 5 || this.btcHistory.length < 5) {
      return 1.0; // Default beta 1.0 when insufficient history
    }

    const now = Date.now();
    const cutoff = now - windowMs;

    // Filter aligned time points
    const btcPoints = this.btcHistory.filter((p) => p.timestamp >= cutoff);
    const followerPoints = followerHistory.filter((p) => p.timestamp >= cutoff);

    if (btcPoints.length < 3 || followerPoints.length < 3) {
      return 1.0;
    }

    // Compute returns
    const btcReturns: number[] = [];
    const followerReturns: number[] = [];

    const minLen = Math.min(btcPoints.length, followerPoints.length);
    for (let i = 1; i < minLen; i++) {
      const bRet = (btcPoints[i].price - btcPoints[i - 1].price) / btcPoints[i - 1].price;
      const fRet = (followerPoints[i].price - followerPoints[i - 1].price) / followerPoints[i - 1].price;
      btcReturns.push(bRet);
      followerReturns.push(fRet);
    }

    if (btcReturns.length === 0) return 1.0;

    const bMean = btcReturns.reduce((a, b) => a + b, 0) / btcReturns.length;
    const fMean = followerReturns.reduce((a, b) => a + b, 0) / followerReturns.length;

    let cov = 0;
    let bVar = 0;

    for (let i = 0; i < btcReturns.length; i++) {
      const bDiff = btcReturns[i] - bMean;
      const fDiff = followerReturns[i] - fMean;
      cov += bDiff * fDiff;
      bVar += bDiff * bDiff;
    }

    if (bVar < 1e-9) return 1.0;

    const beta = cov / bVar;
    return Math.max(0.1, Math.min(3.5, Number(beta.toFixed(3))));
  }

  public getBetaMetrics(symbol: string): FollowerBetaMetrics {
    return {
      symbol,
      beta1m: this.calculateBeta(symbol, 60000),
      beta5m: this.calculateBeta(symbol, 300000),
      beta15m: this.calculateBeta(symbol, 900000),
      beta30m: this.calculateBeta(symbol, 1800000),
      beta1h: this.calculateBeta(symbol, 3600000),
      beta4h: this.calculateBeta(symbol, 14400000),
      beta24h: this.calculateBeta(symbol, 86400000),
    };
  }
}
