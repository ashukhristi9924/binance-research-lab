import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { engineManager } from '../../../engine/manager';

export async function GET() {
  let settings = await db.strategySettings.findUnique({ where: { id: 'default' } });
  if (!settings) {
    settings = await db.strategySettings.create({
      data: {
        id: 'default',
        startingCapital: 10000.0,
        minNetProfitPct: 0.05,
        minNetProfitUsd: 0.50,
        maxTradeSize: 5000.0,
        makerFeePct: 0.075,
        takerFeePct: 0.10,
        maxAllowedSlippagePct: 0.20,
        minLiquidityUsd: 100.0,
        simulatedLatencyMs: 75,
        enablePaperTrading: true,
        enableOpportunityDetection: true,
        demoMode: false,
        retentionDays: 30,
      },
    });
  }
  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const updated = await db.strategySettings.upsert({
      where: { id: 'default' },
      update: {
        startingCapital: Number(body.startingCapital),
        minNetProfitPct: Number(body.minNetProfitPct),
        minNetProfitUsd: Number(body.minNetProfitUsd),
        maxTradeSize: Number(body.maxTradeSize),
        makerFeePct: Number(body.makerFeePct),
        takerFeePct: Number(body.takerFeePct),
        maxAllowedSlippagePct: Number(body.maxAllowedSlippagePct),
        minLiquidityUsd: Number(body.minLiquidityUsd),
        simulatedLatencyMs: Number(body.simulatedLatencyMs),
        enablePaperTrading: Boolean(body.enablePaperTrading),
        enableOpportunityDetection: Boolean(body.enableOpportunityDetection),
        demoMode: Boolean(body.demoMode),
        retentionDays: Number(body.retentionDays || 30),
      },
      create: {
        id: 'default',
        startingCapital: Number(body.startingCapital),
        minNetProfitPct: Number(body.minNetProfitPct),
        minNetProfitUsd: Number(body.minNetProfitUsd),
        maxTradeSize: Number(body.maxTradeSize),
        makerFeePct: Number(body.makerFeePct),
        takerFeePct: Number(body.takerFeePct),
        maxAllowedSlippagePct: Number(body.maxAllowedSlippagePct),
        minLiquidityUsd: Number(body.minLiquidityUsd),
        simulatedLatencyMs: Number(body.simulatedLatencyMs),
        enablePaperTrading: Boolean(body.enablePaperTrading),
        enableOpportunityDetection: Boolean(body.enableOpportunityDetection),
        demoMode: Boolean(body.demoMode),
        retentionDays: Number(body.retentionDays || 30),
      },
    });

    await engineManager.loadSettingsFromDb();
    if (body.demoMode !== undefined) {
      engineManager.setDemoMode(Boolean(body.demoMode));
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
