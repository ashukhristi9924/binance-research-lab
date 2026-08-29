import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { engineManager } from '../../../../engine/manager';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const trades = await db.scalperTrade.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    const openPositions = engineManager.scalperEngine.getOpenPositions();

    return NextResponse.json({
      openPositions,
      trades,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
