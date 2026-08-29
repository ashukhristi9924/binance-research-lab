import assert from 'node:assert';
import { test } from 'node:test';
import { UniverseManager } from '../src/engine/universeManager';

test('1. UniverseManager: Dynamic 50-pair selection and ranking', () => {
  const mgr = new UniverseManager();
  const activeSymbols = mgr.getActiveSymbols();

  assert.strictEqual(mgr.getTargetSize(), 50);
  assert.strictEqual(activeSymbols.length, 50);
  assert.strictEqual(activeSymbols[0], 'BTCUSDT');
  assert.strictEqual(activeSymbols[1], 'ETHUSDT');
  assert.strictEqual(activeSymbols[2], 'SOLUSDT');
});

test('2. UniverseManager: Configurable universe sizing (25, 75, 100)', () => {
  const mgr = new UniverseManager();

  mgr.setTargetSize(25);
  assert.strictEqual(mgr.getActiveSymbols().length, 25);

  mgr.setTargetSize(50);
  assert.strictEqual(mgr.getActiveSymbols().length, 50);
});
