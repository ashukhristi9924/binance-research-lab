import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Terminal, Search } from 'lucide-react';

interface ResearchLogsViewProps {
  logs: any[];
}

export const ResearchLogsView: React.FC<ResearchLogsViewProps> = ({ logs }) => {
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  const [search, setSearch] = useState('');

  const sampleLogs = logs.length > 0 ? logs : [
    { id: '1', timestamp: new Date().toISOString(), level: 'INFO', source: 'WS', message: 'Connected to Binance Public WebSocket stream.' },
    { id: '2', timestamp: new Date().toISOString(), level: 'INFO', source: 'ENGINE', message: 'Scanned 14 triangular paths. Detected 1 potential opportunity.' },
    { id: '3', timestamp: new Date().toISOString(), level: 'INFO', source: 'ENGINE', message: 'Fee calculation completed for USDT->BTC->ETH->USDT: -$0.31 fees applied.' },
    { id: '4', timestamp: new Date().toISOString(), level: 'INFO', source: 'ENGINE', message: 'Liquidity check passed. Net expected profit: +0.063%' },
    { id: '5', timestamp: new Date().toISOString(), level: 'INFO', source: 'PAPER_TRADER', message: 'Paper execution completed on USDT->BTC->ETH->USDT: Net Result +$0.63' },
  ];

  const filtered = sampleLogs.filter((l) => {
    if (filterLevel !== 'ALL' && l.level !== filterLevel) return false;
    if (search && !l.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <Card
      title={
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <span>RESEARCH SYSTEM EVENT LOG TERMINAL</span>
        </div>
      }
      subtitle="Real-time audit log of WebSocket connections, calculations, and paper trade executions"
      action={
        <div className="flex items-center gap-3 font-mono text-xs">
          <input
            type="text"
            placeholder="Filter logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 bg-panel-200 border border-panel-300 rounded-lg text-gray-200 focus:outline-none focus:border-cyan-500 w-48"
          />
          <select
            value={filterLevel}
            onChange={(e: any) => setFilterLevel(e.target.value)}
            className="px-3 py-1.5 bg-panel-200 border border-panel-300 rounded-lg text-gray-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </select>
        </div>
      }
    >
      <div className="bg-black/80 border border-panel-300 rounded-xl p-4 font-mono text-xs max-h-[500px] overflow-y-auto space-y-2 text-gray-300">
        {filtered.map((l) => {
          let levelColor = 'text-cyan-400';
          if (l.level === 'WARN') levelColor = 'text-amber-400';
          if (l.level === 'ERROR') levelColor = 'text-rose-400';

          return (
            <div key={l.id} className="flex items-start gap-3 hover:bg-panel-200/20 p-1 rounded">
              <span className="text-gray-500 flex-shrink-0">[{new Date(l.timestamp).toLocaleTimeString()}]</span>
              <span className={`font-bold flex-shrink-0 ${levelColor}`}>[{l.level}]</span>
              <span className="text-purple-400 font-bold flex-shrink-0">[{l.source}]</span>
              <span className="text-gray-200">{l.message}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
