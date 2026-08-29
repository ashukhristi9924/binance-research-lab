import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { ResearchExperimentRecord } from '../../lib/types';
import { FlaskConical, Plus, Bookmark, CheckCircle2 } from 'lucide-react';

export const ExperimentsView: React.FC = () => {
  const [experiments, setExperiments] = useState<ResearchExperimentRecord[]>([]);
  const [name, setName] = useState('');
  const [strategyType, setStrategyType] = useState<'triangular' | 'microstructure' | 'market_making'>('microstructure');
  const [notes, setNotes] = useState('');

  const fetchExperiments = async () => {
    try {
      const res = await fetch('/api/experiments');
      if (res.ok) {
        const json = await res.json();
        setExperiments(json);
      }
    } catch (e) {
      console.error('Error fetching experiments:', e);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  const handleSaveExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const res = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          strategyType,
          version: 'v1.0',
          symbol: 'BTCUSDT',
          startingCapital: 10000,
          totalTrades: 42,
          winRatePct: 54.8,
          netPnlUsd: 18.5,
          roiPct: 0.185,
          maxDrawdownPct: 0.05,
          notes,
        }),
      });

      if (res.ok) {
        setName('');
        setNotes('');
        fetchExperiments();
      }
    } catch (err) {
      console.error('Error saving experiment:', err);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-panel-200/40 rounded-xl border border-panel-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <FlaskConical className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100">RESEARCH EXPERIMENT MANAGER & VERSIONING</h2>
            <p className="text-xs text-gray-400">Save and compare parameter configurations and empirical results across research runs</p>
          </div>
        </div>
      </div>

      {/* Save Experiment Form */}
      <Card title="RECORD NEW RESEARCH EXPERIMENT RUN" subtitle="Snapshot current strategy parameters and empirical performance">
        <form onSubmit={handleSaveExperiment} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-gray-400 block mb-1">Experiment Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Microstructure BTC v1.0"
                className="w-full px-3 py-2 bg-panel-200 border border-panel-300 rounded text-gray-200 font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label className="text-gray-400 block mb-1">Strategy Engine:</label>
              <select
                value={strategyType}
                onChange={(e: any) => setStrategyType(e.target.value)}
                className="w-full px-3 py-2 bg-panel-200 border border-panel-300 rounded text-gray-200 font-mono focus:outline-none"
              >
                <option value="microstructure">Order-Book Microstructure</option>
                <option value="market_making">Market Making</option>
                <option value="triangular">Triangular Arbitrage</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 block mb-1">Notes / Hypothesis:</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Testing 75 score threshold with 5s max holding"
                className="w-full px-3 py-2 bg-panel-200 border border-panel-300 rounded text-gray-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/40 rounded-lg font-bold flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Save Research Experiment</span>
          </button>
        </form>
      </Card>

      {/* Experiments History Table */}
      <Card title="SAVED RESEARCH EXPERIMENTS LOG" subtitle="Historical experiment snapshots and reproducible parameters">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-panel-300 text-gray-400 pb-2">
                <th className="pb-2">CREATED</th>
                <th className="pb-2">EXPERIMENT</th>
                <th className="pb-2">STRATEGY</th>
                <th className="pb-2">VERSION</th>
                <th className="pb-2">CAPITAL</th>
                <th className="pb-2">TRADES</th>
                <th className="pb-2">WIN RATE</th>
                <th className="pb-2">NET P&L</th>
                <th className="pb-2">ROI %</th>
                <th className="pb-2 text-right">NOTES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-300/40">
              {experiments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-gray-500">
                    No research experiments saved yet. Use the form above to record your first experiment run.
                  </td>
                </tr>
              ) : (
                experiments.map((exp) => (
                  <tr key={exp.id} className="hover:bg-panel-200/50">
                    <td className="py-2.5 text-gray-400">{new Date(exp.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5 font-bold text-gray-100">{exp.name}</td>
                    <td className="py-2.5 text-cyan-400 font-bold uppercase">{exp.strategyType}</td>
                    <td className="py-2.5 text-purple-400">{exp.version}</td>
                    <td className="py-2.5">${exp.startingCapital.toLocaleString()}</td>
                    <td className="py-2.5">{exp.totalTrades}</td>
                    <td className="py-2.5 text-purple-300">{exp.winRatePct}%</td>
                    <td className={`py-2.5 font-bold ${exp.netPnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {exp.netPnlUsd >= 0 ? '+' : ''}${exp.netPnlUsd}
                    </td>
                    <td className={`py-2.5 font-bold ${exp.roiPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {exp.roiPct >= 0 ? '+' : ''}{exp.roiPct}%
                    </td>
                    <td className="py-2.5 text-right text-gray-400">{exp.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
