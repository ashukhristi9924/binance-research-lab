import { OrderBookDepth, PriceBookTicker } from '../lib/types';

export class OrderBookCache {
  private tickers = new Map<string, PriceBookTicker>();
  private depths = new Map<string, OrderBookDepth>();
  private lastUpdateTimestamp: number = Date.now();

  public updateTicker(ticker: PriceBookTicker) {
    this.tickers.set(ticker.symbol, ticker);
    this.lastUpdateTimestamp = Date.now();

    // Also update top level of depth if depth is not available yet
    if (!this.depths.has(ticker.symbol)) {
      this.depths.set(ticker.symbol, {
        symbol: ticker.symbol,
        bids: [{ price: ticker.bidPrice, qty: ticker.bidQty }],
        asks: [{ price: ticker.askPrice, qty: ticker.askQty }],
        lastUpdateId: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      const existing = this.depths.get(ticker.symbol)!;
      if (existing.bids.length > 0) existing.bids[0] = { price: ticker.bidPrice, qty: ticker.bidQty };
      if (existing.asks.length > 0) existing.asks[0] = { price: ticker.askPrice, qty: ticker.askQty };
      existing.updatedAt = Date.now();
    }
  }

  public updateDepth(depth: OrderBookDepth) {
    this.depths.set(depth.symbol, depth);
    this.lastUpdateTimestamp = Date.now();

    // Sync top of book ticker if available
    if (depth.bids.length > 0 && depth.asks.length > 0) {
      this.tickers.set(depth.symbol, {
        symbol: depth.symbol,
        bidPrice: depth.bids[0].price,
        bidQty: depth.bids[0].qty,
        askPrice: depth.asks[0].price,
        askQty: depth.asks[0].qty,
        updatedAt: Date.now(),
      });
    }
  }

  public getTicker(symbol: string): PriceBookTicker | undefined {
    return this.tickers.get(symbol);
  }

  public getDepth(symbol: string): OrderBookDepth | undefined {
    return this.depths.get(symbol);
  }

  public getAllTickers(): PriceBookTicker[] {
    return Array.from(this.tickers.values());
  }

  public getLastUpdateTimestamp(): number {
    return this.lastUpdateTimestamp;
  }

  public isStale(maxAgeMs: number = 3000): boolean {
    return Date.now() - this.lastUpdateTimestamp > maxAgeMs;
  }

  public clear() {
    this.tickers.clear();
    this.depths.clear();
  }
}
