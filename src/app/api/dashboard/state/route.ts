import { NextResponse } from 'next/server';
import { engineManager } from '../../../../engine/manager';
import { PriceBookTicker } from '../../../../lib/types';

export async function GET() {
  try {
    const status = engineManager.getMarketDataStatus();
    const opportunities = engineManager.getLatestOpportunities();
    const paperTrades = engineManager.paperEngine.getRecentTrades();
    const strategyAccounts = engineManager.getStrategyAccounts();
    const account = strategyAccounts['btc_lead_lag'] || strategyAccounts['triangular'] || null;

    // Convert symbol updates record into tickers array for dashboard views
    const symbolUpdates = status.symbolUpdates || {};
    const tickers: PriceBookTicker[] = Object.entries(symbolUpdates).map(([symbol, val]: [string, any]) => ({
      symbol,
      bidPrice: val.bid,
      bidQty: 10,
      askPrice: val.ask,
      askQty: 10,
      updatedAt: Date.now() - (val.ageMs || 0),
    }));

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      status,
      opportunities,
      paperTrades,
      tickers,
      account,
      strategyAccounts,
    });
  } catch (err: any) {
    console.error('Error fetching dashboard state:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
