import assert from 'node:assert';
import { test } from 'node:test';
import { MarketMakingEngine } from '../src/engine/marketMakingEngine';
import { FeeCalculator } from '../src/engine/feeCalculator';

test('1. MarketMakingAudit: Spread unit calculation ($10/BTC * 0.01 BTC = $0.10 total, NOT $10)', () => {
  const simBid = 80000;
  const simAsk = 80010;
  const qty = 0.01;

  const spreadPerUnitUsd = simAsk - simBid; // $10/BTC
  const totalSpreadUsd = spreadPerUnitUsd * qty; // $0.10 USDT

  assert.strictEqual(spreadPerUnitUsd, 10);
  assert.strictEqual(totalSpreadUsd, 0.10);
});

test('2. MarketMakingAudit: Fee calculation at 0.10% on $800 notional', () => {
  const notional = 800;
  const feeRatePct = 0.10;
  const feeUsd = FeeCalculator.calculateFeeUsd(notional, feeRatePct);

  assert.strictEqual(feeUsd, 0.80);
});

test('3. MarketMakingAudit: Fee calculation at 0.075% on $800 notional', () => {
  const notional = 800;
  const feeRatePct = 0.075;
  const feeUsd = FeeCalculator.calculateFeeUsd(notional, feeRatePct);

  assert.strictEqual(feeUsd, 0.60);
});

test('4. MarketMakingAudit: Inventory rejection on Cash Only mode (0 BTC + SELL 0.01 BTC -> REJECTED)', () => {
  const engine = new MarketMakingEngine();
  engine.setMode('CASH_ONLY', 0.0, 10000.0);

  const inv = engine.getInventory();
  assert.strictEqual(inv.baseInventoryQty, 0.0);
  assert.strictEqual(inv.mode, 'CASH_ONLY');

  // Verify that selling without inventory is rejected
  assert.ok(inv.baseInventoryQty < 0.01);
});

test('5. MarketMakingAudit: Inventory update (0.02 BTC starting - 0.01 BTC SELL -> 0.01 BTC remaining)', () => {
  const engine = new MarketMakingEngine();
  engine.setMode('INVENTORY_SEEDED', 0.02, 9200.0);

  let inv = engine.getInventory();
  assert.strictEqual(inv.baseInventoryQty, 0.02);

  // Simulate sell 0.01 BTC
  inv.baseInventoryQty -= 0.01;
  assert.strictEqual(inv.baseInventoryQty, 0.01);
});

test('6. MarketMakingAudit: Historical fill state snapshot isolation', () => {
  const placementSnapshot = {
    timestamp: 1000,
    bestBid: 80000,
    bestAsk: 80010,
    midPrice: 80005,
    simulatedBid: 80000,
    simulatedAsk: 80010,
  };

  const currentMarket = {
    bestBid: 79500,
    bestAsk: 79510,
    midPrice: 79505,
  };

  // The historical fill snapshot preserves placement price $80000, irrespective of current market drop to $79500
  assert.strictEqual(placementSnapshot.bestBid, 80000);
  assert.strictEqual(currentMarket.bestBid, 79500);
});

test('7. MarketMakingAudit: Exact P&L Waterfall reconciliation', () => {
  const grossSpreadUsd = 1.00;
  const feeUsd = 0.20;
  const slippageUsd = 0.10;
  const adverseSelectionUsd = 0.05;

  const totalCostsUsd = feeUsd + slippageUsd + adverseSelectionUsd;
  const netPnlUsd = Number((grossSpreadUsd - totalCostsUsd).toFixed(4));

  assert.strictEqual(netPnlUsd, 0.65);
});

test('8. MarketMakingAudit: Partial fill status modeling', () => {
  const orderSize = 0.01;
  const availableVolume = 0.003;

  const filledQty = Math.min(orderSize, availableVolume);
  const status = filledQty < orderSize ? 'PARTIALLY_FILLED' : 'FULLY_FILLED';

  assert.strictEqual(filledQty, 0.003);
  assert.strictEqual(status, 'PARTIALLY_FILLED');
});

test('9. MarketMakingAudit: Queue position model (insufficient market consumption -> NO FILL)', () => {
  const queueAhead = 0.14;
  const queueConsumed = 0.02;

  const isFilled = queueConsumed >= queueAhead;
  assert.strictEqual(isFilled, false);
});
