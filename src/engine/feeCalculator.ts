export interface FeeResult {
  grossNotionalUsd: number;
  feeAmount: number;
  netAmount: number;
  feeUsd: number;
  feePercentage: number;
}

export class FeeCalculator {
  /**
   * Calculates fee in USD for a given gross notional value and fee percentage.
   */
  public static calculateFeeUsd(grossNotionalUsd: number, feePct: number): number {
    if (grossNotionalUsd <= 0 || feePct < 0) return 0;
    return Number((grossNotionalUsd * (feePct / 100)).toFixed(4));
  }

  /**
   * Calculates trading fee for a single trade leg based on actual executed notional value.
   */
  public static calculateLegFee(
    grossAmount: number,
    feePct: number,
    unitPriceInUsd: number = 1.0
  ): FeeResult {
    if (grossAmount <= 0 || feePct < 0) {
      return {
        grossNotionalUsd: Math.max(0, grossAmount * unitPriceInUsd),
        feeAmount: 0,
        netAmount: Math.max(0, grossAmount),
        feeUsd: 0,
        feePercentage: feePct,
      };
    }

    const feeAmount = grossAmount * (feePct / 100);
    const netAmount = grossAmount - feeAmount;
    const grossNotionalUsd = grossAmount * unitPriceInUsd;
    const feeUsd = feeAmount * unitPriceInUsd;

    return {
      grossNotionalUsd: Number(grossNotionalUsd.toFixed(4)),
      feeAmount: Number(feeAmount.toFixed(8)),
      netAmount: Number(netAmount.toFixed(8)),
      feeUsd: Number(feeUsd.toFixed(4)),
      feePercentage: feePct,
    };
  }

  public static calculateTotalFees(
    leg1FeeUsd: number,
    leg2FeeUsd: number,
    leg3FeeUsd: number
  ): number {
    return Number((leg1FeeUsd + leg2FeeUsd + leg3FeeUsd).toFixed(4));
  }
}
