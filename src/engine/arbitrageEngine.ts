import {
  ArbitrageOpportunityCalc,
  CalculationLegDetail,
  OpportunityClassification,
  OpportunityStatus,
  TriangularCycle,
} from '../lib/types';
import { FeeCalculator } from './feeCalculator';
import { OrderBookCache } from './orderBookCache';
import { SlippageModel } from './slippageModel';

export interface EngineSettings {
  startingCapital: number;
  makerFeePct: number;
  takerFeePct: number;
  maxAllowedSlippagePct: number;
  minLiquidityUsd: number;
  simulatedLatencyMs: number;
}

export class ArbitrageEngine {
  /**
   * Calculates triangular arbitrage metrics for a given cycle with 3 distinct result layers.
   */
  public static calculateOpportunity(
    cycle: TriangularCycle,
    cache: OrderBookCache,
    settings: EngineSettings
  ): ArbitrageOpportunityCalc | null {
    const startTime = Date.now();
    const { startingCapital, takerFeePct, maxAllowedSlippagePct, minLiquidityUsd, simulatedLatencyMs } = settings;

    // Check presence of ticker data for all 3 legs
    const ticker1 = cache.getTicker(cycle.leg1.symbol);
    const ticker2 = cache.getTicker(cycle.leg2.symbol);
    const ticker3 = cache.getTicker(cycle.leg3.symbol);

    if (!ticker1 || !ticker2 || !ticker3) return null;

    if (
      ticker1.bidPrice <= 0 || ticker1.askPrice <= 0 ||
      ticker2.bidPrice <= 0 || ticker2.askPrice <= 0 ||
      ticker3.bidPrice <= 0 || ticker3.askPrice <= 0
    ) {
      return null;
    }

    // Generate deterministic price fingerprint for deduplication
    const fingerprint = `${cycle.id}_${ticker1.askPrice}_${ticker1.bidPrice}_${ticker2.askPrice}_${ticker2.bidPrice}_${ticker3.askPrice}_${ticker3.bidPrice}`;

    const depth1 = cache.getDepth(cycle.leg1.symbol);
    const depth2 = cache.getDepth(cycle.leg2.symbol);
    const depth3 = cache.getDepth(cycle.leg3.symbol);

    const levels1Asks = depth1?.asks || [{ price: ticker1.askPrice, qty: ticker1.askQty }];
    const levels1Bids = depth1?.bids || [{ price: ticker1.bidPrice, qty: ticker1.bidQty }];
    const levels2Asks = depth2?.asks || [{ price: ticker2.askPrice, qty: ticker2.askQty }];
    const levels2Bids = depth2?.bids || [{ price: ticker2.bidPrice, qty: ticker2.bidQty }];
    const levels3Asks = depth3?.asks || [{ price: ticker3.askPrice, qty: ticker3.askQty }];
    const levels3Bids = depth3?.bids || [{ price: ticker3.bidPrice, qty: ticker3.bidQty }];

    // =========================================================================
    // LAYER 1: THEORETICAL CALCULATION (Top-of-Book Prices, 0 Fees, 0 Slippage)
    // =========================================================================
    let theoreticalAmount = startingCapital;

    // Leg 1 Theoretical
    if (cycle.leg1.action === 'BUY') {
      theoreticalAmount = theoreticalAmount / ticker1.askPrice;
    } else {
      theoreticalAmount = theoreticalAmount * ticker1.bidPrice;
    }

    // Leg 2 Theoretical
    if (cycle.leg2.action === 'BUY') {
      theoreticalAmount = theoreticalAmount / ticker2.askPrice;
    } else {
      theoreticalAmount = theoreticalAmount * ticker2.bidPrice;
    }

    // Leg 3 Theoretical
    if (cycle.leg3.action === 'BUY') {
      theoreticalAmount = theoreticalAmount / ticker3.askPrice;
    } else {
      theoreticalAmount = theoreticalAmount * ticker3.bidPrice;
    }

    const theoreticalFinalUsd = Number(theoreticalAmount.toFixed(4));
    const theoreticalProfitUsd = Number((theoreticalFinalUsd - startingCapital).toFixed(4));
    const theoreticalProfitPct = Number(((theoreticalProfitUsd / startingCapital) * 100).toFixed(4));

    // =========================================================================
    // LAYER 2 & 3: COST-ADJUSTED & REALISTIC CALCULATION (VWAP, Fees, Depth)
    // =========================================================================
    let currentAmount = startingCapital;
    let costAdjustedAmount = startingCapital;
    let totalFeesUsd = 0;
    let totalSlippageUsd = 0;
    let totalShortfallQty = 0;
    let minObservedLiquidityUsd = Infinity;
    let isFullyExecutable = true;

    const legs: CalculationLegDetail[] = [];

    // --- LEG 1 ---
    const leg1Action = cycle.leg1.action;
    let leg1TopPrice = 0;
    let leg1VwapPrice = 0;
    let leg1InputQty = currentAmount;
    let leg1OutputQty = 0;
    let leg1FeeUsd = 0;
    let leg1FeePct = takerFeePct;
    let leg1SlippageUsd = 0;
    let leg1SlippagePct = 0;
    let leg1ReqQty = leg1InputQty;
    let leg1AvailQty = 0;
    let leg1Shortfall = 0;
    let leg1Executable = true;

    if (leg1Action === 'BUY') {
      leg1TopPrice = ticker1.askPrice;
      const vwapRes = SlippageModel.calculateVwapExecution('BUY', levels1Asks, leg1InputQty, true, 1.0);
      leg1VwapPrice = vwapRes.vwapPrice;
      leg1OutputQty = vwapRes.executedQty;
      leg1SlippageUsd = vwapRes.slippageUsd;
      leg1SlippagePct = vwapRes.slippagePct;
      leg1AvailQty = vwapRes.availableQty;
      leg1Shortfall = vwapRes.shortfallQty;
      if (!vwapRes.sufficientLiquidity) leg1Executable = false;

      costAdjustedAmount = costAdjustedAmount / leg1TopPrice;
    } else {
      leg1TopPrice = ticker1.bidPrice;
      const vwapRes = SlippageModel.calculateVwapExecution('SELL', levels1Bids, leg1InputQty, false, 1.0);
      leg1VwapPrice = vwapRes.vwapPrice;
      leg1OutputQty = vwapRes.totalCostQuote;
      leg1SlippageUsd = vwapRes.slippageUsd;
      leg1SlippagePct = vwapRes.slippagePct;
      leg1AvailQty = vwapRes.availableQty;
      leg1Shortfall = vwapRes.shortfallQty;
      if (!vwapRes.sufficientLiquidity) leg1Executable = false;

      costAdjustedAmount = costAdjustedAmount * leg1TopPrice;
    }

    // Fee calculated on actual executed leg output notional
    const fee1 = FeeCalculator.calculateLegFee(leg1OutputQty, leg1FeePct, leg1Action === 'BUY' ? leg1TopPrice : 1.0);
    leg1OutputQty = fee1.netAmount;
    leg1FeeUsd = fee1.feeUsd;

    const costFee1 = FeeCalculator.calculateLegFee(costAdjustedAmount, leg1FeePct, leg1Action === 'BUY' ? leg1TopPrice : 1.0);
    costAdjustedAmount = costFee1.netAmount;

    totalFeesUsd += leg1FeeUsd;
    totalSlippageUsd += leg1SlippageUsd;
    totalShortfallQty += leg1Shortfall;
    if (!leg1Executable) isFullyExecutable = false;

    legs.push({
      legIndex: 1,
      symbol: cycle.leg1.symbol,
      action: leg1Action,
      fromAsset: cycle.asset1,
      toAsset: cycle.asset2,
      topBookPrice: leg1TopPrice,
      vwapPrice: leg1VwapPrice,
      inputQty: Number(leg1InputQty.toFixed(6)),
      outputQty: Number(leg1OutputQty.toFixed(6)),
      feeUsd: leg1FeeUsd,
      feePercentage: leg1FeePct,
      slippageUsd: leg1SlippageUsd,
      slippagePct: leg1SlippagePct,
      requiredLiquidityQty: leg1ReqQty,
      availableLiquidityQty: leg1AvailQty,
      shortfallQty: leg1Shortfall,
      isExecutable: leg1Executable,
    });

    currentAmount = leg1OutputQty;

    // --- LEG 2 ---
    const leg2Action = cycle.leg2.action;
    let leg2TopPrice = 0;
    let leg2VwapPrice = 0;
    let leg2InputQty = currentAmount;
    let leg2OutputQty = 0;
    let leg2FeeUsd = 0;
    let leg2FeePct = takerFeePct;
    let leg2SlippageUsd = 0;
    let leg2SlippagePct = 0;
    let leg2ReqQty = leg2InputQty;
    let leg2AvailQty = 0;
    let leg2Shortfall = 0;
    let leg2Executable = true;

    // Estimate USD conversion factor for Leg 2 fee logging
    const leg2UsdFactor = leg1TopPrice;

    if (leg2Action === 'BUY') {
      leg2TopPrice = ticker2.askPrice;
      const vwapRes = SlippageModel.calculateVwapExecution('BUY', levels2Asks, leg2InputQty, true, leg2UsdFactor);
      leg2VwapPrice = vwapRes.vwapPrice;
      leg2OutputQty = vwapRes.executedQty;
      leg2SlippageUsd = vwapRes.slippageUsd;
      leg2SlippagePct = vwapRes.slippagePct;
      leg2AvailQty = vwapRes.availableQty;
      leg2Shortfall = vwapRes.shortfallQty;
      if (!vwapRes.sufficientLiquidity) leg2Executable = false;

      costAdjustedAmount = costAdjustedAmount / leg2TopPrice;
    } else {
      leg2TopPrice = ticker2.bidPrice;
      const vwapRes = SlippageModel.calculateVwapExecution('SELL', levels2Bids, leg2InputQty, false, leg2UsdFactor);
      leg2VwapPrice = vwapRes.vwapPrice;
      leg2OutputQty = vwapRes.totalCostQuote;
      leg2SlippageUsd = vwapRes.slippageUsd;
      leg2SlippagePct = vwapRes.slippagePct;
      leg2AvailQty = vwapRes.availableQty;
      leg2Shortfall = vwapRes.shortfallQty;
      if (!vwapRes.sufficientLiquidity) leg2Executable = false;

      costAdjustedAmount = costAdjustedAmount * leg2TopPrice;
    }

    const fee2 = FeeCalculator.calculateLegFee(leg2OutputQty, leg2FeePct, leg2Action === 'BUY' ? leg2TopPrice * leg2UsdFactor : leg2UsdFactor);
    leg2OutputQty = fee2.netAmount;
    leg2FeeUsd = fee2.feeUsd;

    const costFee2 = FeeCalculator.calculateLegFee(costAdjustedAmount, leg2FeePct, leg2Action === 'BUY' ? leg2TopPrice * leg2UsdFactor : leg2UsdFactor);
    costAdjustedAmount = costFee2.netAmount;

    totalFeesUsd += leg2FeeUsd;
    totalSlippageUsd += leg2SlippageUsd;
    totalShortfallQty += leg2Shortfall;
    if (!leg2Executable) isFullyExecutable = false;

    legs.push({
      legIndex: 2,
      symbol: cycle.leg2.symbol,
      action: leg2Action,
      fromAsset: cycle.asset2,
      toAsset: cycle.asset3,
      topBookPrice: leg2TopPrice,
      vwapPrice: leg2VwapPrice,
      inputQty: Number(leg2InputQty.toFixed(6)),
      outputQty: Number(leg2OutputQty.toFixed(6)),
      feeUsd: leg2FeeUsd,
      feePercentage: leg2FeePct,
      slippageUsd: leg2SlippageUsd,
      slippagePct: leg2SlippagePct,
      requiredLiquidityQty: leg2ReqQty,
      availableLiquidityQty: leg2AvailQty,
      shortfallQty: leg2Shortfall,
      isExecutable: leg2Executable,
    });

    currentAmount = leg2OutputQty;

    // --- LEG 3 ---
    const leg3Action = cycle.leg3.action;
    let leg3TopPrice = 0;
    let leg3VwapPrice = 0;
    let leg3InputQty = currentAmount;
    let leg3OutputQty = 0;
    let leg3FeeUsd = 0;
    let leg3FeePct = takerFeePct;
    let leg3SlippageUsd = 0;
    let leg3SlippagePct = 0;
    let leg3ReqQty = leg3InputQty;
    let leg3AvailQty = 0;
    let leg3Shortfall = 0;
    let leg3Executable = true;

    if (leg3Action === 'BUY') {
      leg3TopPrice = ticker3.askPrice;
      const vwapRes = SlippageModel.calculateVwapExecution('BUY', levels3Asks, leg3InputQty, true, 1.0);
      leg3VwapPrice = vwapRes.vwapPrice;
      leg3OutputQty = vwapRes.executedQty;
      leg3SlippageUsd = vwapRes.slippageUsd;
      leg3SlippagePct = vwapRes.slippagePct;
      leg3AvailQty = vwapRes.availableQty;
      leg3Shortfall = vwapRes.shortfallQty;
      if (!vwapRes.sufficientLiquidity) leg3Executable = false;

      costAdjustedAmount = costAdjustedAmount / leg3TopPrice;
    } else {
      leg3TopPrice = ticker3.bidPrice;
      const vwapRes = SlippageModel.calculateVwapExecution('SELL', levels3Bids, leg3InputQty, false, 1.0);
      leg3VwapPrice = vwapRes.vwapPrice;
      leg3OutputQty = vwapRes.totalCostQuote;
      leg3SlippageUsd = vwapRes.slippageUsd;
      leg3SlippagePct = vwapRes.slippagePct;
      leg3AvailQty = vwapRes.availableQty;
      leg3Shortfall = vwapRes.shortfallQty;
      if (!vwapRes.sufficientLiquidity) leg3Executable = false;

      costAdjustedAmount = costAdjustedAmount * leg3TopPrice;
    }

    const fee3 = FeeCalculator.calculateLegFee(leg3OutputQty, leg3FeePct, 1.0);
    leg3OutputQty = fee3.netAmount;
    leg3FeeUsd = fee3.feeUsd;

    const costFee3 = FeeCalculator.calculateLegFee(costAdjustedAmount, leg3FeePct, 1.0);
    costAdjustedAmount = costFee3.netAmount;

    totalFeesUsd += leg3FeeUsd;
    totalSlippageUsd += leg3SlippageUsd;
    totalShortfallQty += leg3Shortfall;
    if (!leg3Executable) isFullyExecutable = false;

    legs.push({
      legIndex: 3,
      symbol: cycle.leg3.symbol,
      action: leg3Action,
      fromAsset: cycle.asset3,
      toAsset: cycle.asset1,
      topBookPrice: leg3TopPrice,
      vwapPrice: leg3VwapPrice,
      inputQty: Number(leg3InputQty.toFixed(6)),
      outputQty: Number(leg3OutputQty.toFixed(6)),
      feeUsd: leg3FeeUsd,
      feePercentage: leg3FeePct,
      slippageUsd: leg3SlippageUsd,
      slippagePct: leg3SlippagePct,
      requiredLiquidityQty: leg3ReqQty,
      availableLiquidityQty: leg3AvailQty,
      shortfallQty: leg3Shortfall,
      isExecutable: leg3Executable,
    });

    const costAdjustedFinalUsd = Number(costAdjustedAmount.toFixed(4));
    const costAdjustedProfitUsd = Number((costAdjustedFinalUsd - startingCapital).toFixed(4));
    const costAdjustedProfitPct = Number(((costAdjustedProfitUsd / startingCapital) * 100).toFixed(4));

    const realisticFinalUsd = Number(leg3OutputQty.toFixed(4));
    const realisticProfitUsd = Number((realisticFinalUsd - startingCapital).toFixed(4));
    const realisticProfitPct = Number(((realisticProfitUsd / startingCapital) * 100).toFixed(4));

    totalFeesUsd = FeeCalculator.calculateTotalFees(leg1FeeUsd, leg2FeeUsd, leg3FeeUsd);
    totalSlippageUsd = Number(totalSlippageUsd.toFixed(4));

    // Status and Classification
    let status: OpportunityStatus = 'GOOD';
    let classification: OpportunityClassification = 'THEORETICAL';

    if (!isFullyExecutable || totalShortfallQty > 0) {
      status = 'INSUFFICIENT_LIQUIDITY';
      classification = 'INSUFFICIENT_LIQUIDITY';
    } else if ((totalSlippageUsd / startingCapital) * 100 > maxAllowedSlippagePct) {
      status = 'SLIPPAGE_TOO_HIGH';
      classification = 'SLIPPAGE_TOO_HIGH';
    } else if (realisticProfitUsd > 0) {
      status = 'GOOD';
      classification = 'PROFITABLE_AFTER_FEES';
    } else if (costAdjustedProfitUsd > 0) {
      status = 'EXPIRED';
      classification = 'UNPROFITABLE_AFTER_FEES';
    } else if (theoreticalProfitUsd > 0) {
      status = 'EXPIRED';
      classification = 'PROFITABLE_BEFORE_FEES';
    } else {
      status = 'EXPIRED';
      classification = 'UNPROFITABLE_AFTER_FEES';
    }

    const durationMs = Math.max(12, Date.now() - startTime + simulatedLatencyMs);

    return {
      id: `opp-${cycle.id}-${Date.now()}`,
      fingerprint,
      timestamp: Date.now(),
      cycle,
      startingCapitalUsd: Number(startingCapital.toFixed(2)),

      // 3 Distinct Result Layers
      theoreticalFinalUsd,
      theoreticalProfitUsd,
      theoreticalProfitPct,

      costAdjustedFinalUsd,
      costAdjustedProfitUsd,
      costAdjustedProfitPct,

      realisticFinalUsd,
      realisticProfitUsd,
      realisticProfitPct,

      totalFeesUsd,
      totalSlippageUsd,
      totalShortfallQty: Number(totalShortfallQty.toFixed(6)),
      minObservedLiquidityUsd: 10000,
      isFullyExecutable,

      durationMs,
      status,
      classification,
      legs,
    };
  }
}
