import { FeeCalculator } from './feeCalculator';
import { BtcLeadLagSignalCalc, BtcShockFeatureSet } from '../lib/types';

export class BtcLeadLagSignalEngine {
  private minRequiredNetProfitUsd: number;
  private defaultPositionNotionalUsd: number;

  constructor(minRequiredNetProfitUsd: number = 0.15, defaultPositionNotionalUsd: number = 1000.0) {
    this.minRequiredNetProfitUsd = minRequiredNetProfitUsd;
    this.defaultPositionNotionalUsd = defaultPositionNotionalUsd;
  }

  public evaluateSignal(
    symbol: string,
    btcShock: BtcShockFeatureSet,
    followerReturn1sPct: number,
    rollingBeta: number,
    followerSpreadUsd: number,
    followerBidPrice: number,
    followerAskPrice: number,
    orderBookImbalance: number = 0.5,
    tradeFlowRatio: number = 1.0,
    positionNotionalUsd: number = this.defaultPositionNotionalUsd
  ): BtcLeadLagSignalCalc {
    const timestamp = Date.now();
    const midPrice = (followerBidPrice + followerAskPrice) / 2;
    const spreadPct = midPrice > 0 ? (followerSpreadUsd / midPrice) * 100 : 0.02;

    // 1. Calculate Expected Follower Return & Residual
    const btcReturn1sPct = btcShock.return1s;
    const expectedReturnPct = Number((btcReturn1sPct * rollingBeta).toFixed(4));
    const actualReturnPct = Number(followerReturn1sPct.toFixed(4));
    const residualPct = Number((actualReturnPct - expectedReturnPct).toFixed(4));

    // 2. Decision Matrix Evaluation across Model A & Model B
    let direction: 'LONG' | 'SHORT' | 'NO_TRADE' = 'NO_TRADE';
    let modelType: 'LEAD_LAG_MOMENTUM' | 'RELATIVE_VALUE_MEAN_REVERSION' = 'LEAD_LAG_MOMENTUM';

    const absResidual = Math.abs(residualPct);
    const absBtcReturn = Math.abs(btcReturn1sPct);

    if (absBtcReturn >= 0.05) {
      if (btcReturn1sPct > 0) {
        // BTC UP
        if (actualReturnPct < expectedReturnPct - 0.04) {
          // Follower Under-reacts to BTC UP -> Model A Momentum LONG
          direction = 'LONG';
          modelType = 'LEAD_LAG_MOMENTUM';
        } else if (actualReturnPct > expectedReturnPct + 0.10) {
          // Follower Over-reacts to BTC UP -> Model B Mean-Reversion SHORT
          direction = 'SHORT';
          modelType = 'RELATIVE_VALUE_MEAN_REVERSION';
        }
      } else {
        // BTC DOWN
        if (actualReturnPct > expectedReturnPct + 0.04) {
          // Follower Under-reacts to BTC DOWN -> Model A Momentum SHORT
          direction = 'SHORT';
          modelType = 'LEAD_LAG_MOMENTUM';
        } else if (actualReturnPct < expectedReturnPct - 0.10) {
          // Follower Over-reacts to BTC DOWN -> Model B Mean-Reversion LONG
          direction = 'LONG';
          modelType = 'RELATIVE_VALUE_MEAN_REVERSION';
        }
      }
    }

    // 3. Execution Mode Determination
    const executionMode: 'SPOT_LONG' | 'FUTURES_SHORT' = direction === 'SHORT' ? 'FUTURES_SHORT' : 'SPOT_LONG';

    // 4. Order Book & Trade Flow Confirmation Checks
    const orderBookConfirmed =
      direction === 'LONG' ? orderBookImbalance >= 0.52 : direction === 'SHORT' ? orderBookImbalance <= 0.48 : false;

    const tradeFlowConfirmed =
      direction === 'LONG' ? tradeFlowRatio >= 1.2 : direction === 'SHORT' ? tradeFlowRatio <= 0.8 : false;

    // 5. Itemized Economic Costs Reconciler (0.10% Taker Entry + 0.10% Taker Exit via FeeCalculator)
    const entryFeeUsd = Number(FeeCalculator.calculateFeeUsd(positionNotionalUsd, 0.10).toFixed(4));
    const exitFeeUsd = Number(FeeCalculator.calculateFeeUsd(positionNotionalUsd, 0.10).toFixed(4));

    const expectedMovePct = Math.abs(expectedReturnPct - actualReturnPct);
    const expectedGrossUsd = Number(((positionNotionalUsd * expectedMovePct) / 100).toFixed(4));

    const spreadCostUsd = Number(((positionNotionalUsd * spreadPct) / 100).toFixed(4));
    const slippageCostUsd = Number(((positionNotionalUsd * 0.01) / 100).toFixed(4)); // 0.01% VWAP
    const latencyCostUsd = Number(((positionNotionalUsd * 0.0025) / 100).toFixed(4)); // 50ms latency

    const totalCostsUsd = Number((entryFeeUsd + exitFeeUsd + spreadCostUsd + slippageCostUsd + latencyCostUsd).toFixed(4));
    const expectedNetProfitUsd = Number((expectedGrossUsd - totalCostsUsd).toFixed(4));

    // 6. Lead-Lag Score Calculation (0-100)
    let score = 0;
    if (direction !== 'NO_TRADE') {
      score += Math.min(40, Math.round(btcShock.btcShockScore * 0.4));
      score += Math.min(30, Math.round(absResidual * 100));
      if (orderBookConfirmed) score += 15;
      if (tradeFlowConfirmed) score += 15;
    }
    const leadLagScore = Math.min(100, Math.max(0, score));

    // 7. Qualification Gates
    const isQualified = direction !== 'NO_TRADE' && leadLagScore >= 65 && expectedNetProfitUsd >= this.minRequiredNetProfitUsd;

    let pipelineStatus: BtcLeadLagSignalCalc['pipelineStatus'] = 'REJECTED_COST_TOO_HIGH';
    let rejectionReason: string | undefined = undefined;

    if (direction === 'NO_TRADE') {
      pipelineStatus = 'REJECTED_COST_TOO_HIGH';
      rejectionReason = 'NO_DIRECTIONAL_EDGE_DETECTED';
    } else if (leadLagScore < 65) {
      pipelineStatus = 'REJECTED_COST_TOO_HIGH';
      rejectionReason = 'LEAD_LAG_SCORE_TOO_LOW';
    } else if (expectedNetProfitUsd < this.minRequiredNetProfitUsd) {
      pipelineStatus = 'REJECTED_COST_TOO_HIGH';
      rejectionReason = 'EXPECTED_NET_PROFIT_TOO_LOW';
    } else {
      pipelineStatus = 'QUALIFIED_READY';
    }

    return {
      id: `${symbol}-${timestamp}`,
      symbol,
      timestamp,
      btcReturn1sPct,
      followerReturn1sPct: actualReturnPct,
      rollingBeta,
      expectedReturnPct,
      actualReturnPct,
      residualPct,
      modelType,
      direction,
      executionMode,
      leadLagScore,
      isQualified,
      positionNotionalUsd,
      expectedGrossUsd,
      entryFeeUsd,
      exitFeeUsd,
      spreadCostUsd,
      slippageCostUsd,
      latencyCostUsd,
      totalCostsUsd,
      expectedNetProfitUsd,
      minRequiredNetProfitUsd: this.minRequiredNetProfitUsd,
      pipelineStatus,
      rejectionReason,
      orderBookConfirmed,
      tradeFlowConfirmed,
    };
  }
}
