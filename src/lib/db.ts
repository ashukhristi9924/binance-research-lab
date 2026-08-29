import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

export async function ensureDefaultRecords() {
  try {
    const settings = await db.strategySettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      await db.strategySettings.create({
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

    const account = await db.paperAccount.findUnique({
      where: { id: 'default' },
    });

    if (!account) {
      await db.paperAccount.create({
        data: {
          id: 'default',
          virtualBalanceUsd: 10000.0,
          initialCapitalUsd: 10000.0,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          grossPnlUsd: 0.0,
          totalFeesUsd: 0.0,
          totalSlippageUsd: 0.0,
          netPnlUsd: 0.0,
          winRatePct: 0.0,
        },
      });
    }
  } catch (err) {
    console.error('Error ensuring default DB records:', err);
  }
}
