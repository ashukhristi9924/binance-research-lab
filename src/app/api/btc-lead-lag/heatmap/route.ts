import { NextResponse } from 'next/server';
import { engineManager } from '../../../../engine/manager';

export async function GET() {
  try {
    const heatmap = engineManager.btcLeadLagEngine.getLeadLagHeatmap();
    return NextResponse.json({
      success: true,
      heatmap,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
