import { OrderBookLevel, SymbolSide } from '../lib/types';

export interface VwapResult {
  vwapPrice: number;
  topBookPrice: number;
  executedQty: number;
  requiredQty: number;
  availableQty: number;
  shortfallQty: number;
  totalCostQuote: number;
  slippagePct: number;
  slippageUsd: number;
  sufficientLiquidity: boolean;
}

export class SlippageModel {
  /**
   * Consumes liquidity across order book depth levels to calculate VWAP execution price.
   * 
   * @param side 'BUY' (consumes asks) or 'SELL' (consumes bids)
   * @param levels Order book levels (asks sorted ascending price, bids sorted descending price)
   * @param targetVolume Required volume to execute (in base asset for BUY/SELL or quote equivalent)
   * @param isTargetInQuote If true, targetVolume is in quote asset (e.g. spend 10,000 USDT to buy BTC)
   * @param unitPriceInUsd Conversion factor to USD for slippage USD calculation
   */
  public static calculateVwapExecution(
    side: SymbolSide,
    levels: OrderBookLevel[],
    targetVolume: number,
    isTargetInQuote: boolean = false,
    unitPriceInUsd: number = 1.0
  ): VwapResult {
    if (!levels || levels.length === 0 || targetVolume <= 0) {
      return {
        vwapPrice: 0,
        topBookPrice: 0,
        executedQty: 0,
        requiredQty: targetVolume,
        availableQty: 0,
        shortfallQty: targetVolume,
        totalCostQuote: 0,
        slippagePct: 0,
        slippageUsd: 0,
        sufficientLiquidity: false,
      };
    }

    const topBookPrice = levels[0].price;
    let remainingToFill = targetVolume;
    let totalBaseFilled = 0;
    let totalQuoteSpent = 0;
    let totalAvailable = 0;

    for (const lvl of levels) {
      if (lvl.price <= 0 || lvl.qty <= 0) continue;

      const levelCapacity = isTargetInQuote ? lvl.qty * lvl.price : lvl.qty;
      totalAvailable += levelCapacity;

      if (remainingToFill <= 0) continue;

      if (isTargetInQuote) {
        // Target is quote asset (e.g. spend 10,000 USDT to buy BTC at price P)
        const quoteToTake = Math.min(remainingToFill, lvl.qty * lvl.price);
        const baseToTake = quoteToTake / lvl.price;

        totalBaseFilled += baseToTake;
        totalQuoteSpent += quoteToTake;
        remainingToFill -= quoteToTake;
      } else {
        // Target is base asset (e.g. sell 1.25 BTC for USDT at price P)
        const baseToTake = Math.min(remainingToFill, lvl.qty);
        const quoteToTake = baseToTake * lvl.price;

        totalBaseFilled += baseToTake;
        totalQuoteSpent += quoteToTake;
        remainingToFill -= baseToTake;
      }
    }

    const shortfallQty = Math.max(0, remainingToFill);
    const sufficientLiquidity = shortfallQty <= 0.00000001;
    const vwapPrice = totalBaseFilled > 0 ? totalQuoteSpent / totalBaseFilled : topBookPrice;

    // Slippage calculation relative to top of book
    let slippagePct = 0;
    if (topBookPrice > 0) {
      if (side === 'BUY') {
        // Buying: higher VWAP than top ask means positive slippage cost
        slippagePct = ((vwapPrice - topBookPrice) / topBookPrice) * 100;
      } else {
        // Selling: lower VWAP than top bid means positive slippage cost
        slippagePct = ((topBookPrice - vwapPrice) / topBookPrice) * 100;
      }
    }

    slippagePct = Math.max(0, slippagePct);
    const baseNotional = isTargetInQuote ? targetVolume : targetVolume * topBookPrice;
    const slippageUsd = (slippagePct / 100) * baseNotional * unitPriceInUsd;

    return {
      vwapPrice: Number(vwapPrice.toFixed(8)),
      topBookPrice,
      executedQty: Number(totalBaseFilled.toFixed(8)),
      requiredQty: Number(targetVolume.toFixed(8)),
      availableQty: Number(totalAvailable.toFixed(8)),
      shortfallQty: Number(shortfallQty.toFixed(8)),
      totalCostQuote: Number(totalQuoteSpent.toFixed(8)),
      slippagePct: Number(slippagePct.toFixed(4)),
      slippageUsd: Number(slippageUsd.toFixed(4)),
      sufficientLiquidity,
    };
  }
}
