import assert from 'node:assert';
import { test } from 'node:test';
import { MarketMakingEngine } from '../src/engine/marketMakingEngine';
import { OrderBookCache } from '../src/engine/orderBookCache';

test('1. MarketMakingEngine: Simulated quote calculation & inventory skew tracking', () => {
  const mm = new MarketMakingEngine();
  const cache = new OrderBookCache();
  const now = Date.now();

  cache.updateTicker({ symbol: 'BTCUSDT', bidPrice: 79990, bidQty: 1.0, askPrice: 79994, askQty: 1.0, updatedAt: now });

  mm.evaluateMarket('BTCUSDT', cache, 2.0);

  const quote = mm.getActiveQuote();
  assert.ok(quote !== null);
  assert.strictEqual(quote.symbol, 'BTCUSDT');
  assert.ok(quote.simulatedBid <= 79990);
  assert.ok(quote.simulatedAsk >= 79994);
  assert.ok(quote.spreadPerUnitUsd > 0);
  assert.ok(quote.totalSpreadUsd > 0);

  const inv = mm.getInventory();
  assert.strictEqual(inv.symbol, 'BTCUSDT');
  assert.ok(inv.quoteBalanceUsd > 0);
});
