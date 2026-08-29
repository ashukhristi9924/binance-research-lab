import { UniversePairInfo } from '../lib/types';
import { logger } from './logger';

export class UniverseManager {
  private targetSize: number = 50;
  private refreshIntervalMs: number = 15 * 60 * 1000; // 15 minutes
  private lastRefreshTime: number = 0;
  private universe: UniversePairInfo[] = [];

  // Default initial 50 liquid Binance Spot USDT trading pairs
  private defaultSymbols: string[] = [
    'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
    'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'LINKUSDT', 'DOTUSDT',
    'MATICUSDT', 'LTCUSDT', 'UNIUSDT', 'ATOMUSDT', 'ETCUSDT',
    'APTUSDT', 'FILUSDT', 'ARBUSDT', 'OPUSDT', 'NEARUSDT',
    'INJUSDT', 'TIAUSDT', 'SUIUSDT', 'SEIUSDT', 'FETUSDT',
    'RNDRUSDT', 'ICPUSDT', 'GALAUSDT', 'SHIBUSDT', 'PEPEUSDT',
    'FLOKIUSDT', 'WIFUSDT', 'BONKUSDT', 'ORDIUSDT', 'RUNEUSDT',
    'AAVEUSDT', 'MKRUSDT', 'SNXUSDT', 'LDOUSDT', 'STXUSDT',
    'SANDUSDT', 'MANAUSDT', 'AXSUSDT', 'GRTUSDT', 'FTMUSDT',
    'THETAUSDT', 'EGLDUSDT', 'ALGOUSDT', 'KAVAUSDT', 'EOSUSDT'
  ];

  public constructor() {
    this.rebuildUniverse();
  }

  public setTargetSize(size: number) {
    this.targetSize = size;
    this.rebuildUniverse();
  }

  public getTargetSize(): number {
    return this.targetSize;
  }

  public rebuildUniverse() {
    const selected = this.defaultSymbols.slice(0, this.targetSize);
    this.universe = selected.map((symbol, idx) => ({
      rank: idx + 1,
      symbol,
      volume24hUsd: Number((1000000000 / (idx + 1)).toFixed(0)),
      spreadPct: Number((0.001 + idx * 0.0002).toFixed(4)),
      orderBookDepthUsd: Number((500000 / (idx + 1)).toFixed(0)),
      tradeFrequencyPerSec: Number((25.0 / (idx + 1)).toFixed(2)),
      volatilityPct: Number((0.015 + (idx % 5) * 0.005).toFixed(4)),
      liquidityScore: Math.max(50, 100 - idx),
      scalperScore: 0,
      status: 'ACTIVE',
    }));

    this.lastRefreshTime = Date.now();
    logger.log('INFO', 'UNIVERSE', `Rebuilt Dynamic Market Universe: ${this.universe.length} active USDT pairs.`);
  }

  public getActiveSymbols(): string[] {
    return this.universe.map((u) => u.symbol);
  }

  public getUniverseInfo(): UniversePairInfo[] {
    return this.universe;
  }

  public updatePairMetrics(
    symbol: string,
    spreadPct: number,
    volatilityPct: number,
    tradesPerSec: number,
    scalperScore: number
  ) {
    const pair = this.universe.find((u) => u.symbol === symbol);
    if (pair) {
      pair.spreadPct = spreadPct;
      pair.volatilityPct = volatilityPct;
      pair.tradeFrequencyPerSec = tradesPerSec;
      pair.scalperScore = scalperScore;
    }
  }
}
