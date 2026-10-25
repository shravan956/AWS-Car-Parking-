import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'green' | 'red' | 'amber' | 'slate';
  badge?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  badge,
  onClick,
}) => {
  const variantStyles = {
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
      borderAccent: 'border-l-blue-600',
    },
    green: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      borderAccent: 'border-l-emerald-600',
    },
    red: {
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
      borderAccent: 'border-l-rose-600',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      borderAccent: 'border-l-amber-500',
    },
    slate: {
      iconBg: 'bg-slate-100 text-slate-600 border-slate-200',
      borderAccent: 'border-l-slate-500',
    },
  }[variant];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border border-slate-200 border-l-4 ${variantStyles.borderAccent} p-4 shadow-subtle transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`p-2 rounded-md border ${variantStyles.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {badge && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500 truncate">{subtitle}</p>}
    </div>
  );
};
