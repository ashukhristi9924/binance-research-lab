import { ScalperFeatureSet, ScalperSignalCalc, WhyNotTradeReason } from '../lib/types';
import { FeeCalculator } from './feeCalculator';

export interface ScalperSignalSettings {
  minScalperScore: number;         // default 70
  minExpectedNetProfitUsd: number; // default $0.15
  takerFeePct: number;            // default 0.10%
  simulatedLatencyMs: number;     // default 50ms
  maxSpreadPct: number;           // default 0.05%
  minLiquidityUsd: number;        // default $500
}

export class ScalperSignalEngine {
  private settings: ScalperSignalSettings = {
    minScalperScore: 70,
    minExpectedNetProfitUsd: 0.15,
    takerFeePct: 0.10,
    simulatedLatencyMs: 50,
    maxSpreadPct: 0.05,
    minLiquidityUsd: 500,
  };

  public updateSettings(newSettings: Partial<ScalperSignalSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Calculates cost-aware expected net profit and composite Micro-Scalp Score (0-100).
   */
  public evaluateSignal(
    features: ScalperFeatureSet,
    tradeSizeUsd: number = 1000
  ): ScalperSignalCalc {
    const { midPrice, askPrice, spreadPct, return1s, return5s, imbalanceRatio, tradeFlowRatio, volatilityRegime, adaptiveThresholdPct } = features;

    // Expected Gross Movement % based on 1s/5s momentum and adaptive threshold
    const expectedGrossMovementPct = Math.max(adaptiveThresholdPct, (return1s + return5s) / 2);
    const expectedGrossUsd = Number(((expectedGrossMovementPct / 100) * tradeSizeUsd).toFixed(4));

    // Itemized Cost Calculations (Third & Tenth Requirements)
    const entryFeeRatePct = this.settings.takerFeePct; // 0.10% Spot Taker
    const exitFeeRatePct = this.settings.takerFeePct;  // 0.10% Spot Taker

    const entryFeeUsd = Number(FeeCalculator.calculateFeeUsd(tradeSizeUsd, entryFeeRatePct).toFixed(4));
    const exitFeeUsd = Number(FeeCalculator.calculateFeeUsd(tradeSizeUsd, exitFeeRatePct).toFixed(4));

    const spreadCostUsd = Number(((spreadPct / 100) * tradeSizeUsd).toFixed(4));
    const slippageCostUsd = Number(((0.01 / 100) * tradeSizeUsd).toFixed(4)); // 0.01% Order book VWAP slippage
    const latencyCostUsd = Number((((this.settings.simulatedLatencyMs / 1000) * 0.005 / 100) * tradeSizeUsd).toFixed(4));

    // Total Itemized Costs
    const totalCostsUsd = Number((entryFeeUsd + exitFeeUsd + spreadCostUsd + slippageCostUsd + latencyCostUsd).toFixed(4));

    // Expected Net Profit & Mathematical Reconciliation (Fourth, Fifth, Sixth Requirements)
    const expectedNetProfitUsd = Number((expectedGrossUsd - totalCostsUsd).toFixed(4));
    const expectedNetProfitPct = Number(((expectedNetProfitUsd / tradeSizeUsd) * 100).toFixed(4));

    // Composite Micro-Scalp Score (0 - 100)
    const momScore = Math.min(30, Math.max(0, expectedGrossMovementPct * 500));
    const imbScore = Math.min(30, Math.max(0, (imbalanceRatio + 1) * 15));
    const flowScore = Math.min(25, Math.max(0, (tradeFlowRatio / 2.0) * 12.5));
    const spreadScore = Math.max(0, 15 - spreadPct * 300);

    const scalperScore = Math.min(100, Math.max(0, Math.round(momScore + imbScore + flowScore + spreadScore)));

    // Qualification Filter & Why-Not-Trade Reason
    let isQualified = true;
    let pipelineStatus: ScalperSignalCalc['pipelineStatus'] = 'QUALIFIED_READY';
    let rejectionReason: WhyNotTradeReason | undefined = undefined;

    if (spreadPct > this.settings.maxSpreadPct) {
      isQualified = false;
      pipelineStatus = 'REJECTED_SPREAD_TOO_HIGH';
      rejectionReason = 'SPREAD_TOO_HIGH';
    } else if (scalperScore < this.settings.minScalperScore) {
      isQualified = false;
      pipelineStatus = 'REJECTED_SCORE_TOO_LOW';
      rejectionReason = 'SIGNAL_SCORE_TOO_LOW';
    } else if (expectedNetProfitUsd < this.settings.minExpectedNetProfitUsd || expectedNetProfitPct <= 0) {
      isQualified = false;
      pipelineStatus = 'REJECTED_COST_TOO_HIGH';
      rejectionReason = 'EXPECTED_NET_PROFIT_TOO_LOW';
    }

    return {
      id: `scs-${features.symbol}-${Date.now()}`,
      timestamp: Date.now(),
      symbol: features.symbol,
      midPrice,
      entryAskPrice: askPrice,
      positionNotionalUsd: tradeSizeUsd,
      expectedGrossMovementPct: Number(expectedGrossMovementPct.toFixed(4)),
      expectedGrossUsd,
      entryFeeRatePct,
      entryFeeUsd,
      exitFeeRatePct,
      exitFeeUsd,
      spreadCostUsd,
      slippageCostUsd,
      latencyCostUsd,
      totalCostsUsd,
      expectedNetProfitPct,
      expectedNetProfitUsd,
      minRequiredNetUsd: this.settings.minExpectedNetProfitUsd,
      scalperScore,
      volatilityRegime,
      isQualified,
      pipelineStatus,
      rejectionReason,
    };
  }

  /**
   * Ranks qualified signals across all universe pairs by Scalper Score and Expected Net Profit.
   */
  public rankOpportunities(signals: ScalperSignalCalc[]): ScalperSignalCalc[] {
    return signals
      .slice()
      .sort((a, b) => b.scalperScore - a.scalperScore || b.expectedNetProfitUsd - a.expectedNetProfitUsd);
  }
}
