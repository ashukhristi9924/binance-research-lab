import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { PaperTradeRecord } from '../../lib/types';
import { Download, Eye } from 'lucide-react';

interface TradeHistoryViewProps {
  trades: PaperTradeRecord[];
}

export const TradeHistoryView: React.FC<TradeHistoryViewProps> = ({ trades }) => {
  const [selectedTrade, setSelectedTrade] = useState<PaperTradeRecord | null>(null);

  const exportCsv = () => {
    window.open('/api/export?type=trades', '_blank');
  };

  return (
    <div className="space-y-6">
      <Card
        title="PAPER TRADE HISTORY"
        subtitle="Complete persistent ledger of all simulated trades with per-leg execution logs"
        action={
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-mono text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-panel-300 text-gray-400 pb-2">
                <th className="pb-2">TRADE ID</th>
                <th className="pb-2">DATE & TIME</th>
                <th className="pb-2">PATH</th>
                <th className="pb-2">CAPITAL</th>
                <th className="pb-2">GROSS P&L</th>
                <th className="pb-2">FEES</th>
                <th className="pb-2">SLIPPAGE</th>
                <th className="pb-2">NET P&L</th>
                <th className="pb-2">RETURN</th>
                <th className="pb-2">STATUS</th>
                <th className="pb-2 text-right">DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-300/40">
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-6 text-center text-gray-500">
                    No trade history records found.
                  </td>
                </tr>
              ) : (
                trades.map((t) => (
                  <tr key={t.id} className="hover:bg-panel-200/50 transition-colors">
                    <td className="py-2.5 text-gray-400 font-mono text-[11px]">{t.id.slice(0, 12)}...</td>
                    <td className="py-2.5 text-gray-300">{new Date(t.timestamp).toLocaleString()}</td>
                    <td className="py-2.5 font-bold text-cyan-400">{t.cyclePath}</td>
                    <td className="py-2.5 text-gray-300">${t.startingCapitalUsd}</td>
                    <td className="py-2.5 text-gray-200">+${t.grossProfitUsd.toFixed(2)}</td>
                    <td className="py-2.5 text-rose-400">-${t.totalFeesUsd.toFixed(2)}</td>
                    <td className="py-2.5 text-amber-400">-${t.totalSlippageUsd.toFixed(2)}</td>
                    <td className={`py-2.5 font-bold ${t.netProfitUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.netProfitUsd >= 0 ? '+' : ''}${t.netProfitUsd.toFixed(2)}
                    </td>
                    <td className={`py-2.5 font-bold ${t.netProfitPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.netProfitPct >= 0 ? '+' : ''}{t.netProfitPct.toFixed(2)}%
                    </td>
                    <td className="py-2.5">
                      <Badge classification={t.status} />
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => setSelectedTrade(t)}
                        className="px-2 py-1 bg-panel-200 hover:bg-panel-300 text-gray-300 rounded border border-panel-300 text-[11px] flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3 h-3 text-cyan-400" /> Legs
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={selectedTrade !== null}
        onClose={() => setSelectedTrade(null)}
        title={`PAPER TRADE BREAKDOWN: ${selectedTrade?.cyclePath}`}
      >
        {selectedTrade && (
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-2 gap-4 p-3 bg-panel-200/50 rounded-lg border border-panel-300">
              <div>
                <span className="text-gray-400 block">Starting Capital:</span>
                <span className="text-gray-200 font-bold">${selectedTrade.startingCapitalUsd}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Final Balance:</span>
                <span className="text-gray-200 font-bold">${selectedTrade.finalBalanceUsd}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Gross Profit:</span>
                <span className="text-emerald-400 font-bold">+${selectedTrade.grossProfitUsd.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Net Profit:</span>
                <span className={`font-bold ${selectedTrade.netProfitUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  +${selectedTrade.netProfitUsd.toFixed(4)} (+{selectedTrade.netProfitPct.toFixed(2)}%)
                </span>
              </div>
            </div>

            <h4 className="font-bold text-gray-200 pt-2 border-t border-panel-300">3-LEG CONVERSION STEPS</h4>
            <div className="space-y-2">
              {selectedTrade.legs.map((leg, idx) => (
                <div key={idx} className="p-3 bg-panel-200/30 rounded border border-panel-300">
                  <div className="flex items-center justify-between font-bold text-cyan-400 mb-1">
                    <span>LEG #{leg.legIndex}: {leg.symbol} ({leg.action || (leg as any).side})</span>
                    <span>{leg.fromAsset} → {leg.toAsset}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-gray-400 text-[11px]">
                    <div>Top Book Price: {leg.topBookPrice}</div>
                    <div>VWAP Price: {leg.vwapPrice}</div>
                    <div>Input Qty: {leg.inputQty.toFixed(4)}</div>
                    <div>Output Qty: {leg.outputQty.toFixed(4)}</div>
                    <div className="text-rose-400">Fee: ${leg.feeUsd.toFixed(4)}</div>
                    <div className="text-amber-400">Slippage: ${leg.slippageUsd.toFixed(4)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
