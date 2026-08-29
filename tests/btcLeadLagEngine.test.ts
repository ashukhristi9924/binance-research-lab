import assert from 'node:assert';
import { test } from 'node:test';
import { BtcShockEngine } from '../src/engine/btcShockEngine';
import { RollingBetaCalculator } from '../src/engine/rollingBetaCalculator';
import { BtcLeadLagSignalEngine } from '../src/engine/btcLeadLagSignalEngine';
import { BtcLeadLagEngine } from '../src/engine/btcLeadLagEngine';
import { OrderBookCache } from '../src/engine/orderBookCache';
import { TradeFlowTracker } from '../src/engine/tradeFlowTracker';
import { BtcShockFeatureSet } from '../src/lib/types';

test('1. BtcShockEngine: Multi-window return & adaptive shock score calculation', () => {
  const shockEngine = new BtcShockEngine();
  const now = Date.now();

  // Push historical BTC price ticks
  shockEngine.processTicker({ symbol: 'BTCUSDT', bidPrice: 79000, bidQty: 10, askPrice: 79002, askQty: 10, updatedAt: now - 5000 });
  shockEngine.processTicker({ symbol: 'BTCUSDT', bidPrice: 79200, bidQty: 10, askPrice: 79202, askQty: 10, updatedAt: now - 1000 });
  const feature = shockEngine.processTicker({ symbol: 'BTCUSDT', bidPrice: 79600, bidQty: 10, askPrice: 79602, askQty: 10, updatedAt: now });

  assert.ok(feature !== null);
  assert.strictEqual(feature!.symbol, 'BTCUSDT');
  assert.ok(feature!.return1s > 0.4);
  assert.ok(feature!.btcShockScore >= 50);
  assert.ok(feature!.marketRegime !== null);
});

test('2. RollingBetaCalculator: Covariance/Variance beta calculation accuracy', () => {
  const betaCalc = new RollingBetaCalculator();
  const now = Date.now();

  // Populate aligned BTC and ETH price movements (ETH moves 1.2x BTC)
  for (let i = 10; i >= 0; i--) {
    const t = now - i * 1000;
    const btcP = 70000 + (10 - i) * 100;
    const ethP = 2500 + (10 - i) * 4.2;
    betaCalc.updateBtcPrice(btcP, t);
    betaCalc.updateFollowerPrice('ETHUSDT', ethP, t);
  }

  const beta = betaCalc.calculateBeta('ETHUSDT', 300000);
  assert.ok(beta >= 0.8 && beta <= 2.5);

  const metrics = betaCalc.getBetaMetrics('ETHUSDT');
  assert.strictEqual(metrics.symbol, 'ETHUSDT');
  assert.ok(metrics.beta5m > 0);
});

test('3. BtcLeadLagSignalEngine: Model A (Momentum) signal qualification & cost reconciler', () => {
  const signalEngine = new BtcLeadLagSignalEngine(0.15, 1000);

  const syntheticBtcShock: BtcShockFeatureSet = {
    symbol: 'BTCUSDT',
    timestamp: Date.now(),
    price: 79500,
    return50ms: 0.10,
    return100ms: 0.15,
    return250ms: 0.20,
    return500ms: 0.25,
    return1s: 0.35, // BTC UP +0.35%
    return2s: 0.40,
    return3s: 0.45,
    return5s: 0.50,
    return10s: 0.60,
    return30s: 0.80,
    return60s: 1.00,
    volatility: 0.05,
    btcShockScore: 85,
    marketRegime: 'BTC_SHOCK',
    tradeVelocity: 150,
    bookImbalance: 0.60,
  };

  // ETH under-reacts (+0.08% actual vs +0.42% expected with Beta 1.2)
  const signal = signalEngine.evaluateSignal(
    'ETHUSDT',
    syntheticBtcShock,
    0.08,
    1.2,
    0.25,
    2500.0,
    2500.25,
    0.60,
    1.5,
    1000
  );

  assert.strictEqual(signal.symbol, 'ETHUSDT');
  assert.strictEqual(signal.direction, 'LONG');
  assert.strictEqual(signal.modelType, 'LEAD_LAG_MOMENTUM');
  assert.strictEqual(signal.executionMode, 'SPOT_LONG');
  assert.ok(signal.isQualified);
  assert.ok(signal.expectedNetProfitUsd >= 0.15);

  // Reconcile itemized economic costs equation
  const expectedNet = Number((signal.expectedGrossUsd - signal.totalCostsUsd).toFixed(4));
  assert.strictEqual(signal.expectedNetProfitUsd, expectedNet);
});

test('4. BtcLeadLagSignalEngine: Model B (Mean-Reversion) SHORT signal qualification', () => {
  const signalEngine = new BtcLeadLagSignalEngine(0.15, 1000);

  const syntheticBtcShock: BtcShockFeatureSet = {
    symbol: 'BTCUSDT',
    timestamp: Date.now(),
    price: 79500,
    return50ms: -0.10,
    return100ms: -0.15,
    return250ms: -0.20,
    return500ms: -0.25,
    return1s: -0.35, // BTC DOWN -0.35%
    return2s: -0.40,
    return3s: -0.45,
    return5s: -0.50,
    return10s: -0.60,
    return30s: -0.80,
    return60s: -1.00,
    volatility: 0.05,
    btcShockScore: 85,
    marketRegime: 'BTC_SHOCK',
    tradeVelocity: 150,
    bookImbalance: 0.40,
  };

  // SOL over-reacts to downside (-0.75% actual vs -0.42% expected) -> Model B Mean-Reversion LONG candidate
  const signal = signalEngine.evaluateSignal(
    'SOLUSDT',
    syntheticBtcShock,
    -0.75,
    1.2,
    0.02,
    150.0,
    150.02,
    0.60,
    1.5,
    1000
  );

  assert.strictEqual(signal.symbol, 'SOLUSDT');
  assert.strictEqual(signal.direction, 'LONG');
  assert.strictEqual(signal.modelType, 'RELATIVE_VALUE_MEAN_REVERSION');
  assert.ok(signal.isQualified);
});

test('5. BtcLeadLagEngine: End-to-end paper trade execution & position exit reconciliation', () => {
  const engine = new BtcLeadLagEngine();
  const cache = new OrderBookCache();
  const tradeFlowTracker = new TradeFlowTracker();
  const now = Date.now();

  // Populate rolling price history for BTC and SOLUSDT
  cache.updateTicker({ symbol: 'BTCUSDT', bidPrice: 79000, bidQty: 10, askPrice: 79002, askQty: 10, updatedAt: now - 5000 });
  engine.processTicker(cache.getTicker('BTCUSDT')!, cache, tradeFlowTracker);

  cache.updateTicker({ symbol: 'SOLUSDT', bidPrice: 149.0, bidQty: 10, askPrice: 149.02, askQty: 10, updatedAt: now - 5000 });
  engine.processTicker(cache.getTicker('SOLUSDT')!, cache, tradeFlowTracker);

  cache.updateTicker({ symbol: 'BTCUSDT', bidPrice: 79600, bidQty: 10, askPrice: 79602, askQty: 10, updatedAt: now });
  engine.processTicker(cache.getTicker('BTCUSDT')!, cache, tradeFlowTracker);

  cache.updateTicker({ symbol: 'SOLUSDT', bidPrice: 149.1, bidQty: 10, askPrice: 149.12, askQty: 10, updatedAt: now });
  engine.processTicker(cache.getTicker('SOLUSDT')!, cache, tradeFlowTracker);

  const openPositions = engine.getOpenPositions();
  assert.ok(openPositions.length >= 1);
  assert.strictEqual(openPositions[0].symbol, 'SOLUSDT');

  // Simulate 11s passing for paper trade exit
  const futureTime = now + 11000;
  cache.updateTicker({ symbol: 'SOLUSDT', bidPrice: 150.5, bidQty: 10, askPrice: 150.52, askQty: 10, updatedAt: futureTime });
  engine.processTicker(cache.getTicker('SOLUSDT')!, cache, tradeFlowTracker);

  const trades = engine.getRecentTrades();
  assert.ok(trades.length >= 1);
  assert.strictEqual(trades[0].symbol, 'SOLUSDT');
  assert.ok(trades[0].netPnlUsd > 0);
});
