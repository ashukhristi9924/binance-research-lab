import assert from 'node:assert';
import { test } from 'node:test';
import { MarketGraph } from '../src/engine/marketGraph';

test('MarketGraph: Discovers 3-pair triangular cycles dynamically', () => {
  const graph = new MarketGraph();
  graph.loadFallbackSymbols();
  const cycles = graph.discoverTriangularCycles('USDT');

  assert.ok(cycles.length > 0);
  const usdtBtcEth = cycles.find((c) => c.id === 'USDT->BTC->ETH->USDT');
  assert.ok(usdtBtcEth);
  assert.strictEqual(usdtBtcEth.leg1.symbol, 'BTCUSDT');
  assert.strictEqual(usdtBtcEth.leg1.action, 'BUY');
});
