import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'trades';

  try {
    if (type === 'trades') {
      const trades = await db.paperTrade.findMany({
        orderBy: { timestamp: 'desc' },
        include: { legs: true },
      });

      const header = 'Trade ID,Timestamp,Cycle Path,Starting Capital USD,Final Balance USD,Gross Profit USD,Total Fees USD,Total Slippage USD,Net Profit USD,Net %,Status,Duration MS\n';
      const rows = trades
        .map(
          (t) =>
            `"${t.id}","${t.timestamp.toISOString()}","${t.cyclePath}",${t.startingCapitalUsd},${t.finalBalanceUsd},${t.grossProfitUsd},${t.totalFeesUsd},${t.totalSlippageUsd},${t.netProfitUsd},${t.netProfitPct},"${t.status}",${t.executionDurationMs}`
        )
        .join('\n');

      return new Response(header + rows, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="paper_trades_export.csv"',
        },
      });
    } else {
      const opps = await db.arbitrageOpportunity.findMany({
        orderBy: { timestamp: 'desc' },
        take: 1000,
      });

      const header = 'Opportunity ID,Timestamp,Cycle Path,Starting Capital USD,Theoretical Final USD,Gross Profit USD,Fees USD,Slippage USD,Net Profit USD,Net %,Liquidity USD,Duration MS,Status,Classification\n';
      const rows = opps
        .map(
          (o) =>
            `"${o.id}","${o.timestamp.toISOString()}","${o.cyclePath}",${o.startingCapitalUsd},${o.theoreticalFinalUsd},${o.grossProfitUsd},${o.totalFeesUsd},${o.totalSlippageUsd},${o.netProfitUsd},${o.netProfitPct},${o.liquidityUsd},${o.durationMs},"${o.status}","${o.classification}"`
        )
        .join('\n');

      return new Response(header + rows, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="arbitrage_opportunities_export.csv"',
        },
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
