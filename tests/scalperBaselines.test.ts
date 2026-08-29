import assert from 'node:assert';
import { test } from 'node:test';
import { ScalperBaselinesEngine } from '../src/engine/scalperBaselines';

test('1. ScalperBaselinesEngine: Fixed Micro Grid baseline execution', () => {
  const engine = new ScalperBaselinesEngine();
  const res = engine.evaluateFixedGrid('BTCUSDT', 70000, -0.025);

  assert.ok(res !== null);
  assert.strictEqual(res.baselineType, 'FIXED_GRID');
  assert.strictEqual(res.symbol, 'BTCUSDT');
  assert.ok(res.feeUsd > 0);
});

test('2. ScalperBaselinesEngine: Random Entry baseline execution', () => {
  const engine = new ScalperBaselinesEngine();
  let executed = null;

  for (let i = 0; i < 200; i++) {
    const res = engine.evaluateRandomBaseline('ETHUSDT', 2500);
    if (res) {
      executed = res;
      break;
    }
  }

  assert.ok(executed !== null);
  assert.strictEqual(executed.baselineType, 'RANDOM_ENTRY');
});
