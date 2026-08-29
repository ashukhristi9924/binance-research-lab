import assert from 'node:assert';
import { test } from 'node:test';
import { ScalperSignalEngine } from '../src/engine/scalperSignalEngine';
import { ScalperFeatureSet } from '../src/lib/types';

test('1. ScalperSignalEngine: Cost-aware net profit filter & Micro-Scalp Score', () => {
  const engine = new ScalperSignalEngine();

  const qualifiedFeatures: ScalperFeatureSet = {
    symbol: 'SOLUSDT',
    timestamp: Date.now(),
    midPrice: 150.0,
    bidPrice: 149.99,
    askPrice: 150.01,
    spreadUsd: 0.02,
    spreadPct: 0.013,
    return100ms: 0.15,
    return500ms: 0.25,
    return1s: 0.35,
    return5s: 0.45,
    return10s: 0.50,
    return30s: 0.60,
    return60s: 0.80,
    volatilityRegime: 'MEDIUM',
    adaptiveThresholdPct: 0.04,
    imbalanceRatio: 0.45,
    tradeFlowRatio: 1.60,
  };

  const signal = engine.evaluateSignal(qualifiedFeatures, 1000);

  assert.strictEqual(signal.symbol, 'SOLUSDT');
  assert.ok(signal.scalperScore >= 70);
  assert.ok(signal.expectedNetProfitUsd > 0);
  assert.strictEqual(signal.isQualified, true);
});

test('2. ScalperSignalEngine: Rejection when expected net profit is too low', () => {
  const engine = new ScalperSignalEngine();

  const weakFeatures: ScalperFeatureSet = {
    symbol: 'DOGEUSDT',
    timestamp: Date.now(),
    midPrice: 0.12,
    bidPrice: 0.1199,
    askPrice: 0.1201,
    spreadUsd: 0.0002,
    spreadPct: 0.16,
    return100ms: 0.001,
    return500ms: 0.002,
    return1s: 0.003,
    return5s: 0.004,
    return10s: 0.005,
    return30s: 0.006,
    return60s: 0.007,
    volatilityRegime: 'HIGH',
    adaptiveThresholdPct: 0.06,
    imbalanceRatio: 0.05,
    tradeFlowRatio: 1.05,
  };

  const signal = engine.evaluateSignal(weakFeatures, 1000);

  assert.strictEqual(signal.isQualified, false);
  assert.ok(signal.rejectionReason === 'SPREAD_TOO_HIGH' || signal.rejectionReason === 'EXPECTED_NET_PROFIT_TOO_LOW');
});
