// src/components/ui/Spinner.tsx
import React from 'react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }[size];
  return (
    <div
      className={`${s} rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin`}
    />
  );
};
