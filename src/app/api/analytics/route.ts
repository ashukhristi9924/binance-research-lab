import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET() {
  try {
    const account = await db.paperAccount.findUnique({ where: { id: 'default' } });
    const totalOppsCount = await db.arbitrageOpportunity.count();
    const tradesCount = await db.paperTrade.count();
    const trades = await db.paperTrade.findMany({
      orderBy: { timestamp: 'asc' },
      take: 1000,
    });

    const opps = await db.arbitrageOpportunity.findMany({
      take: 1000,
      orderBy: { timestamp: 'desc' },
    });

    let totalTheoreticalProfitUsd = 0;
    let totalRealisticProfitUsd = 0;

    for (const opp of opps) {
      totalTheoreticalProfitUsd += Math.max(0, opp.grossProfitUsd);
      totalRealisticProfitUsd += opp.netProfitUsd;
    }

    // Path performance breakdown
    const pathStats = new Map<string, { count: number; executed: number; winCount: number; netPnl: number }>();
    for (const opp of opps) {
      if (!pathStats.has(opp.cyclePath)) {
        pathStats.set(opp.cyclePath, { count: 0, executed: 0, winCount: 0, netPnl: 0 });
      }
      const st = pathStats.get(opp.cyclePath)!;
      st.count += 1;
      if (opp.status === 'EXECUTED') {
        st.executed += 1;
        if (opp.netProfitUsd > 0) st.winCount += 1;
        st.netPnl += opp.netProfitUsd;
      }
    }

    const pathPerformance = Array.from(pathStats.entries()).map(([path, data]) => ({
      path,
      totalOpportunities: data.count,
      paperExecuted: data.executed,
      winRatePct: data.executed > 0 ? (data.winCount / data.executed) * 100 : 0,
      netPnlUsd: Number(data.netPnl.toFixed(4)),
    }));

    return NextResponse.json({
      account,
      metrics: {
        totalOpportunities: totalOppsCount,
        totalPaperTrades: tradesCount,
        totalTheoreticalProfitUsd: Number(totalTheoreticalProfitUsd.toFixed(2)),
        totalRealisticProfitUsd: Number(totalRealisticProfitUsd.toFixed(2)),
        slippageGapUsd: Number((totalTheoreticalProfitUsd - totalRealisticProfitUsd).toFixed(2)),
      },
      pathPerformance,
      recentTrades: trades.slice(-50),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
