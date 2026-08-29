import { NextResponse } from 'next/server';
import { engineManager } from '../../../../engine/manager';

export async function GET() {
  try {
    const activeSignals = engineManager.scalperEngine.getActiveSignals();
    const rankedOpportunities = engineManager.scalperEngine.signalEngine.rankOpportunities(activeSignals);

    return NextResponse.json({
      rankedOpportunities,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
