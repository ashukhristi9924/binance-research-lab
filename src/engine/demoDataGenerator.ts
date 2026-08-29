import { OrderBookCache } from './orderBookCache';

export class DemoDataGenerator {
  private timer: NodeJS.Timeout | null = null;
  private prices = new Map<string, number>([
    ['BTCUSDT', 68500.0],
    ['ETHUSDT', 2640.0],
    ['ETHBTC', 0.03854],
    ['BNBUSDT', 580.0],
    ['BNBBTC', 0.00846],
    ['SOLUSDT', 155.0],
    ['SOLBTC', 0.00226],
    ['SOLETH', 0.0587],
    ['XRPUSDT', 0.58],
    ['XRPBTC', 0.0000084],
    ['ADAUSDT', 0.36],
    ['ADABTC', 0.0000052],
    ['DOGEUSDT', 0.12],
    ['DOGEBTC', 0.00000175],
  ]);

  public start(cache: OrderBookCache, onTick: (symbol: string) => void) {
    if (this.timer) return;

    this.timer = setInterval(() => {
      // Pick random pair to mutate slightly
      const symbols = Array.from(this.prices.keys());
      const chosen = symbols[Math.floor(Math.random() * symbols.length)];
      const current = this.prices.get(chosen)!;

      // Small random fluctuation (-0.1% to +0.1%)
      const delta = (Math.random() - 0.495) * 0.002;
      let nextPrice = current * (1 + delta);

      // Occasional tiny triangular imbalance simulation (0.05% spike to generate realistic opportunities)
      if (Math.random() < 0.15 && (chosen === 'ETHBTC' || chosen === 'SOLBTC' || chosen === 'BNBBTC')) {
        nextPrice = nextPrice * 1.0018;
      }

      this.prices.set(chosen, nextPrice);

      const spreadRatio = 0.0002;
      const ask = nextPrice * (1 + spreadRatio);
      const bid = nextPrice * (1 - spreadRatio);
      const now = Date.now();

      cache.updateTicker({
        symbol: chosen,
        bidPrice: Number(bid.toFixed(8)),
        bidQty: Number((Math.random() * 5 + 0.5).toFixed(4)),
        askPrice: Number(ask.toFixed(8)),
        askQty: Number((Math.random() * 5 + 0.5).toFixed(4)),
        updatedAt: now,
      });

      // Generate 5-level order book depth
      const bids = [];
      const asks = [];
      for (let i = 0; i < 5; i++) {
        bids.push({
          price: Number((bid * (1 - i * 0.0002)).toFixed(8)),
          qty: Number((Math.random() * 2 + 0.2).toFixed(4)),
        });
        asks.push({
          price: Number((ask * (1 + i * 0.0002)).toFixed(8)),
          qty: Number((Math.random() * 2 + 0.2).toFixed(4)),
        });
      }

      cache.updateDepth({
        symbol: chosen,
        bids,
        asks,
        lastUpdateId: now,
        updatedAt: now,
      });

      onTick(chosen);
    }, 200); // 5 updates per second
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
