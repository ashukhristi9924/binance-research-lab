import React from 'react';
import { Card } from '../ui/Card';
import { Terminal, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';

interface DebugPanelProps {
  status: any;
  opportunitiesCount: number;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ status, opportunitiesCount }) => {
  const symbolUpdates = status.symbolUpdates || {};
  const btc = symbolUpdates['BTCUSDT'];
  const eth = symbolUpdates['ETHUSDT'];
  const ethbtc = symbolUpdates['ETHBTC'];

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>MARKET DATA CONNECTION & DEBUG PANEL</span>
        </div>
      }
      subtitle="Real-time websocket pipeline diagnostics & stream health"
      className="border-cyan-500/30"
    >
      <div className="space-y-4 font-mono text-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-2.5 bg-panel-200/50 rounded border border-panel-300">
            <span className="text-gray-400 block text-[10px]">CONNECTION STATE</span>
            <span className={`font-bold text-sm ${status.connected ? 'text-emerald-400' : 'text-rose-400'}`}>
              {status.mode === 'live' ? (status.connected ? 'LIVE BINANCE STREAM' : 'DISCONNECTED') : 'DEMO MODE'}
            </span>
          </div>

          <div className="p-2.5 bg-panel-200/50 rounded border border-panel-300">
            <span className="text-gray-400 block text-[10px]">SUBSCRIBED STREAMS</span>
            <span className="font-bold text-sm text-cyan-400">{status.symbols || 3} Streams</span>
          </div>

          <div className="p-2.5 bg-panel-200/50 rounded border border-panel-300">
            <span className="text-gray-400 block text-[10px]">MESSAGES RECEIVED</span>
            <span className="font-bold text-sm text-gray-200">{(status.messagesReceived || 0).toLocaleString()}</span>
          </div>

          <div className="p-2.5 bg-panel-200/50 rounded border border-panel-300">
            <span className="text-gray-400 block text-[10px]">DATA AGE</span>
            <span className={`font-bold text-sm ${status.dataAgeMs < 2000 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {status.dataAgeMs} ms
            </span>
          </div>
        </div>

        {/* Stream URL */}
        <div className="p-2 bg-black/60 rounded border border-panel-300 text-[11px] flex items-center justify-between text-gray-300 overflow-x-auto">
          <span className="text-gray-400 font-bold mr-2">WEBSOCKET ENDPOINT:</span>
          <span className="text-cyan-300 font-mono truncate">{status.streamUrl || 'wss://stream.binance.com:9443/stream?streams=btcusdt@bookTicker/ethusdt@bookTicker/ethbtc@bookTicker'}</span>
        </div>

        {/* 3 Core Pair Updates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-panel-200/30 rounded border border-panel-300">
            <div className="flex justify-between items-center font-bold text-gray-200 mb-1">
              <span>BTCUSDT</span>
              <span className="text-[10px] text-gray-400">{btc ? `${btc.ageMs}ms ago` : 'Waiting tick...'}</span>
            </div>
            {btc ? (
              <div className="text-[11px] space-y-0.5">
                <div className="text-emerald-400">Bid: {btc.bid}</div>
                <div className="text-rose-400">Ask: {btc.ask}</div>
              </div>
            ) : (
              <div className="text-gray-500 italic">No update yet</div>
            )}
          </div>

          <div className="p-3 bg-panel-200/30 rounded border border-panel-300">
            <div className="flex justify-between items-center font-bold text-gray-200 mb-1">
              <span>ETHUSDT</span>
              <span className="text-[10px] text-gray-400">{eth ? `${eth.ageMs}ms ago` : 'Waiting tick...'}</span>
            </div>
            {eth ? (
              <div className="text-[11px] space-y-0.5">
                <div className="text-emerald-400">Bid: {eth.bid}</div>
                <div className="text-rose-400">Ask: {eth.ask}</div>
              </div>
            ) : (
              <div className="text-gray-500 italic">No update yet</div>
            )}
          </div>

          <div className="p-3 bg-panel-200/30 rounded border border-panel-300">
            <div className="flex justify-between items-center font-bold text-gray-200 mb-1">
              <span>ETHBTC</span>
              <span className="text-[10px] text-gray-400">{ethbtc ? `${ethbtc.ageMs}ms ago` : 'Waiting tick...'}</span>
            </div>
            {ethbtc ? (
              <div className="text-[11px] space-y-0.5">
                <div className="text-emerald-400">Bid: {ethbtc.bid}</div>
                <div className="text-rose-400">Ask: {ethbtc.ask}</div>
              </div>
            ) : (
              <div className="text-gray-500 italic">No update yet</div>
            )}
          </div>
        </div>

        {/* Technical Error Notice if any */}
        {status.error && (
          <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-lg text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">WEBSOCKET CONNECTION ERROR:</span>
              <span>{status.error}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
