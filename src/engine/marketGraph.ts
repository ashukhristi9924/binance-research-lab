import { ExchangeSymbolInfo, SymbolSide, TriangularCycle } from '../lib/types';
import { logger } from './logger';

export class MarketGraph {
  private symbols = new Map<string, ExchangeSymbolInfo>();
  private assetNeighbors = new Map<string, Set<string>>(); // asset -> Set(connected assets)
  private symbolLookup = new Map<string, { symbol: string; base: string; quote: string }>(); // "BASE_QUOTE" or "QUOTE_BASE" -> symbol

  /**
   * Initializes market graph by fetching exchange info from Binance REST public endpoint.
   */
  public async loadExchangeInfo(): Promise<number> {
    try {
      const res = await fetch('https://api.binance.com/api/v3/exchangeInfo');
      if (!res.ok) {
        throw new Error(`Failed to fetch Binance exchangeInfo: ${res.statusText}`);
      }
      const data = await res.json();
      this.parseSymbols(data.symbols);
      await logger.log('INFO', 'WS', `Market graph loaded ${this.symbols.size} pairs and discovered cycles.`);
      return this.symbols.size;
    } catch (err: any) {
      await logger.log('WARN', 'WS', `Failed fetching live exchangeInfo: ${err.message}. Using default top crypto graph.`);
      this.loadFallbackSymbols();
      return this.symbols.size;
    }
  }

  public parseSymbols(symbolsList: any[]) {
    this.symbols.clear();
    this.assetNeighbors.clear();
    this.symbolLookup.clear();

    const allowedQuoteAssets = new Set(['USDT', 'BTC', 'ETH', 'BNB', 'FDUSD', 'BUSD']);

    for (const item of symbolsList) {
      if (item.status === 'TRADING' && item.isSpotTradingAllowed) {
        const symbol = item.symbol;
        const base = item.baseAsset;
        const quote = item.quoteAsset;

        if (allowedQuoteAssets.has(quote) || allowedQuoteAssets.has(base)) {
          const info: ExchangeSymbolInfo = {
            symbol,
            baseAsset: base,
            quoteAsset: quote,
            status: item.status,
            isSpotTradingAllowed: item.isSpotTradingAllowed,
          };
          this.symbols.set(symbol, info);

          if (!this.assetNeighbors.has(base)) this.assetNeighbors.set(base, new Set());
          if (!this.assetNeighbors.has(quote)) this.assetNeighbors.set(quote, new Set());
          this.assetNeighbors.get(base)!.add(quote);
          this.assetNeighbors.get(quote)!.add(base);

          this.symbolLookup.set(`${base}_${quote}`, { symbol, base, quote });
        }
      }
    }
  }

  public loadFallbackSymbols() {
    const defaultPairs = [
      { symbol: 'BTCUSDT', base: 'BTC', quote: 'USDT' },
      { symbol: 'ETHUSDT', base: 'ETH', quote: 'USDT' },
      { symbol: 'ETHBTC', base: 'ETH', quote: 'BTC' },
      { symbol: 'BNBUSDT', base: 'BNB', quote: 'USDT' },
      { symbol: 'BNBBTC', base: 'BNB', quote: 'BTC' },
      { symbol: 'SOLUSDT', base: 'SOL', quote: 'USDT' },
      { symbol: 'SOLBTC', base: 'SOL', quote: 'BTC' },
      { symbol: 'SOLETH', base: 'SOL', quote: 'ETH' },
      { symbol: 'XRPUSDT', base: 'XRP', quote: 'USDT' },
      { symbol: 'XRPBTC', base: 'XRP', quote: 'BTC' },
      { symbol: 'ADAUSDT', base: 'ADA', quote: 'USDT' },
      { symbol: 'ADABTC', base: 'ADA', quote: 'BTC' },
      { symbol: 'DOGEUSDT', base: 'DOGE', quote: 'USDT' },
      { symbol: 'DOGEBTC', base: 'DOGE', quote: 'BTC' },
    ];

    const mockList = defaultPairs.map((p) => ({
      symbol: p.symbol,
      baseAsset: p.base,
      quoteAsset: p.quote,
      status: 'TRADING',
      isSpotTradingAllowed: true,
    }));
    this.parseSymbols(mockList);
  }

  /**
   * Finds a trading pair connecting asset A and asset B, returning symbol and direction.
   */
  public getPairAction(fromAsset: string, toAsset: string): { symbol: string; action: SymbolSide; base: string; quote: string } | null {
    // Check if symbol exists where base=toAsset, quote=fromAsset (e.g. from USDT to BTC -> BUY BTCUSDT)
    const directBuy = this.symbolLookup.get(`${toAsset}_${fromAsset}`);
    if (directBuy) {
      return { symbol: directBuy.symbol, action: 'BUY', base: directBuy.base, quote: directBuy.quote };
    }

    // Check if symbol exists where base=fromAsset, quote=toAsset (e.g. from BTC to USDT -> SELL BTCUSDT)
    const directSell = this.symbolLookup.get(`${fromAsset}_${toAsset}`);
    if (directSell) {
      return { symbol: directSell.symbol, action: 'SELL', base: directSell.base, quote: directSell.quote };
    }

    return null;
  }

  /**
   * Discovers all valid 3-pair triangular cycles starting and ending at a start asset (e.g., USDT).
   */
  public discoverTriangularCycles(startAsset: string = 'USDT'): TriangularCycle[] {
    const cycles: TriangularCycle[] = [];
    const neighbors1 = this.assetNeighbors.get(startAsset);
    if (!neighbors1) return cycles;

    for (const asset2 of neighbors1) {
      const neighbors2 = this.assetNeighbors.get(asset2);
      if (!neighbors2) continue;

      for (const asset3 of neighbors2) {
        if (asset3 === startAsset || asset3 === asset2) continue;

        // Check if leg 3 exists back to startAsset
        const neighbors3 = this.assetNeighbors.get(asset3);
        if (!neighbors3 || !neighbors3.has(startAsset)) continue;

        const leg1 = this.getPairAction(startAsset, asset2);
        const leg2 = this.getPairAction(asset2, asset3);
        const leg3 = this.getPairAction(asset3, startAsset);

        if (leg1 && leg2 && leg3) {
          const id = `${startAsset}->${asset2}->${asset3}->${startAsset}`;
          // Avoid duplicate cycles
          if (!cycles.some((c) => c.id === id)) {
            cycles.push({
              id,
              asset1: startAsset,
              asset2,
              asset3,
              leg1: { symbol: leg1.symbol, action: leg1.action, baseAsset: leg1.base, quoteAsset: leg1.quote },
              leg2: { symbol: leg2.symbol, action: leg2.action, baseAsset: leg2.base, quoteAsset: leg2.quote },
              leg3: { symbol: leg3.symbol, action: leg3.action, baseAsset: leg3.base, quoteAsset: leg3.quote },
            });
          }
        }
      }
    }

    return cycles;
  }

  public getSymbolsMap(): Map<string, ExchangeSymbolInfo> {
    return this.symbols;
  }

  public getAllSymbols(): string[] {
    return Array.from(this.symbols.keys());
  }
}
