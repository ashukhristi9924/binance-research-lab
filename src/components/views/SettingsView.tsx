import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Settings, Save, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [form, setForm] = useState({
    startingCapital: 10000,
    minNetProfitPct: 0.05,
    minNetProfitUsd: 0.50,
    maxTradeSize: 5000,
    makerFeePct: 0.075,
    takerFeePct: 0.10,
    maxAllowedSlippagePct: 0.20,
    minLiquidityUsd: 100,
    simulatedLatencyMs: 75,
    enablePaperTrading: true,
    enableOpportunityDetection: true,
    demoMode: false,
  });

  const [saved, setSaved] = useState(false);
  const [resetAccountModal, setResetAccountModal] = useState(false);
  const [resetAllModal, setResetAllModal] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setForm({
            startingCapital: data.startingCapital || 10000,
            minNetProfitPct: data.minNetProfitPct || 0.05,
            minNetProfitUsd: data.minNetProfitUsd || 0.50,
            maxTradeSize: data.maxTradeSize || 5000,
            makerFeePct: data.makerFeePct || 0.075,
            takerFeePct: data.takerFeePct || 0.10,
            maxAllowedSlippagePct: data.maxAllowedSlippagePct || 0.20,
            minLiquidityUsd: data.minLiquidityUsd || 100,
            simulatedLatencyMs: data.simulatedLatencyMs || 75,
            enablePaperTrading: data.enablePaperTrading ?? true,
            enableOpportunityDetection: data.enableOpportunityDetection ?? true,
            demoMode: data.demoMode ?? false,
          });
        }
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleResetAccount = async () => {
    await fetch('/api/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'account', startingCapital: form.startingCapital }),
    });
    setResetAccountModal(false);
  };

  const handleResetAll = async () => {
    await fetch('/api/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'all' }),
    });
    setResetAllModal(false);
  };

  return (
    <div className="space-y-6">
      <Card
        title={
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-cyan-400" />
            <span>RESEARCH STRATEGY & ENGINE CONTROLS</span>
          </div>
        }
        subtitle="Configure virtual capital, fee assumptions, slippage limits, latency models, and execution rules"
      >
        <form onSubmit={handleSave} className="space-y-6 font-mono text-xs">
          {saved && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Strategy settings updated successfully and applied to active research engine.</span>
            </div>
          )}

          {/* Section 1: Capital & Account */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-200 border-b border-panel-300 pb-2 text-sm text-cyan-400">
              1. VIRTUAL PAPER ACCOUNT SETTINGS
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-gray-400 block mb-1">Starting Virtual Capital ($ USDT)</label>
                <input
                  type="number"
                  value={form.startingCapital}
                  onChange={(e) => setForm({ ...form, startingCapital: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-panel-200 border border-panel-300 rounded-lg text-gray-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Maximum Trade Size ($ USDT)</label>
                <input
                  type="number"
                  value={form.maxTradeSize}
                  onChange={(e) => setForm({ ...form, maxTradeSize: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-panel-200 border border-panel-300 rounded-lg text-gray-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Simulated Latency Delay (ms)</label>
                <input
                  type="number"
                  value={form.simulatedLatencyMs}
                  onChange={(e) => setForm({ ...form, simulatedLatencyMs: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 bg-panel-200 border border-panel-300 rounded-lg text-gray-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Fee & Slippage Assumptions */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-200 border-b border-panel-300 pb-2 text-sm text-cyan-400">
              2. TRADING FEE & SLIPPAGE ASSUMPTIONS
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-gray-400 block mb-1">Spot Maker Fee (%)</label>
                <input
                  type="number"
                  step="0.001"
                  value={form.makerFeePct}
                  onChange={(e) => setForm({ ...form, makerFeePct: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-panel-200 border border-panel-300 rounded-lg text-gray-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Spot Taker Fee (%)</label>
                <input
                  type="number"
                  step="0.001"
                  value={form.takerFeePct}
                  onChange={(e) => setForm({ ...form, takerFeePct: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-panel-200 border border-panel-300 rounded-lg text-gray-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Maximum Allowed Slippage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.maxAllowedSlippagePct}
                  onChange={(e) => setForm({ ...form, maxAllowedSlippagePct: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-panel-200 border border-panel-300 rounded-lg text-gray-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Paper Trade Qualification Thresholds */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-200 border-b border-panel-300 pb-2 text-sm text-cyan-400">
              3. PAPER EXECUTION THRESHOLDS
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 block mb-1">Minimum Net Profit Required (%)</label>
                <input
                  type="number"
                  step="0.001"
                  value={form.minNetProfitPct}
                  onChange={(e) => setForm({ ...form, minNetProfitPct: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-panel-200 border border-panel-300 rounded-lg text-gray-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Minimum Net Profit Required ($ USDT)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.minNetProfitUsd}
                  onChange={(e) => setForm({ ...form, minNetProfitUsd: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-panel-200 border border-panel-300 rounded-lg text-gray-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Engine Toggles */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-200 border-b border-panel-300 pb-2 text-sm text-cyan-400">
              4. ENGINE & DATA STREAM TOGGLES
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-3 p-3 bg-panel-200/50 rounded-lg border border-panel-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enablePaperTrading}
                  onChange={(e) => setForm({ ...form, enablePaperTrading: e.target.checked })}
                  className="w-4 h-4 text-cyan-500 rounded border-panel-400 bg-panel-100"
                />
                <span>Enable Paper Trading</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-panel-200/50 rounded-lg border border-panel-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enableOpportunityDetection}
                  onChange={(e) => setForm({ ...form, enableOpportunityDetection: e.target.checked })}
                  className="w-4 h-4 text-cyan-500 rounded border-panel-400 bg-panel-100"
                />
                <span>Enable Arbitrage Scanner</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-panel-200/50 rounded-lg border border-panel-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.demoMode}
                  onChange={(e) => setForm({ ...form, demoMode: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded border-panel-400 bg-panel-100"
                />
                <span className="text-amber-400">DEMO MODE (Simulated Ticker Feed)</span>
              </label>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-panel-300">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" /> Save Strategy Controls
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setResetAccountModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> RESET PAPER ACCOUNT
              </button>

              <button
                type="button"
                onClick={() => setResetAllModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> RESET ALL RESEARCH DATA
              </button>
            </div>
          </div>
        </form>
      </Card>

      {/* Confirmation Modal 1: Reset Paper Account */}
      <Modal isOpen={resetAccountModal} onClose={() => setResetAccountModal(false)} title="CONFIRM: RESET PAPER ACCOUNT">
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to reset the Paper Trading account? This will reset the virtual balance to ${form.startingCapital} USDT and clear executed trade history.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-panel-300">
            <button
              onClick={() => setResetAccountModal(false)}
              className="px-4 py-2 bg-panel-200 hover:bg-panel-300 text-gray-300 rounded-lg"
            >
              Cancel
            </button>
            <button onClick={handleResetAccount} className="px-4 py-2 bg-amber-500 text-black font-bold rounded-lg">
              Confirm Reset Account
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal 2: Reset All Research Data */}
      <Modal isOpen={resetAllModal} onClose={() => setResetAllModal(false)} title="CONFIRM: RESET ALL RESEARCH DATA">
        <div className="space-y-4">
          <p className="text-rose-300 font-bold">
            WARNING: This will permanently delete all recorded arbitrage opportunities, paper trades, trade legs, research logs, and performance metrics from the database.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-panel-300">
            <button onClick={() => setResetAllModal(false)} className="px-4 py-2 bg-panel-200 hover:bg-panel-300 text-gray-300 rounded-lg">
              Cancel
            </button>
            <button onClick={handleResetAll} className="px-4 py-2 bg-rose-500 text-white font-bold rounded-lg">
              Confirm Reset All Data
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
