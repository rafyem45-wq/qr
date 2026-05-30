// src/components/ui/EmptyState.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 rounded-2xl bg-zinc-800/50 border border-zinc-700 flex items-center justify-center mb-4">
      <Icon className="w-7 h-7 text-zinc-500" />
    </div>
    <h3 className="text-sm font-semibold text-zinc-300 mb-1">{title}</h3>
    {description && <p className="text-xs text-zinc-500 max-w-xs mb-4">{description}</p>}
    {action}
  </div>
);
