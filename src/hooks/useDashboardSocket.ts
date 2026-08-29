import { useEffect, useState, useRef } from 'react';
import { ArbitrageOpportunityCalc, PaperTradeRecord, PriceBookTicker } from '../lib/types';

export function useDashboardSocket() {
  const [status, setStatus] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunityCalc[]>([]);
  const [paperTrades, setPaperTrades] = useState<PaperTradeRecord[]>([]);
  const [tickers, setTickers] = useState<PriceBookTicker[]>([]);
  const [account, setAccount] = useState<any>(null);
  const [isPolling, setIsPolling] = useState<boolean>(true);

  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;

    const fetchDashboardState = async () => {
      if (!isMountedRef.current) return;
      try {
        const res = await fetch('/api/dashboard/state');
        if (res.ok && isMountedRef.current) {
          const data = await res.json();
          if (data.status) setStatus(data.status);
          if (Array.isArray(data.opportunities)) setOpportunities(data.opportunities);
          if (Array.isArray(data.paperTrades)) setPaperTrades(data.paperTrades);
          if (Array.isArray(data.tickers)) setTickers(data.tickers);
          if (data.account) setAccount(data.account);
          setIsPolling(true);
        }
      } catch (err) {
        console.error('[REST_POLL] Error fetching dashboard state:', err);
      }
    };

    // Immediate initial fetch
    fetchDashboardState();

    // REST Polling every 1.5 seconds (1500 ms)
    const interval = setInterval(fetchDashboardState, 1500);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  return {
    status,
    opportunities,
    paperTrades,
    tickers,
    account,
    wsConnected: isPolling,
    refreshData: async () => {
      try {
        const res = await fetch('/api/dashboard/state');
        if (res.ok) {
          const data = await res.json();
          if (data.status) setStatus(data.status);
        }
      } catch (e) {}
    },
  };
}
