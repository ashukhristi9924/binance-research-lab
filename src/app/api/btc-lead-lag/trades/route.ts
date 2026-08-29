import { NextResponse } from 'next/server';
import { engineManager } from '../../../../engine/manager';

export async function GET() {
  try {
    const trades = engineManager.btcLeadLagEngine.getRecentTrades();
    return NextResponse.json({
      success: true,
      trades,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
