import { NextResponse } from 'next/server';
import { engineManager } from '../../../../engine/manager';
import { db } from '../../../../lib/db';

export async function GET() {
  try {
    const accounts = await db.strategyAccount.findMany({});
    const status = engineManager.getMarketDataStatus();

    return NextResponse.json({
      status,
      accounts,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
