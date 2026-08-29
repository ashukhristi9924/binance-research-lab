import assert from 'node:assert';
import { test } from 'node:test';
import { MicrostructureEngine } from '../src/engine/microstructureEngine';
import { OrderBookCache } from '../src/engine/orderBookCache';
import { TradeFlowTracker } from '../src/engine/tradeFlowTracker';

test('1. MicrostructureEngine: Imbalance and Composite Signal Score calculation', () => {
  const engine = new MicrostructureEngine();
  const cache = new OrderBookCache();
  const tracker = new TradeFlowTracker();
  const now = Date.now();

  // Heavy Bid Imbalance (Bids >> Asks)
  cache.updateDepth({
    symbol: 'BTCUSDT',
    bids: [
      { price: 70000, qty: 5.0 },
      { price: 69990, qty: 10.0 },
    ],
    asks: [
      { price: 70001, qty: 0.1 },
      { price: 70010, qty: 0.2 },
    ],
    lastUpdateId: now,
    updatedAt: now,
  });
  cache.updateTicker({ symbol: 'BTCUSDT', bidPrice: 70000, bidQty: 5.0, askPrice: 70001, askQty: 0.1, updatedAt: now });

  // Simulate aggressive buys
  tracker.processTrade('BTCUSDT', 70001, 10.0, false, now);

  const signal = engine.evaluateMarket('BTCUSDT', cache, tracker);

  assert.ok(signal !== null);
  assert.strictEqual(signal.symbol, 'BTCUSDT');
  assert.ok(signal.imbalanceTop10 > 0.5);
  assert.ok(signal.signalScore >= 70);
  assert.strictEqual(signal.signalDirection, 'LONG');
});

test('2. MicrostructureEngine: Short-term price return tracking', () => {
  const engine = new MicrostructureEngine();
  const cache = new OrderBookCache();
  const tracker = new TradeFlowTracker();
  const now = Date.now();

  cache.updateTicker({ symbol: 'ETHUSDT', bidPrice: 2500, bidQty: 10, askPrice: 2501, askQty: 10, updatedAt: now });
  engine.evaluateMarket('ETHUSDT', cache, tracker);

  const signal = engine.evaluateMarket('ETHUSDT', cache, tracker);
  assert.ok(signal !== null);
  assert.strictEqual(signal.symbol, 'ETHUSDT');
});
