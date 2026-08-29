import assert from 'node:assert';
import { test } from 'node:test';
import { FeeCalculator } from '../src/engine/feeCalculator';

test('FeeCalculator: calculate 0.1% spot fee on 1000 USDT', () => {
  const result = FeeCalculator.calculateLegFee(1000, 0.10, 1.0);
  assert.strictEqual(result.netAmount, 999);
  assert.strictEqual(result.feeUsd, 1.0);
});

test('FeeCalculator: calculate fee on 0 amount', () => {
  const result = FeeCalculator.calculateLegFee(0, 0.10, 1.0);
  assert.strictEqual(result.netAmount, 0);
  assert.strictEqual(result.feeUsd, 0);
});

test('FeeCalculator: calculate combined fees across 3 legs', () => {
  const total = FeeCalculator.calculateTotalFees(0.50, 0.35, 0.40);
  assert.strictEqual(total, 1.25);
});
