import { NextResponse } from 'next/server';
import { engineManager } from '../../../../engine/manager';

export async function GET() {
  try {
    const status = engineManager.btcLeadLagEngine.getStatus();
    const account = engineManager.getStrategyAccounts()['btc_lead_lag'] || {};

    return NextResponse.json({
      success: true,
      status,
      account,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
