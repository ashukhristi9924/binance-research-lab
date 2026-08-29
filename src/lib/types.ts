export type SymbolSide = 'BUY' | 'SELL';

export interface ExchangeSymbolInfo {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
  isSpotTradingAllowed: boolean;
}

export interface MarketPairGraph {
  symbols: Map<string, ExchangeSymbolInfo>;
  assetPairs: Map<string, Set<string>>;
}

export interface TriangularCycle {
  id: string;
  asset1: string;
  asset2: string;
  asset3: string;
  leg1: {
    symbol: string;
    action: SymbolSide;
    baseAsset: string;
    quoteAsset: string;
  };
  leg2: {
    symbol: string;
    action: SymbolSide;
    baseAsset: string;
    quoteAsset: string;
  };
  leg3: {
    symbol: string;
    action: SymbolSide;
    baseAsset: string;
    quoteAsset: string;
  };
}

export interface PriceBookTicker {
  symbol: string;
  bidPrice: number;
  bidQty: number;
  askPrice: number;
  askQty: number;
  updatedAt: number;
}

export interface OrderBookLevel {
  price: number;
  qty: number;
}

export interface OrderBookDepth {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  lastUpdateId: number;
  updatedAt: number;
}

export interface CalculationLegDetail {
  legIndex: number;
  symbol: string;
  action: SymbolSide;
  fromAsset: string;
  toAsset: string;
  topBookPrice: number;
  vwapPrice: number;
  inputQty: number;
  outputQty: number;
  feeUsd: number;
  feePercentage: number;
  slippageUsd: number;
  slippagePct: number;
  requiredLiquidityQty: number;
  availableLiquidityQty: number;
  shortfallQty: number;
  isExecutable: boolean;
}

export type OpportunityStatus = 
  | 'GOOD'
  | 'INSUFFICIENT_LIQUIDITY'
  | 'SLIPPAGE_TOO_HIGH'
  | 'EXPIRED'
  | 'EXECUTED';

export type OpportunityClassification =
  | 'THEORETICAL'
  | 'PROFITABLE_BEFORE_FEES'
  | 'UNPROFITABLE_AFTER_FEES'
  | 'PROFITABLE_AFTER_FEES'
  | 'INSUFFICIENT_LIQUIDITY'
  | 'SLIPPAGE_TOO_HIGH'
  | 'OPPORTUNITY_EXPIRED'
  | 'REALISTIC_PAPER_EXECUTION'
  | 'SIMULATED_PROFIT'
  | 'SIMULATED_LOSS';

export interface ArbitrageOpportunityCalc {
  id: string;
  fingerprint: string;
  timestamp: number;
  cycle: TriangularCycle;
  startingCapitalUsd: number;

  theoreticalFinalUsd: number;
  theoreticalProfitUsd: number;
  theoreticalProfitPct: number;

  costAdjustedFinalUsd: number;
  costAdjustedProfitUsd: number;
  costAdjustedProfitPct: number;

  realisticFinalUsd: number;
  realisticProfitUsd: number;
  realisticProfitPct: number;

  totalFeesUsd: number;
  totalSlippageUsd: number;
  totalShortfallQty: number;
  minObservedLiquidityUsd: number;
  isFullyExecutable: boolean;

  durationMs: number;
  status: OpportunityStatus;
  classification: OpportunityClassification;
  legs: CalculationLegDetail[];
}

export interface PaperTradeRecord {
  id: string;
  opportunityId?: string;
  timestamp: number;
  cyclePath: string;
  startingCapitalUsd: number;
  finalBalanceUsd: number;
  grossProfitUsd: number;
  totalFeesUsd: number;
  totalSlippageUsd: number;
  netProfitUsd: number;
  netProfitPct: number;
  status: 'SIMULATED_PROFIT' | 'SIMULATED_LOSS';
  executionDurationMs: number;
  legs: CalculationLegDetail[];
}

export interface OpportunityCounters {
  uniqueCyclesMonitored: number;
  rawCalculations: number;
  theoreticalOpportunities: number;
  profitableAfterFees: number;
  executableAfterLiquidity: number;
  paperExecutions: number;
}

// Microstructure & Market Making Types
export interface TradeFlowSnapshot {
  symbol: string;
  buyVolume: number;
  sellVolume: number;
  buySellRatio: number;
  tradeCountPerSec: number;
  volumePerSec: number;
  tradeAcceleration: number;
  lastUpdate: number;
}

export interface MicrostructureFeatureSet {
  symbol: string;
  timestamp: number;
  midPrice: number;
  spreadUsd: number;
  spreadPct: number;
  imbalanceTop5: number;
  imbalanceTop10: number;
  imbalanceTop20: number;
  depthImbalance01: number;
  tradeFlowRatio: number;
  tradesPerSec: number;
  volumePerSec: number;
  momentum1s: number;
  momentum3s: number;
  momentum5s: number;
  momentum10s: number;
  momentum30s: number;
  volatility: number;
  signalScore: number;
  signalDirection: 'LONG' | 'SHORT' | 'NEUTRAL';
}

export interface MicrostructureTradeRecord {
  id: string;
  timestamp: number;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  signalScore: number;
  holdingTimeMs: number;
  grossPnlUsd: number;
  feeUsd: number;
  slippageUsd: number;
  netPnlUsd: number;
  netPnlPct: number;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MAX_HOLDING' | 'IMBALANCE_REVERSAL';
  imbalanceRatio: number;
  tradeFlowRatio: number;
  momentum1s: number;
}

export interface MarketSnapshot {
  timestamp: number;
  bestBid: number;
  bestAsk: number;
  midPrice: number;
  simulatedBid: number;
  simulatedAsk: number;
}

export interface MarketMakingQuoteRecord {
  id: string;
  timestamp: number;
  symbol: string;
  simulatedBid: number;
  simulatedAsk: number;
  midPrice: number;
  spreadPerUnitUsd: number;
  totalSpreadUsd: number;
  orderSizeBase: number;
  queueAhead: number;
  queueConsumed: number;
  status: 'ACTIVE' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'EXPIRED';
}

export interface MarketMakingFillRecord {
  id: string;
  timestamp: number;
  orderPlacementTime: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  fillPrice: number;
  quantity: number;
  notionalUsd: number;
  spreadPerUnitUsd: number;
  totalSpreadUsd: number;
  feeType: 'MAKER' | 'TAKER';
  feeRatePct: number;
  feeUsd: number;
  slippageUsd: number;
  adverseSelection100ms: number;
  adverseSelection1s: number;
  adverseSelection3s: number;
  adverseSelection5s: number;
  grossPnlUsd: number;
  totalCostsUsd: number;
  realizedPnlUsd: number;
  placementSnapshot: MarketSnapshot;
  fillSnapshot: MarketSnapshot;
  startingBtc: number;
  endingBtc: number;
  startingUsdt: number;
  endingUsdt: number;
  queueAhead: number;
  queueConsumed: number;
  fillStatus: 'VALID' | 'INVALIDATED';
  invalidationReason?: string;
}

export interface MarketMakingInventoryState {
  mode: 'CASH_ONLY' | 'INVENTORY_SEEDED';
  symbol: string;
  baseInventoryQty: number;
  quoteBalanceUsd: number;
  startingBtcQty: number;
  startingQuoteUsd: number;
  totalPortfolioUsd: number;
  inventorySkew: number;
  avgCostBasisUsd: number;
  unrealizedPnlUsd: number;
  realizedPnlUsd: number;
}

// ============================================================================
// PART 4: MULTI-ASSET ADAPTIVE MICRO-SCALPER TYPES
// ============================================================================

export interface UniversePairInfo {
  rank: number;
  symbol: string;
  volume24hUsd: number;
  spreadPct: number;
  orderBookDepthUsd: number;
  tradeFrequencyPerSec: number;
  volatilityPct: number;
  liquidityScore: number;
  scalperScore: number;
  status: 'ACTIVE' | 'EXCLUDED' | 'PAUSED';
}

export type VolatilityRegime = 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export type WhyNotTradeReason =
  | 'EXPECTED_NET_PROFIT_TOO_LOW'
  | 'SPREAD_TOO_HIGH'
  | 'INSUFFICIENT_LIQUIDITY'
  | 'SIGNAL_SCORE_TOO_LOW'
  | 'MAX_POSITIONS_REACHED'
  | 'MAX_EXPOSURE_REACHED'
  | 'COOLDOWN_ACTIVE'
  | 'DAILY_LOSS_LIMIT_REACHED'
  | 'MARKET_DATA_STALE';

export interface ScalperFeatureSet {
  symbol: string;
  timestamp: number;
  midPrice: number;
  bidPrice: number;
  askPrice: number;
  spreadUsd: number;
  spreadPct: number;
  return100ms: number;
  return500ms: number;
  return1s: number;
  return5s: number;
  return10s: number;
  return30s: number;
  return60s: number;
  volatilityRegime: VolatilityRegime;
  adaptiveThresholdPct: number;
  imbalanceRatio: number;
  tradeFlowRatio: number;
}

export interface ScalperSignalCalc {
  id: string;
  timestamp: number;
  symbol: string;
  midPrice: number;
  entryAskPrice: number;
  positionNotionalUsd: number;
  expectedGrossMovementPct: number;
  expectedGrossUsd: number;
  entryFeeRatePct: number;
  entryFeeUsd: number;
  exitFeeRatePct: number;
  exitFeeUsd: number;
  spreadCostUsd: number;
  slippageCostUsd: number;
  latencyCostUsd: number;
  totalCostsUsd: number;
  expectedNetProfitPct: number;
  expectedNetProfitUsd: number;
  minRequiredNetUsd: number;
  scalperScore: number; // 0 - 100
  volatilityRegime: VolatilityRegime;
  isQualified: boolean;
  pipelineStatus: 'QUALIFIED_READY' | 'PAPER_ENTRY_TRIGGERED' | 'REJECTED_BY_RISK' | 'REJECTED_COST_TOO_HIGH' | 'REJECTED_SCORE_TOO_LOW' | 'REJECTED_SPREAD_TOO_HIGH';
  rejectionReason?: WhyNotTradeReason;
}

export interface ScalperTradeRecord {
  id: string;
  timestamp: number;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  holdingTimeMs: number;
  grossPnlUsd: number;
  feeUsd: number;
  slippageUsd: number;
  netPnlUsd: number;
  netPnlPct: number;
  scalperScore: number;
  volatilityRegime: VolatilityRegime;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MAX_HOLDING' | 'SIGNAL_REVERSAL' | 'RISK_LIMIT';
}

export interface ScalperBaselineRecord {
  id: string;
  timestamp: number;
  baselineType: 'FIXED_GRID' | 'RANDOM_ENTRY';
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  grossPnlUsd: number;
  feeUsd: number;
  slippageUsd: number;
  netPnlUsd: number;
  netPnlPct: number;
}

export interface StrategyMetricsSummary {
  strategyId: 'triangular' | 'microstructure' | 'market_making' | 'scalper' | 'btc_lead_lag';
  strategyName: string;
  virtualBalanceUsd: number;
  initialCapitalUsd: number;
  grossPnlUsd: number;
  totalFeesUsd: number;
  totalSlippageUsd: number;
  netPnlUsd: number;
  roiPct: number;
  totalTrades: number;
  winRatePct: number;
  profitFactor: number;
  maxDrawdownPct: number;
  avgTradeUsd: number;
  medianTradeUsd: number;
  status: 'RUNNING' | 'STOPPED' | 'STALE';
}

export interface ResearchExperimentRecord {
  id: string;
  name: string;
  strategyType: 'triangular' | 'microstructure' | 'market_making' | 'scalper' | 'btc_lead_lag';
  version: string;
  symbol: string;
  parametersJson: string;
  startingCapital: number;
  totalTrades: number;
  winRatePct: number;
  netPnlUsd: number;
  roiPct: number;
  maxDrawdownPct: number;
  notes?: string;
  createdAt: string;
}

export interface DashboardWsMessage {
  type:
    | 'TICK'
    | 'OPPORTUNITY'
    | 'PAPER_TRADE'
    | 'MICROSTRUCTURE_SIGNAL'
    | 'MICROSTRUCTURE_TRADE'
    | 'MARKET_MAKING_QUOTE'
    | 'MARKET_MAKING_FILL'
    | 'SCALPER_SIGNAL'
    | 'SCALPER_TRADE'
    | 'BTC_LEAD_LAG_SIGNAL'
    | 'BTC_LEAD_LAG_TRADE'
    | 'BTC_SHOCK_EVENT'
    | 'UNIVERSE_UPDATE'
    | 'STATUS'
    | 'LOG'
    | 'COUNTERS';
  data: any;
}

export interface BtcShockFeatureSet {
  symbol: 'BTCUSDT';
  timestamp: number;
  price: number;
  return50ms: number;
  return100ms: number;
  return250ms: number;
  return500ms: number;
  return1s: number;
  return2s: number;
  return3s: number;
  return5s: number;
  return10s: number;
  return30s: number;
  return60s: number;
  volatility: number;
  btcShockScore: number;
  marketRegime:
    | 'LOW_VOLATILITY'
    | 'NORMAL'
    | 'HIGH_VOLATILITY'
    | 'EXTREME_VOLATILITY'
    | 'BTC_TRENDING'
    | 'BTC_RANGING'
    | 'BTC_SHOCK'
    | 'BTC_RECOVERY';
  tradeVelocity: number;
  bookImbalance: number;
}

export interface FollowerBetaMetrics {
  symbol: string;
  beta1m: number;
  beta5m: number;
  beta15m: number;
  beta30m: number;
  beta1h: number;
  beta4h: number;
  beta24h: number;
}

export interface BtcLeadLagSignalCalc {
  id: string;
  symbol: string;
  timestamp: number;
  btcReturn1sPct: number;
  followerReturn1sPct: number;
  rollingBeta: number;
  expectedReturnPct: number;
  actualReturnPct: number;
  residualPct: number;
  modelType: 'LEAD_LAG_MOMENTUM' | 'RELATIVE_VALUE_MEAN_REVERSION';
  direction: 'LONG' | 'SHORT' | 'NO_TRADE';
  executionMode: 'SPOT_LONG' | 'FUTURES_SHORT';
  leadLagScore: number;
  isQualified: boolean;
  positionNotionalUsd: number;
  expectedGrossUsd: number;
  entryFeeUsd: number;
  exitFeeUsd: number;
  spreadCostUsd: number;
  slippageCostUsd: number;
  latencyCostUsd: number;
  totalCostsUsd: number;
  expectedNetProfitUsd: number;
  minRequiredNetProfitUsd: number;
  pipelineStatus: 'PAPER_ENTRY_TRIGGERED' | 'QUALIFIED_READY' | 'REJECTED_BY_RISK' | 'REJECTED_COST_TOO_HIGH';
  rejectionReason?: string;
  orderBookConfirmed: boolean;
  tradeFlowConfirmed: boolean;
}

export interface BtcLeadLagTradeRecord {
  id: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  modelType: 'LEAD_LAG_MOMENTUM' | 'RELATIVE_VALUE_MEAN_REVERSION';
  executionMode: 'SPOT_LONG' | 'FUTURES_SHORT';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  positionNotionalUsd: number;
  expectedGrossUsd: number;
  totalCostsUsd: number;
  expectedNetProfitUsd: number;
  signalScore: number;
  btcShockScore: number;
  followerBeta: number;
  expectedReturnPct: number;
  actualReturnPct: number;
  residualPct: number;
  grossPnlUsd: number;
  feeUsd: number;
  slippageUsd: number;
  netPnlUsd: number;
  netPnlPct: number;
  exitReason: string;
  entryTimestamp: number;
  exitTimestamp: number;
  holdingTimeMs: number;
}

export interface LeadLagMatrixCell {
  followerSymbol: string;
  delayMs: number;
  correlation: number;
  directionalAccuracy: number;
  conditionalAvgReturnPct: number;
  sampleCount: number;
  expectedValueAfterCostsUsd: number;
}

export interface BtcLeadLagEventRecord {
  id: string;
  eventId: string;
  timestamp: number;
  btcReturn100ms: number;
  btcReturn1s: number;
  btcReturn5s: number;
  btcVolatility: number;
  btcVolume: number;
  btcShockScore: number;
  marketRegime: string;
  followerSymbol: string;
  followerReturn: number;
  followerBeta: number;
  expectedReturn: number;
  residual: number;
  tPlus100ms?: number;
  tPlus250ms?: number;
  tPlus500ms?: number;
  tPlus1s?: number;
  tPlus2s?: number;
  tPlus3s?: number;
  tPlus5s?: number;
  tPlus10s?: number;
}

export interface SystemStatusState {
  binanceWsConnected?: boolean;
  demoMode?: boolean;
  marketDataAgeMs?: number;
  discoveredCyclesCount?: number;
  activePairsCount?: number;
  uptimeSeconds?: number;
  [key: string]: any;
}

