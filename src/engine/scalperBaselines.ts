import { ScalperBaselineRecord } from '../lib/types';

export class ScalperBaselinesEngine {
  private gridThresholdPct: number = 0.02; // 0.02% grid step
  private takerFeePct: number = 0.10;      // 0.10% spot taker fee

  /**
   * Evaluates Fixed Micro Grid baseline strategy on price change.
   */
  public evaluateFixedGrid(
    symbol: string,
    currentPrice: number,
    priceChangePct: number
  ): ScalperBaselineRecord | null {
    if (Math.abs(priceChangePct) < this.gridThresholdPct) return null;

    const isBuy = priceChangePct <= -this.gridThresholdPct;
    const exitPrice = isBuy ? currentPrice * (1 + this.gridThresholdPct) : currentPrice * (1 - this.gridThresholdPct);
    const quantity = Number((1000 / currentPrice).toFixed(6));

    const grossPnlUsd = (exitPrice - currentPrice) * quantity;
    const feeUsd = (1000 * (this.takerFeePct / 100)) * 2;
    const slippageUsd = 0.10;
    const netPnlUsd = Number((grossPnlUsd - feeUsd - slippageUsd).toFixed(4));
    const netPnlPct = Number(((netPnlUsd / 1000) * 100).toFixed(4));

    return {
      id: `grid-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      baselineType: 'FIXED_GRID',
      symbol,
      entryPrice: currentPrice,
      exitPrice: Number(exitPrice.toFixed(4)),
      quantity,
      grossPnlUsd: Number(grossPnlUsd.toFixed(4)),
      feeUsd: Number(feeUsd.toFixed(4)),
      slippageUsd,
      netPnlUsd,
      netPnlPct,
    };
  }

  /**
   * Evaluates Random Entry baseline strategy.
   */
  public evaluateRandomBaseline(
    symbol: string,
    currentPrice: number
  ): ScalperBaselineRecord | null {
    if (Math.random() > 0.05) return null; // 5% random entry probability

    const exitDevPct = (Math.random() - 0.5) * 0.06; // random +/- 0.03% move
    const exitPrice = currentPrice * (1 + exitDevPct);
    const quantity = Number((1000 / currentPrice).toFixed(6));

    const grossPnlUsd = (exitPrice - currentPrice) * quantity;
    const feeUsd = (1000 * (this.takerFeePct / 100)) * 2;
    const slippageUsd = 0.10;
    const netPnlUsd = Number((grossPnlUsd - feeUsd - slippageUsd).toFixed(4));
    const netPnlPct = Number(((netPnlUsd / 1000) * 100).toFixed(4));

    return {
      id: `rnd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      baselineType: 'RANDOM_ENTRY',
      symbol,
      entryPrice: currentPrice,
      exitPrice: Number(exitPrice.toFixed(4)),
      quantity,
      grossPnlUsd: Number(grossPnlUsd.toFixed(4)),
      feeUsd: Number(feeUsd.toFixed(4)),
      slippageUsd,
      netPnlUsd,
      netPnlPct,
    };
  }
}
