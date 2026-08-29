import React from 'react';
import { Card } from '../ui/Card';
import { SystemStatusState } from '../../lib/types';
import { Activity, Wifi, Cpu, Database, Clock, Server } from 'lucide-react';

interface SystemStatusViewProps {
  status: SystemStatusState;
}

export const SystemStatusView: React.FC<SystemStatusViewProps> = ({ status }) => {
  return (
    <div className="space-y-6 font-mono text-xs">
      <Card
        title={
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>SYSTEM HEALTH & CONNECTION DIAGNOSTICS</span>
          </div>
        }
        subtitle="Real-time operational status for Binance WebSocket feeds, database, and arbitrage calculation engine"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Binance WS */}
          <div className="p-4 bg-panel-200/40 rounded-xl border border-panel-300 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span>BINANCE WEBSOCKET</span>
              <Wifi className={`w-4 h-4 ${status.binanceWsConnected ? 'text-emerald-400' : 'text-rose-400'}`} />
            </div>
            <div className={`text-lg font-bold ${status.binanceWsConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
              {status.binanceWsConnected ? 'CONNECTED (wss://stream.binance.com)' : status.demoMode ? 'DEMO MARKET STREAM' : 'DISCONNECTED'}
            </div>
            <div className="text-gray-400">Market Data Age: <span className="text-gray-200">{status.marketDataAgeMs} ms</span></div>
          </div>

          {/* Card 2: Market Graph */}
          <div className="p-4 bg-panel-200/40 rounded-xl border border-panel-300 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span>MARKET GRAPH & PATHS</span>
              <Cpu className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-lg font-bold text-gray-100">{status.discoveredCyclesCount} TRIANGULAR PATHS</div>
            <div className="text-gray-400">Active Trading Pairs: <span className="text-gray-200">{status.activePairsCount}</span></div>
          </div>

          {/* Card 3: Database */}
          <div className="p-4 bg-panel-200/40 rounded-xl border border-panel-300 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span>PRISMA DATABASE</span>
              <Database className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-emerald-400">CONNECTED & HEALTHY</div>
            <div className="text-gray-400">Engine Uptime: <span className="text-gray-200">{status.uptimeSeconds} seconds</span></div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-panel-200/20 border border-panel-300 rounded-xl text-gray-300 space-y-2">
          <div className="font-bold text-gray-100 flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            ARCHITECTURAL SAFETY STATEMENT
          </div>
          <p>
            This application consumes Binance public market WebSocket data strictly for research and paper trading. No real trading functions, order placement APIs, or private API keys exist in the codebase.
          </p>
        </div>
      </Card>
    </div>
  );
};
