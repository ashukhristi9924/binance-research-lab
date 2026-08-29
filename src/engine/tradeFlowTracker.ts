import { TradeFlowSnapshot } from '../lib/types';

interface RawTradeEvent {
  price: number;
  qty: number;
  isBuyerMaker: boolean; // isBuyerMaker = true means seller matched ask (aggressive sell), false means buyer matched bid (aggressive buy)
  timestamp: number;
}

export class TradeFlowTracker {
  private tradeHistory = new Map<string, RawTradeEvent[]>();
  private snapshots = new Map<string, TradeFlowSnapshot>();

  public processTrade(symbol: string, price: number, qty: number, isBuyerMaker: boolean, timestamp: number = Date.now()) {
    if (!this.tradeHistory.has(symbol)) {
      this.tradeHistory.set(symbol, []);
    }

    const history = this.tradeHistory.get(symbol)!;
    history.push({ price, qty, isBuyerMaker, timestamp });

    // Keep last 10 seconds of trade history
    const cutoff = timestamp - 10000;
    while (history.length > 0 && history[0].timestamp < cutoff) {
      history.shift();
    }

    // Compute metrics over 5 second window
    const recentCutoff = timestamp - 5000;
    let buyVol = 0;
    let sellVol = 0;
    let totalTrades = 0;

    for (const t of history) {
      if (t.timestamp >= recentCutoff) {
        totalTrades++;
        if (t.isBuyerMaker) {
          // Seller hit the bid (aggressive sell)
          sellVol += t.qty;
        } else {
          // Buyer hit the ask (aggressive buy)
          buyVol += t.qty;
        }
      }
    }

    const durationSec = 5.0;
    const tradesPerSec = Number((totalTrades / durationSec).toFixed(2));
    const volumePerSec = Number(((buyVol + sellVol) / durationSec).toFixed(4));
    const buySellRatio = sellVol > 0 ? Number((buyVol / sellVol).toFixed(3)) : buyVol > 0 ? 10.0 : 1.0;

    // Estimate acceleration (trade count in last 1s vs prior 4s avg)
    const cutoff1s = timestamp - 1000;
    let trades1s = 0;
    for (const t of history) {
      if (t.timestamp >= cutoff1s) trades1s++;
    }
    const priorAvg1s = (totalTrades - trades1s) / 4.0;
    const acceleration = priorAvg1s > 0 ? Number((trades1s / priorAvg1s).toFixed(2)) : 1.0;

    const snapshot: TradeFlowSnapshot = {
      symbol,
      buyVolume: Number(buyVol.toFixed(4)),
      sellVolume: Number(sellVol.toFixed(4)),
      buySellRatio,
      tradeCountPerSec: tradesPerSec,
      volumePerSec,
      tradeAcceleration: acceleration,
      lastUpdate: timestamp,
    };

    this.snapshots.set(symbol, snapshot);
    return snapshot;
  }

  public getSnapshot(symbol: string): TradeFlowSnapshot {
    return (
      this.snapshots.get(symbol) || {
        symbol,
        buyVolume: 0,
        sellVolume: 0,
        buySellRatio: 1.0,
        tradeCountPerSec: 0,
        volumePerSec: 0,
        tradeAcceleration: 1.0,
        lastUpdate: Date.now(),
      }
    );
  }
}
