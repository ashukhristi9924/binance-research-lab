import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { engineManager } from '../../../engine/manager';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    const opportunities = await db.arbitrageOpportunity.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    if (opportunities.length === 0) {
      // Return recent memory cache if DB is empty
      const mem = engineManager.getLatestOpportunities();
      return NextResponse.json(mem.slice(0, limit));
    }

    return NextResponse.json(opportunities);
  } catch (err: any) {
    const mem = engineManager.getLatestOpportunities();
    return NextResponse.json(mem.slice(0, limit));
  }
}
