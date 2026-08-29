import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { engineManager } from '../../../../engine/manager';

export async function GET() {
  try {
    const fills = await db.marketMakingFill.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    const activeQuote = engineManager.marketMakingEngine.getActiveQuote();
    const inventory = engineManager.marketMakingEngine.getInventory();
    const settings = engineManager.marketMakingEngine.getSettings();

    return NextResponse.json({
      activeQuote,
      inventory,
      settings,
      fills,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
