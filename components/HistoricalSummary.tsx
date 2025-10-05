import React from 'react';
import { HistoricalSummaryStats } from '../types';
import { formatNumber } from '../utils';
import { StatCard } from './StatCard';

interface HistoricalSummaryProps {
  stats: HistoricalSummaryStats;
}

export const HistoricalSummary: React.FC<HistoricalSummaryProps> = ({ stats }) => (
  <div className="bg-slate-800 p-4 rounded-lg">
    <h2 className="text-xl font-bold text-white mb-4">Resumen Global</h2>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
      <StatCard value={formatNumber(stats.totalSessions)} label="Sesiones Totales" />
      <StatCard value={formatNumber(stats.totalSets)} label="Series Totales" />
      <StatCard value={formatNumber(stats.totalReps)} label="Repeticiones Totales" />
    </div>
  </div>
);
