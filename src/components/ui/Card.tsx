import React from 'react';

interface CardProps {
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, action, children, className = '' }) => {
  return (
    <div className={`bg-panel-100 border border-panel-300 rounded-xl p-5 shadow-lg ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-panel-300/60">
          <div>
            {typeof title === 'string' ? (
              <h3 className="text-sm font-bold text-gray-100 tracking-wide">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="text-xs text-gray-400 font-mono mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
