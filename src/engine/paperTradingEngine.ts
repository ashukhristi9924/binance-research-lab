import { db } from '../lib/db';
import { ArbitrageOpportunityCalc, PaperTradeRecord } from '../lib/types';
import { EngineSettings } from './arbitrageEngine';
import { logger } from './logger';

export class PaperTradingEngine {
  private active: boolean = true;

  public setEnabled(enabled: boolean) {
    this.active = enabled;
  }

  public isEnabled(): boolean {
    return this.active;
  }

  /**
   * Evaluates detected opportunity against strict paper trading execution rules.
   */
  public async processOpportunity(
    opp: ArbitrageOpportunityCalc,
    settings: EngineSettings & { minNetProfitPct: number; minNetProfitUsd: number; maxTradeSize: number },
    onTradeExecuted?: (trade: PaperTradeRecord) => void
  ): Promise<PaperTradeRecord | null> {
    if (!this.active) return null;

    // Rule 1: All 3 legs must have sufficient liquidity (zero shortfall)
    if (!opp.isFullyExecutable || opp.totalShortfallQty > 0) {
      return null;
    }

    // Rule 2: Opportunity status must be GOOD and net profitable after fees & slippage
    if (opp.status !== 'GOOD' || opp.realisticProfitUsd <= 0) {
      return null;
    }

    // Rule 3: Must satisfy configured minimum net profit thresholds
    if (opp.realisticProfitPct < settings.minNetProfitPct) {
      return null;
    }

    if (opp.realisticProfitUsd < settings.minNetProfitUsd) {
      return null;
    }

    // Rule 4: Must not exceed configured maximum trade size
    if (opp.startingCapitalUsd > settings.maxTradeSize) {
      return null;
    }

    // All strict rules passed -> Execute paper trade
    const executionDuration = Math.max(25, settings.simulatedLatencyMs + Math.floor(Math.random() * 15));
    const isProfit = opp.realisticProfitUsd > 0;
    const tradeStatus = isProfit ? 'SIMULATED_PROFIT' : 'SIMULATED_LOSS';

    const finalBalanceUsd = opp.startingCapitalUsd + opp.realisticProfitUsd;

    const paperTrade: PaperTradeRecord = {
      id: `pt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      opportunityId: opp.id,
      timestamp: Date.now(),
      cyclePath: opp.cycle.id,
      startingCapitalUsd: opp.startingCapitalUsd,
      finalBalanceUsd: Number(finalBalanceUsd.toFixed(2)),
      grossProfitUsd: opp.theoreticalProfitUsd,
      totalFeesUsd: opp.totalFeesUsd,
      totalSlippageUsd: opp.totalSlippageUsd,
      netProfitUsd: opp.realisticProfitUsd,
      netProfitPct: opp.realisticProfitPct,
      status: tradeStatus,
      executionDurationMs: executionDuration,
      legs: opp.legs,
    };

    opp.status = 'EXECUTED';
    opp.classification = 'REALISTIC_PAPER_EXECUTION';

    // Persist to database
    try {
      const oppDb = await db.arbitrageOpportunity.create({
        data: {
          id: opp.id,
          timestamp: new Date(opp.timestamp),
          cyclePath: opp.cycle.id,
          leg1Pair: opp.cycle.leg1.symbol,
          leg2Pair: opp.cycle.leg2.symbol,
          leg3Pair: opp.cycle.leg3.symbol,
          startingCapitalUsd: opp.startingCapitalUsd,
          theoreticalFinalUsd: opp.theoreticalFinalUsd,
          grossProfitUsd: opp.theoreticalProfitUsd,
          totalFeesUsd: opp.totalFeesUsd,
          totalSlippageUsd: opp.totalSlippageUsd,
          netProfitUsd: opp.realisticProfitUsd,
          netProfitPct: opp.realisticProfitPct,
          liquidityUsd: opp.minObservedLiquidityUsd,
          durationMs: opp.durationMs,
          status: 'EXECUTED',
          classification: 'REALISTIC_PAPER_EXECUTION',
        },
      });

      await db.paperTrade.create({
        data: {
          id: paperTrade.id,
          opportunityId: oppDb.id,
          timestamp: new Date(paperTrade.timestamp),
          cyclePath: paperTrade.cyclePath,
          startingCapitalUsd: paperTrade.startingCapitalUsd,
          finalBalanceUsd: paperTrade.finalBalanceUsd,
          grossProfitUsd: paperTrade.grossProfitUsd,
          totalFeesUsd: paperTrade.totalFeesUsd,
          totalSlippageUsd: paperTrade.totalSlippageUsd,
          netProfitUsd: paperTrade.netProfitUsd,
          netProfitPct: paperTrade.netProfitPct,
          status: paperTrade.status,
          executionDurationMs: paperTrade.executionDurationMs,
          legs: {
            create: paperTrade.legs.map((leg) => ({
              legIndex: leg.legIndex,
              symbol: leg.symbol,
              side: leg.action,
              topBookPrice: leg.topBookPrice,
              vwapPrice: leg.vwapPrice,
              quantity: leg.inputQty,
              quoteQuantity: leg.outputQty,
              feeUsd: leg.feeUsd,
              slippageUsd: leg.slippageUsd,
            })),
          },
        },
      });

      const account = await db.paperAccount.findUnique({ where: { id: 'default' } });
      if (account) {
        const newBalance = account.virtualBalanceUsd + opp.realisticProfitUsd;
        const newTotalTrades = account.totalTrades + 1;
        const newWinning = account.winningTrades + (isProfit ? 1 : 0);
        const newLosing = account.losingTrades + (isProfit ? 0 : 1);
        const newGrossPnl = account.grossPnlUsd + opp.theoreticalProfitUsd;
        const newFees = account.totalFeesUsd + opp.totalFeesUsd;
        const newSlippage = account.totalSlippageUsd + opp.totalSlippageUsd;
        const newNetPnl = account.netPnlUsd + opp.realisticProfitUsd;
        const newWinRate = newTotalTrades > 0 ? (newWinning / newTotalTrades) * 100 : 0;

        await db.paperAccount.update({
          where: { id: 'default' },
          data: {
            virtualBalanceUsd: Number(newBalance.toFixed(2)),
            totalTrades: newTotalTrades,
            winningTrades: newWinning,
            losingTrades: newLosing,
            grossPnlUsd: Number(newGrossPnl.toFixed(4)),
            totalFeesUsd: Number(newFees.toFixed(4)),
            totalSlippageUsd: Number(newSlippage.toFixed(4)),
            netPnlUsd: Number(newNetPnl.toFixed(4)),
            winRatePct: Number(newWinRate.toFixed(2)),
          },
        });
      }

      await logger.log(
        'INFO',
        'PAPER_TRADER',
        `Executed Paper Trade on ${paperTrade.cyclePath}: Net PnL +$${paperTrade.netProfitUsd} (+${paperTrade.netProfitPct}%)`,
        { tradeId: paperTrade.id, netUsd: paperTrade.netProfitUsd }
      );

      if (onTradeExecuted) {
        onTradeExecuted(paperTrade);
      }

      return paperTrade;
    } catch (e: any) {
      await logger.log('ERROR', 'PAPER_TRADER', `Failed persisting paper trade: ${e.message}`);
      return paperTrade;
    }
  }

  public async resetPaperAccount(newStartingCapital?: number) {
    try {
      const current = await db.paperAccount.findUnique({ where: { id: 'default' } });
      const capital = newStartingCapital || current?.initialCapitalUsd || 10000.0;

      await db.paperTradeLeg.deleteMany({});
      await db.paperTrade.deleteMany({});
      await db.paperAccount.update({
        where: { id: 'default' },
        data: {
          virtualBalanceUsd: capital,
          initialCapitalUsd: capital,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          grossPnlUsd: 0,
          totalFeesUsd: 0,
          totalSlippageUsd: 0,
          netPnlUsd: 0,
          winRatePct: 0,
        },
      });

      await logger.log('INFO', 'PAPER_TRADER', `Paper Account reset to virtual balance $${capital}`);
    } catch (e: any) {
      await logger.log('ERROR', 'PAPER_TRADER', `Failed resetting paper account: ${e.message}`);
    }
  }

  public async resetAllResearchData() {
    try {
      await this.resetPaperAccount();
      await db.arbitrageOpportunity.deleteMany({});
      await db.researchLog.deleteMany({});
      await db.performanceMetric.deleteMany({});
      await logger.log('INFO', 'SYSTEM', 'All research data reset successfully.');
    } catch (e: any) {
      await logger.log('ERROR', 'SYSTEM', `Failed resetting research data: ${e.message}`);
    }
  }
}
