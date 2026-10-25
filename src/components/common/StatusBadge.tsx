import React from 'react';
import { SlotStatus } from '../../types/parking';
import { CheckCircle2, Car, Clock, AlertTriangle, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: SlotStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  };

  const config = {
    available: {
      label: 'Available',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
    },
    occupied: {
      label: 'Occupied',
      bg: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
      dot: 'bg-rose-500',
      icon: Car,
    },
    reserved: {
      label: 'Reserved',
      bg: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
      dot: 'bg-amber-500',
      icon: Clock,
    },
    unknown: {
      label: 'Offline / Unknown',
      bg: 'bg-slate-100 text-slate-700 border-slate-300 ring-slate-500/20',
      dot: 'bg-slate-500',
      icon: AlertTriangle,
    },
  }[status] || {
    label: status,
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    icon: HelpCircle,
  };

  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs transition-colors ${config.bg} ${sizeClasses[size]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
};
