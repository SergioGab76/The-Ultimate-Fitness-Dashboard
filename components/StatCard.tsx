import React from 'react';

interface StatCardProps {
  value: string | React.ReactNode;
  label: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ value, label, className }) => (
  <div className={`bg-slate-700 p-4 rounded-md ${className || ''}`}>
    <p className="text-3xl font-bold text-white">{value}</p>
    <p className="text-sm text-slate-400">{label}</p>
  </div>
);
