import WebSocket from 'ws';
import { PriceBookTicker } from '../lib/types';
import { logger } from './logger';
import { OrderBookCache } from './orderBookCache';

export interface MarketDataStatusReport {
  connected: boolean;
  binanceWsConnected?: boolean;
  mode: 'live' | 'demo';
  source: string;
  symbols: number;
  lastUpdate: string | null;
  dataAgeMs: number;
  marketDataAgeMs?: number;
  statusText: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'RECONNECTING' | 'DELAYED' | 'STALE';
  error: string | null;
  reconnectAttempts: number;
  messagesReceived: number;
  tickerUpdates: number;
  lastCloseCode: number | null;
  lastCloseReason: string | null;
  streamUrl: string;
  symbolUpdates: Record<string, { lastTime: string; ageMs: number; bid: number; ask: number }>;
  marketDataReady: boolean;
}

export class BinanceWsClient {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private isReconnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastMessageTimestamp: number = 0;
  private messagesReceivedCount: number = 0;
  private parsedTickerUpdatesCount: number = 0;
  private lastError: string | null = null;
  private lastCloseCode: number | null = null;
  private lastCloseReason: string | null = null;

  // Primary focus streams
  private defaultSymbols = ['BTCUSDT', 'ETHUSDT', 'ETHBTC'];
  private activeSymbols: string[] = ['BTCUSDT', 'ETHUSDT', 'ETHBTC'];
  private lastSymbolUpdates = new Map<string, { timestamp: number; bid: number; ask: number }>();

  constructor(
    private cache: OrderBookCache,
    private onTick: (symbol: string) => void,
    private onStatusChange: (statusText: string) => void
  ) {}

  public setSymbols(symbols: string[]) {
    if (symbols.length > 0) {
      this.activeSymbols = Array.from(new Set([...this.defaultSymbols, ...symbols]));
    }
  }

  private getStreamUrl(): string {
    const streamNames = this.activeSymbols.map((s) => `${s.toLowerCase()}@bookTicker`).join('/');
    return `wss://stream.binance.com/stream?streams=${streamNames}`;
  }

  public connect() {
    if (this.isConnected || this.isConnecting) return;

    this.isConnecting = true;
    this.lastError = null;
    const url = this.getStreamUrl();

    logger.log('INFO', 'WS', `BINANCE WS CONNECTING: ${url}`);
    this.onStatusChange(this.reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING');

    try {
      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        this.isConnected = true;
        this.isConnecting = false;
        this.isReconnecting = false;
        this.reconnectAttempts = 0;
        this.onStatusChange('CONNECTED');

        logger.log('INFO', 'WS', `BINANCE WS CONNECTED: ${url}`);
        logger.log('INFO', 'WS', `BINANCE WS SUBSCRIBED: ${this.activeSymbols.length} streams`);

        this.startHeartbeat();
      });

      this.ws.on('message', (raw: WebSocket.RawData) => {
        const now = Date.now();
        this.lastMessageTimestamp = now;
        this.messagesReceivedCount++;

        try {
          const parsed = JSON.parse(raw.toString());
          let payload = parsed;
          if (parsed && parsed.data) {
            payload = parsed.data;
          }

          // bookTicker format: { s: symbol, b: bidPrice, B: bidQty, a: askPrice, A: askQty, u: updateId }
          if (payload && payload.s && payload.b && payload.a) {
            const bid = parseFloat(payload.b);
            const bidQty = parseFloat(payload.B || '0');
            const ask = parseFloat(payload.a);
            const askQty = parseFloat(payload.A || '0');

            // Sanity check valid data
            if (bid > 0 && ask > 0 && bid <= ask && bidQty > 0 && askQty > 0) {
              this.parsedTickerUpdatesCount++;
              const ticker: PriceBookTicker = {
                symbol: payload.s,
                bidPrice: bid,
                bidQty,
                askPrice: ask,
                askQty,
                updatedAt: now,
              };

              this.lastSymbolUpdates.set(payload.s, { timestamp: now, bid, ask });
              this.cache.updateTicker(ticker);
              this.onTick(ticker.symbol);
            }
          }
        } catch (err: any) {
          logger.log('WARN', 'WS', `BINANCE WS PARSE ERROR: ${err.message}`);
        }
      });

      this.ws.on('error', (err: any) => {
        const errorMsg = err.message || err.toString() || 'Unknown WebSocket Error';
        this.lastError = errorMsg;
        logger.log('ERROR', 'WS', `BINANCE WS ERROR: ${errorMsg}`);
      });

      this.ws.on('close', (code: number, reason: Buffer) => {
        const reasonStr = reason.toString() || `Close code ${code}`;
        this.lastCloseCode = code;
        this.lastCloseReason = reasonStr;
        this.isConnected = false;
        this.isConnecting = false;
        this.stopHeartbeat();
        this.onStatusChange('DISCONNECTED');

        logger.log('WARN', 'WS', `BINANCE WS DISCONNECTED (Code ${code}): ${reasonStr}`);
        this.scheduleReconnect();
      });
    } catch (e: any) {
      this.isConnected = false;
      this.isConnecting = false;
      this.lastError = e.message;
      logger.log('ERROR', 'WS', `BINANCE WS CONNECTION FAILURE: ${e.message}`);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectAttempts++;
    this.isReconnecting = true;
    this.onStatusChange('RECONNECTING');

    // Exponential backoff capped at 30 seconds
    const delay = Math.min(1000 * Math.pow(2, Math.min(this.reconnectAttempts, 5)), 30000);
    logger.log('INFO', 'WS', `BINANCE WS RECONNECTING: Attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.terminate();
      this.ws = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.isReconnecting = false;
    this.onStatusChange('DISCONNECTED');
  }

  public isMarketDataReady(): boolean {
    const btc = this.lastSymbolUpdates.get('BTCUSDT');
    const eth = this.lastSymbolUpdates.get('ETHUSDT');
    const ethbtc = this.lastSymbolUpdates.get('ETHBTC');

    if (!btc || !eth || !ethbtc) return false;
    const now = Date.now();
    return (
      now - btc.timestamp < 10000 &&
      now - eth.timestamp < 10000 &&
      now - ethbtc.timestamp < 10000
    );
  }

  public getStatusReport(isDemoMode: boolean): MarketDataStatusReport {
    const now = Date.now();
    const hasReceivedMessages = this.lastMessageTimestamp > 0;
    const dataAgeMs = hasReceivedMessages ? now - this.lastMessageTimestamp : 999999;

    let statusText: MarketDataStatusReport['statusText'] = 'DISCONNECTED';
    let isDataLive = false;

    if (isDemoMode) {
      statusText = 'CONNECTED';
      isDataLive = true;
    } else if (this.isConnecting) {
      statusText = 'CONNECTING';
    } else if (this.isReconnecting) {
      statusText = 'RECONNECTING';
    } else if (this.isConnected) {
      if (hasReceivedMessages && dataAgeMs < 5000) {
        statusText = 'CONNECTED';
        isDataLive = true;
      } else if (hasReceivedMessages && dataAgeMs < 15000) {
        statusText = 'DELAYED';
      } else {
        statusText = 'STALE';
      }
    }

    const symbolUpdatesRecord: Record<string, any> = {};
    for (const [sym, data] of this.lastSymbolUpdates.entries()) {
      symbolUpdatesRecord[sym] = {
        lastTime: new Date(data.timestamp).toLocaleTimeString(),
        ageMs: now - data.timestamp,
        bid: data.bid,
        ask: data.ask,
      };
    }

    return {
      connected: isDataLive || isDemoMode,
      binanceWsConnected: this.isConnected || isDemoMode,
      mode: isDemoMode ? 'demo' : 'live',
      source: isDemoMode ? 'simulated-demo-generator' : 'binance-public-websocket',
      symbols: this.activeSymbols.length,
      lastUpdate: hasReceivedMessages ? new Date(this.lastMessageTimestamp).toISOString() : null,
      dataAgeMs: hasReceivedMessages ? dataAgeMs : 999999,
      marketDataAgeMs: hasReceivedMessages ? dataAgeMs : 999999,
      statusText,
      error: this.lastError,
      reconnectAttempts: this.reconnectAttempts,
      messagesReceived: this.messagesReceivedCount,
      tickerUpdates: this.parsedTickerUpdatesCount,
      lastCloseCode: this.lastCloseCode,
      lastCloseReason: this.lastCloseReason,
      streamUrl: this.getStreamUrl(),
      symbolUpdates: symbolUpdatesRecord,
      marketDataReady: this.isMarketDataReady() || isDemoMode,
    };
  }
}
