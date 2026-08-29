import { NextResponse } from 'next/server';
import { engineManager } from '../../../../engine/manager';

export async function GET() {
  try {
    const signals = engineManager.btcLeadLagEngine.getRecentSignals();
    const openPositions = engineManager.btcLeadLagEngine.getOpenPositions();

    return NextResponse.json({
      success: true,
      opportunities: signals,
      openPositions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
