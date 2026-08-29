import assert from 'node:assert';
import { test } from 'node:test';
import { ScalperSignalEngine } from '../src/engine/scalperSignalEngine';
import { MicroScalperEngine } from '../src/engine/microScalperEngine';
import { OrderBookCache } from '../src/engine/orderBookCache';
import { TradeFlowTracker } from '../src/engine/tradeFlowTracker';
import { ScalperFeatureSet } from '../src/lib/types';

test('1. MicroScalperPipeline: Deterministic end-to-end paper execution pipeline test', () => {
  const signalEngine = new ScalperSignalEngine();
  const scalperEngine = new MicroScalperEngine();

  // Synthetic Features: High momentum, tight spread, strong buy flow
  const syntheticFeatures: ScalperFeatureSet = {
    symbol: 'SOLUSDT',
    timestamp: Date.now(),
    midPrice: 150.0,
    bidPrice: 149.99,
    askPrice: 150.01,
    spreadUsd: 0.02,
    spreadPct: 0.013,
    return100ms: 0.20,
    return500ms: 0.35,
    return1s: 0.50,
    return5s: 0.65,
    return10s: 0.80,
    return30s: 1.00,
    return60s: 1.20,
    volatilityRegime: 'MEDIUM',
    adaptiveThresholdPct: 0.04,
    imbalanceRatio: 0.60,
    tradeFlowRatio: 2.0,
  };

  // 1. SCANNER & QUALIFICATION
  const signal = signalEngine.evaluateSignal(syntheticFeatures, 1000);

  assert.strictEqual(signal.symbol, 'SOLUSDT');
  assert.ok(signal.scalperScore >= 70);
  assert.ok(signal.expectedNetProfitUsd > 0);
  assert.strictEqual(signal.isQualified, true);

  // Reconcile itemized economic costs equation
  const expectedNet = Number((signal.expectedGrossUsd - signal.totalCostsUsd).toFixed(4));
  assert.strictEqual(signal.expectedNetProfitUsd, expectedNet);

  // 2. PAPER ENTRY & POSITION OPEN
  const cache = new OrderBookCache();
  const tradeFlowTracker = new TradeFlowTracker();
  const now = Date.now();

  // Record aggressive buy trade flow (isBuyerMaker = false)
  tradeFlowTracker.processTrade('SOLUSDT', 150.80, 50, false, now - 500);
  tradeFlowTracker.processTrade('SOLUSDT', 150.82, 50, false, now);

  // Populate rolling price history for SOLUSDT
  cache.updateTicker({ symbol: 'SOLUSDT', bidPrice: 149.00, bidQty: 10, askPrice: 149.02, askQty: 10, updatedAt: now - 5000 });
  scalperEngine.evaluatePair('SOLUSDT', cache, tradeFlowTracker);

  cache.updateTicker({ symbol: 'SOLUSDT', bidPrice: 149.50, bidQty: 10, askPrice: 149.52, askQty: 10, updatedAt: now - 1000 });
  scalperEngine.evaluatePair('SOLUSDT', cache, tradeFlowTracker);

  cache.updateTicker({ symbol: 'SOLUSDT', bidPrice: 150.80, bidQty: 10, askPrice: 150.82, askQty: 10, updatedAt: now });
  scalperEngine.evaluatePair('SOLUSDT', cache, tradeFlowTracker);

  // 3. PAPER EXIT & TRADE HISTORY RECONCILIATION
  // Simulate 11 seconds passing (exceeds max holding time 10s & take profit)
  const futureTime = now + 11000;
  cache.updateTicker({ symbol: 'SOLUSDT', bidPrice: 151.50, bidQty: 10, askPrice: 151.52, askQty: 10, updatedAt: futureTime });

  scalperEngine.evaluatePair('SOLUSDT', cache, tradeFlowTracker);

  const recentTrades = scalperEngine.getRecentTrades();
  assert.ok(recentTrades.length >= 1);
  assert.strictEqual(recentTrades[0].symbol, 'SOLUSDT');
  assert.ok(recentTrades[0].netPnlUsd > 0);
});
