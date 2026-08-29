import React from 'react';
import { OpportunityClassification, OpportunityStatus } from '../../lib/types';

interface BadgeProps {
  status?: OpportunityStatus | string;
  classification?: OpportunityClassification | string;
  text?: string;
  variant?: 'emerald' | 'rose' | 'amber' | 'cyan' | 'purple' | 'gray';
}

export const Badge: React.FC<BadgeProps> = ({ status, classification, text, variant }) => {
  let color = 'bg-panel-300 text-gray-300 border-panel-400';
  let label = text || status || classification || 'UNKNOWN';

  if (variant === 'emerald' || status === 'GOOD' || classification === 'PROFITABLE_AFTER_FEES' || status === 'EXECUTED') {
    color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  } else if (variant === 'rose' || status === 'EXPIRED' || classification === 'UNPROFITABLE_AFTER_FEES') {
    color = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  } else if (variant === 'amber' || status === 'INSUFFICIENT_LIQUIDITY' || classification === 'INSUFFICIENT_LIQUIDITY') {
    color = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  } else if (variant === 'purple' || status === 'SLIPPAGE_TOO_HIGH' || classification === 'SLIPPAGE_TOO_HIGH') {
    color = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
  } else if (variant === 'cyan' || classification === 'SIMULATED_EXECUTION') {
    color = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase tracking-wider ${color}`}>
      {label.replace(/_/g, ' ')}
    </span>
  );
};
