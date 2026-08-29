import assert from 'node:assert';
import { test } from 'node:test';
import { SlippageModel } from '../src/engine/slippageModel';

test('SlippageModel: VWAP order book consumption for BUY action', () => {
  const asks = [
    { price: 70000, qty: 0.2 },
    { price: 70001, qty: 0.3 },
    { price: 70003, qty: 0.5 },
  ];

  // Want to buy 1 BTC across order book depth
  const result = SlippageModel.calculateVwapExecution('BUY', asks, 1.0, false);
  assert.strictEqual(result.sufficientLiquidity, true);
  assert.strictEqual(result.executedQty, 1.0);
  assert.ok(result.vwapPrice > 70000);
});

test('SlippageModel: Insufficient liquidity flag when order volume exceeds depth', () => {
  const bids = [
    { price: 69000, qty: 0.1 },
  ];

  const result = SlippageModel.calculateVwapExecution('SELL', bids, 10.0, false);
  assert.strictEqual(result.sufficientLiquidity, false);
});
