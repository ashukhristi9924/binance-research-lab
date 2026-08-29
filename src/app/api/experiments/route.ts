import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET() {
  try {
    const experiments = await db.researchExperiment.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(experiments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const experiment = await db.researchExperiment.create({
      data: {
        name: body.name,
        strategyType: body.strategyType,
        version: body.version || 'v1.0',
        symbol: body.symbol || 'BTCUSDT',
        parametersJson: JSON.stringify(body.parameters || {}),
        startingCapital: body.startingCapital || 10000.0,
        totalTrades: body.totalTrades || 0,
        winRatePct: body.winRatePct || 0,
        netPnlUsd: body.netPnlUsd || 0,
        roiPct: body.roiPct || 0,
        maxDrawdownPct: body.maxDrawdownPct || 0,
        notes: body.notes,
      },
    });
    return NextResponse.json(experiment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
