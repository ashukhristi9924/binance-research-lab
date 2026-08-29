import React from 'react';
import {
  LayoutDashboard,
  GitCommit,
  Activity,
  Layers,
  Settings,
  Shield,
  Clock,
  PieChart,
  Brain,
  Scale,
  Zap,
  BookOpen,
  FlaskConical,
  Award,
  Sliders,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  status: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, status }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'strategies-overview', label: 'Strategies Overview', icon: Layers, badge: '5 STRATS' },
    { id: 'btc-lead-lag', label: 'BTC Lead-Lag Lab', icon: Zap, badge: 'STRAT #5' },
    { id: 'triangular', label: 'Triangular Arbitrage', icon: GitCommit },
    { id: 'microstructure', label: 'Order-Book Microstructure', icon: Zap },
    { id: 'market-making', label: 'Market Making', icon: Activity },
    { id: 'micro-scalper', label: 'Multi-Asset Scalper', icon: Layers, badge: 'STRAT #4' },
    { id: 'market-universe', label: 'Market Universe (50 Coins)', icon: Activity },
    { id: 'coin-performance', label: 'Coin Performance', icon: Award },
    { id: 'scalper-analytics', label: 'Target & Vol Analytics', icon: Sliders },
    { id: 'scalper-baselines', label: 'Scalper Baselines', icon: Scale },
    { id: 'strategy-comparison', label: 'Strategy Comparison', icon: Scale },
    { id: 'experiments', label: 'Research Experiments', icon: FlaskConical },
    { id: 'trades', label: 'Paper Executions', icon: Clock },
    { id: 'analytics', label: 'Research Analytics', icon: PieChart },
    { id: 'logs', label: 'System Logs', icon: BookOpen },
    { id: 'settings', label: 'Engine Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-panel-100 border-r border-panel-300 flex flex-col h-screen font-mono select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-panel-300 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
          <Brain className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="font-bold text-sm text-gray-100 tracking-wide">BINANCE LABS</h1>
          <span className="text-[10px] text-cyan-400 block font-semibold">MULTI-STRATEGY V4.0</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-panel-200/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Safety Notice Footer */}
      <div className="p-3 m-3 bg-panel-200/60 rounded-xl border border-panel-300 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Shield className="w-3.5 h-3.5" /> RESEARCH ONLY
          </span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
            NO REAL TRADES
          </span>
        </div>
        <div className="text-[10px] text-gray-400 leading-tight">
          Binance Public Market Data • 50+ Pairs • Simulated Capital
        </div>
      </div>
    </aside>
  );
};
