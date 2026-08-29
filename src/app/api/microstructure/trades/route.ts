import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { engineManager } from '../../../../engine/manager';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTCUSDT';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const trades = await db.microstructureTrade.findMany({
      where: symbol ? { symbol } : undefined,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    const activeSignalsMap = engineManager.microstructureEngine.getActiveSignals();
    const activeSignal = activeSignalsMap.get(symbol) || null;
    const openPositions = engineManager.microstructureEngine.getOpenPositions();

    return NextResponse.json({
      symbol,
      activeSignal,
      openPositions,
      trades,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
