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
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionCounterRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  // State refs to prevent stale closure state overwrites
  const wsConnectedRef = useRef<boolean>(false);
  wsConnectedRef.current = wsConnected;

  useEffect(() => {
    isMountedRef.current = true;

    // Initial REST fetch for instant rendering
    const fetchInitialData = async () => {
      if (!isMountedRef.current) return;
      try {
        const [oppRes, tradeRes, statusRes, accountRes] = await Promise.all([
          fetch('/api/opportunities?limit=50'),
          fetch('/api/trades?limit=50'),
          fetch('/api/market-data/status'),
          fetch('/api/btc-lead-lag/status'),
        ]);

        if (!isMountedRef.current) return;

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
          // Only update status if WS is NOT actively connected to prevent overwriting live WS state
          if (!wsConnectedRef.current) {
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
        }
        if (accountRes.ok) {
          const data = await accountRes.json();
          setAccount(data.account || data);
        }
      } catch (err) {
        console.error('[WS_HOOK] REST fetch error:', err);
      }
    };

    fetchInitialData();

    // Fallback REST polling ONLY when WebSocket is NOT connected
    const fallbackInterval = setInterval(() => {
      if (isMountedRef.current && !wsConnectedRef.current) {
        fetchInitialData();
      }
    }, 2000);

    // Browser WebSocket connection with strict single-socket lifecycle
    function connectWebSocket() {
      if (typeof window === 'undefined' || !isMountedRef.current) return;

      // Cancel any pending reconnect timer
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      // Safely close and detach handlers from any existing socket instance
      if (socketRef.current) {
        const oldSocket = socketRef.current;
        socketRef.current = null;
        oldSocket.onopen = null;
        oldSocket.onmessage = null;
        oldSocket.onerror = null;
        oldSocket.onclose = null;
        if (oldSocket.readyState === WebSocket.OPEN || oldSocket.readyState === WebSocket.CONNECTING) {
          oldSocket.close(1000, 'Replacing stale socket connection');
        }
      }

      const connId = ++connectionCounterRef.current;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      try {
        console.log(`[WS_HOOK] [Conn #${connId}] Connecting to browser WebSocket: ${wsUrl}`);
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isMountedRef.current || socketRef.current !== ws) return;
          console.log(`[WS_HOOK] [Conn #${connId}] Connected successfully: ${wsUrl}`);
          setWsConnected(true);

          // Start client-side keep-alive ping every 15s to keep Railway reverse proxy socket alive
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = setInterval(() => {
            if (socketRef.current === ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'PING' }));
            }
          }, 15000);
        };

        ws.onmessage = (event) => {
          if (!isMountedRef.current || socketRef.current !== ws) return;
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
            console.error(`[WS_HOOK] [Conn #${connId}] Message parse error:`, err);
          }
        };

        ws.onerror = (err) => {
          if (!isMountedRef.current || socketRef.current !== ws) return;
          console.warn(`[WS_HOOK] [Conn #${connId}] Browser WebSocket error:`, err);
        };

        ws.onclose = (event) => {
          // GUARD: Ignore close events from stale/previous socket instances!
          if (socketRef.current !== ws) {
            console.log(`[WS_HOOK] [Conn #${connId}] Stale socket closed silently (code: ${event.code}). Active socket is unaffected.`);
            return;
          }

          console.warn(
            `[WS_HOOK] [Conn #${connId}] Browser WebSocket closed (code: ${event.code}, reason: "${event.reason || 'none'}", clean: ${event.wasClean}).`
          );
          setWsConnected(false);
          socketRef.current = null;

          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }

          // Schedule reconnection only if component remains mounted
          if (isMountedRef.current && !reconnectTimerRef.current) {
            console.log(`[WS_HOOK] Scheduling reconnect attempt in 3s...`);
            reconnectTimerRef.current = setTimeout(() => {
              reconnectTimerRef.current = null;
              if (isMountedRef.current) {
                connectWebSocket();
              }
            }, 3000);
          }
        };
      } catch (err) {
        console.error(`[WS_HOOK] [Conn #${connId}] Failed to instantiate WebSocket:`, err);
        if (isMountedRef.current && !reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            if (isMountedRef.current) {
              connectWebSocket();
            }
          }, 3000);
        }
      }
    }

    connectWebSocket();

    return () => {
      isMountedRef.current = false;
      clearInterval(fallbackInterval);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (socketRef.current) {
        const s = socketRef.current;
        socketRef.current = null;
        s.onopen = null;
        s.onmessage = null;
        s.onerror = null;
        s.onclose = null;
        if (s.readyState === WebSocket.OPEN || s.readyState === WebSocket.CONNECTING) {
          s.close(1000, 'Unmounting component');
        }
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
