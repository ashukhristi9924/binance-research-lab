import { useEffect, useState, useRef } from 'react';
import { ArbitrageOpportunityCalc, PaperTradeRecord, PriceBookTicker } from '../lib/types';

export function useDashboardSocket() {
  const [status, setStatus] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunityCalc[]>([]);
  const [paperTrades, setPaperTrades] = useState<PaperTradeRecord[]>([]);
  const [tickers, setTickers] = useState<PriceBookTicker[]>([]);
  const [account, setAccount] = useState<any>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initial REST fetch for instant rendering
    const fetchInitialData = async () => {
      try {
        const [oppRes, tradeRes, statusRes, accountRes] = await Promise.all([
          fetch('/api/opportunities?limit=50'),
          fetch('/api/trades?limit=50'),
          fetch('/api/market-data/status'),
          fetch('/api/btc-lead-lag/status'),
        ]);

        if (oppRes.ok) {
          const json = await oppRes.json();
          setOpportunities(Array.isArray(json) ? json : []);
        }
        if (tradeRes.ok) {
          const json = await tradeRes.json();
          setPaperTrades(Array.isArray(json) ? json : []);
        }
        if (statusRes.ok) {
          const s = await statusRes.json();
          setStatus(s);
          if (s && s.symbolUpdates) {
            const list: PriceBookTicker[] = Object.entries(s.symbolUpdates).map(([symbol, val]: [string, any]) => ({
              symbol,
              bidPrice: val.bid,
              bidQty: 10,
              askPrice: val.ask,
              askQty: 10,
              updatedAt: Date.now(),
            }));
            setTickers(list);
          }
        }
        if (accountRes.ok) {
          const data = await accountRes.json();
          setAccount(data.account || data);
        }
      } catch (err) {
        console.error('[WS_HOOK] Initial REST fetch error:', err);
      }
    };

    fetchInitialData();

    // Fallback REST polling every 2 seconds if WebSocket is not yet connected
    const fallbackInterval = setInterval(() => {
      fetchInitialData();
    }, 2000);

    // Dynamic browser WebSocket connection (HTTPS -> wss://, HTTP -> ws://)
    function connectWebSocket() {
      if (typeof window === 'undefined') return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      try {
        console.log(`[WS_HOOK] Connecting to browser WebSocket broadcaster: ${wsUrl}`);
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          console.log(`[WS_HOOK] Connected to browser WebSocket broadcaster: ${wsUrl}`);
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (!msg || !msg.type) return;

            switch (msg.type) {
              case 'STATUS':
                if (msg.data) {
                  setStatus(msg.data);
                  if (msg.data.symbolUpdates) {
                    const list: PriceBookTicker[] = Object.entries(msg.data.symbolUpdates).map(
                      ([symbol, val]: [string, any]) => ({
                        symbol,
                        bidPrice: val.bid,
                        bidQty: 10,
                        askPrice: val.ask,
                        askQty: 10,
                        updatedAt: Date.now(),
                      })
                    );
                    setTickers(list);
                  }
                }
                break;

              case 'TICK':
                if (msg.data) {
                  const tick: PriceBookTicker = msg.data;
                  setTickers((prev) => {
                    const idx = prev.findIndex((t) => t.symbol === tick.symbol);
                    if (idx >= 0) {
                      const updated = [...prev];
                      updated[idx] = tick;
                      return updated;
                    }
                    return [tick, ...prev];
                  });
                }
                break;

              case 'OPPORTUNITY':
                if (msg.data) {
                  setOpportunities((prev) => [msg.data, ...prev.slice(0, 49)]);
                }
                break;

              case 'PAPER_TRADE':
                if (msg.data) {
                  setPaperTrades((prev) => [msg.data, ...prev.slice(0, 49)]);
                }
                break;
            }
          } catch (err) {
            console.error('[WS_HOOK] Parse error:', err);
          }
        };

        ws.onerror = (err) => {
          console.warn('[WS_HOOK] Browser WebSocket error:', err);
        };

        ws.onclose = () => {
          console.warn('[WS_HOOK] Browser WebSocket closed. Reconnecting in 3s...');
          setWsConnected(false);
          reconnectTimerRef.current = setTimeout(connectWebSocket, 3000);
        };
      } catch (err) {
        console.error('[WS_HOOK] Failed to initialize WebSocket:', err);
        reconnectTimerRef.current = setTimeout(connectWebSocket, 3000);
      }
    }

    connectWebSocket();

    return () => {
      clearInterval(fallbackInterval);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return {
    status,
    opportunities,
    paperTrades,
    tickers,
    account,
    wsConnected,
    refreshData: () => {
      fetch('/api/market-data/status')
        .then((r) => r.json())
        .then((s) => setStatus(s));
    },
  };
}
