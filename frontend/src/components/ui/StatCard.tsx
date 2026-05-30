// src/components/ui/StatCard.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: string;
  color?: 'brand' | 'emerald' | 'red' | 'amber' | 'zinc';
}

const colorMap = {
  brand: {
    bg: 'bg-brand-500/10',
    border: 'border-brand-500/20',
    icon: 'text-brand-400',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: 'text-emerald-400',
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: 'text-red-400',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: 'text-amber-400',
  },
  zinc: {
    bg: 'bg-zinc-800',
    border: 'border-zinc-700',
    icon: 'text-zinc-400',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  color = 'brand',
}) => {
  const c = colorMap[color];

  return (
    <div className="card p-5 animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}
        >
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        {trend && (
          <span className="text-xs text-zinc-500 font-mono">{trend}</span>
        )}
      </div>
      <div className="text-2xl font-bold text-zinc-100 tabular-nums mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-xs text-zinc-500 font-medium">{label}</div>
    </div>
  );
};
