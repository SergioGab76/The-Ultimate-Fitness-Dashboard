import React from 'react';
import { DetailedExerciseStats } from '../types';
import { formatNumber } from '../utils';
import { StatCard } from './StatCard';

interface ExerciseDetailViewProps {
  exerciseName: string;
  stats: DetailedExerciseStats;
  onClose: () => void;
}
export const ExerciseDetailView: React.FC<ExerciseDetailViewProps> = ({ exerciseName, stats, onClose }) => (
  <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-lg border border-indigo-500/50 ring-1 ring-indigo-500/30 animate-fade-in">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold text-indigo-400">{exerciseName} - Rendimiento en el Rango</h2>
      <button onClick={onClose} className="text-red-400 hover:text-red-300 transition-colors animate-pulse-scale" aria-label="Cerrar detalles">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
      <StatCard
        value={`${formatNumber(stats.totalWeightLifted, { maximumFractionDigits: 0 })} kg`}
        label="Peso Total Levantado"
      />
      <StatCard
        value={`${formatNumber(stats.avgWeightPerSet, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`}
        label="Peso Promedio por Serie"
      />
      <StatCard
        value={`${formatNumber(stats.bestSet.weight)} kg x ${formatNumber(stats.bestSet.reps)}`}
        label="Serie Más Pesada"
      />
    </div>
  </div>
);
