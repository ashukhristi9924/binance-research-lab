import assert from 'node:assert';
import { test } from 'node:test';
import { ArbitrageEngine } from '../src/engine/arbitrageEngine';
import { OrderBookCache } from '../src/engine/orderBookCache';
import { TriangularCycle } from '../src/lib/types';

const defaultCycle: TriangularCycle = {
  id: 'USDT->BTC->ETH->USDT',
  asset1: 'USDT',
  asset2: 'BTC',
  asset3: 'ETH',
  leg1: { symbol: 'BTCUSDT', action: 'BUY', baseAsset: 'BTC', quoteAsset: 'USDT' },
  leg2: { symbol: 'ETHBTC', action: 'BUY', baseAsset: 'ETH', quoteAsset: 'BTC' },
  leg3: { symbol: 'ETHUSDT', action: 'SELL', baseAsset: 'ETH', quoteAsset: 'USDT' },
};

const settings = {
  startingCapital: 10000,
  makerFeePct: 0.075,
  takerFeePct: 0.10,
  maxAllowedSlippagePct: 0.20,
  minLiquidityUsd: 100,
  simulatedLatencyMs: 75,
};

test('1. ArbitrageEngine: Profitable theoretical cycle calculation', () => {
  const cache = new OrderBookCache();
  const now = Date.now();

  // BTCUSDT Ask = 70,000, ETHBTC Ask = 0.031, ETHUSDT Bid = 2,250
  // 10,000 USDT -> 0.142857 BTC -> 4.60829 ETH -> 10,368.65 USDT (Theoretical profit +368.65 USD)
  cache.updateTicker({ symbol: 'BTCUSDT', bidPrice: 69990, bidQty: 10, askPrice: 70000, askQty: 10, updatedAt: now });
  cache.updateTicker({ symbol: 'ETHBTC', bidPrice: 0.0309, bidQty: 10, askPrice: 0.0310, askQty: 10, updatedAt: now });
  cache.updateTicker({ symbol: 'ETHUSDT', bidPrice: 2250, bidQty: 100, askPrice: 2251, askQty: 100, updatedAt: now });

  const opp = ArbitrageEngine.calculateOpportunity(defaultCycle, cache, settings);
  assert.ok(opp !== null);
  assert.strictEqual(opp.startingCapitalUsd, 10000);
  assert.ok(opp.theoreticalProfitUsd > 0);
  assert.ok(opp.costAdjustedProfitUsd > 0);
  assert.ok(opp.realisticProfitUsd > 0);
  assert.strictEqual(opp.isFullyExecutable, true);
});

test('2. ArbitrageEngine: Unprofitable cycle calculation', () => {
  const cache = new OrderBookCache();
  const now = Date.now();

  // BTCUSDT Ask = 70,000, ETHBTC Ask = 0.035, ETHUSDT Bid = 2,200
  // 10,000 / 70000 / 0.035 * 2200 = 8,979.59 USDT (Theoretical loss -1020.41 USD)
  cache.updateTicker({ symbol: 'BTCUSDT', bidPrice: 69990, bidQty: 10, askPrice: 70000, askQty: 10, updatedAt: now });
  cache.updateTicker({ symbol: 'ETHBTC', bidPrice: 0.0349, bidQty: 10, askPrice: 0.0350, askQty: 10, updatedAt: now });
  cache.updateTicker({ symbol: 'ETHUSDT', bidPrice: 2200, bidQty: 100, askPrice: 2201, askQty: 100, updatedAt: now });

  const opp = ArbitrageEngine.calculateOpportunity(defaultCycle, cache, settings);
  assert.ok(opp !== null);
  assert.ok(opp.theoreticalProfitUsd < 0);
  assert.ok(opp.realisticProfitUsd < 0);
});

test('3. ArbitrageEngine: Profitable before fees but unprofitable after fees', () => {
  const cache = new OrderBookCache();
  const now = Date.now();

  // Marginally profitable theoretical (+0.05%), but 0.10% fee per leg (0.30% total) turns it negative
  // 10,000 / 70000 / 0.0315 * 2210 = 10,022.67 USDT theoretical (+22.67), but fees ~30 USD
  cache.updateTicker({ symbol: 'BTCUSDT', bidPrice: 69990, bidQty: 10, askPrice: 70000, askQty: 10, updatedAt: now });
  cache.updateTicker({ symbol: 'ETHBTC', bidPrice: 0.0314, bidQty: 10, askPrice: 0.0315, askQty: 10, updatedAt: now });
  cache.updateTicker({ symbol: 'ETHUSDT', bidPrice: 2210, bidQty: 100, askPrice: 2211, askQty: 100, updatedAt: now });

  const opp = ArbitrageEngine.calculateOpportunity(defaultCycle, cache, settings);
  assert.ok(opp !== null);
  assert.ok(opp.theoreticalProfitUsd > 0);
  assert.ok(opp.realisticProfitUsd < 0);
  assert.strictEqual(opp.classification, 'PROFITABLE_BEFORE_FEES');
});

test('4. ArbitrageEngine: Insufficient liquidity detection and shortfall metrics', () => {
  const cache = new OrderBookCache();
  const now = Date.now();

  // Only 0.01 BTC available on BTCUSDT ask (requires 10,000 USDT / 70,000 = 0.142857 BTC)
  cache.updateDepth({
    symbol: 'BTCUSDT',
    bids: [{ price: 69990, qty: 10 }],
    asks: [{ price: 70000, qty: 0.01 }],
    lastUpdateId: now,
    updatedAt: now,
  });

  cache.updateTicker({ symbol: 'ETHBTC', bidPrice: 0.0309, bidQty: 10, askPrice: 0.0310, askQty: 10, updatedAt: now });
  cache.updateTicker({ symbol: 'ETHUSDT', bidPrice: 2250, bidQty: 100, askPrice: 2251, askQty: 100, updatedAt: now });

  const opp = ArbitrageEngine.calculateOpportunity(defaultCycle, cache, settings);
  assert.ok(opp !== null);
  assert.strictEqual(opp.isFullyExecutable, false);
  assert.strictEqual(opp.status, 'INSUFFICIENT_LIQUIDITY');
  assert.ok(opp.legs[0].shortfallQty > 0);
  assert.ok(opp.totalShortfallQty > 0);
});

test('5. ArbitrageEngine: Order book depth VWAP slippage calculation', () => {
  const cache = new OrderBookCache();
  const now = Date.now();

  // Multi-tier order book on BTCUSDT causing VWAP slippage
  cache.updateDepth({
    symbol: 'BTCUSDT',
    bids: [{ price: 69990, qty: 10 }],
    asks: [
      { price: 70000, qty: 0.05 },
      { price: 70500, qty: 0.05 },
      { price: 71000, qty: 0.10 },
    ],
    lastUpdateId: now,
    updatedAt: now,
  });

  cache.updateTicker({ symbol: 'ETHBTC', bidPrice: 0.0309, bidQty: 10, askPrice: 0.0310, askQty: 10, updatedAt: now });
  cache.updateTicker({ symbol: 'ETHUSDT', bidPrice: 2250, bidQty: 100, askPrice: 2251, askQty: 100, updatedAt: now });

  const opp = ArbitrageEngine.calculateOpportunity(defaultCycle, cache, settings);
  assert.ok(opp !== null);
  assert.ok(opp.legs[0].vwapPrice > opp.legs[0].topBookPrice);
  assert.ok(opp.totalSlippageUsd > 0);
});

test('6. ArbitrageEngine: Zero or missing market handling', () => {
  const cache = new OrderBookCache();
  const now = Date.now();

  // Missing ETHBTC ticker
  cache.updateTicker({ symbol: 'BTCUSDT', bidPrice: 70000, bidQty: 10, askPrice: 70000, askQty: 10, updatedAt: now });
  cache.updateTicker({ symbol: 'ETHUSDT', bidPrice: 2200, bidQty: 10, askPrice: 2200, askQty: 10, updatedAt: now });

  const opp = ArbitrageEngine.calculateOpportunity(defaultCycle, cache, settings);
  assert.strictEqual(opp, null);
});
