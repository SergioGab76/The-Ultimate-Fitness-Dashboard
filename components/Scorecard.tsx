import React from 'react';
import { formatNumber } from '../utils';

interface ScorecardProps {
  name: string;
  progressDisplay: string;
  progressIsPositive: boolean;
  weightChange: string;
  totalReps: number;
  isSelected: boolean;
  onClick: () => void;
  dateRange?: string;
  sessionCount?: number;
}

export const Scorecard: React.FC<ScorecardProps> = ({ name, progressDisplay, progressIsPositive, weightChange, totalReps, isSelected, onClick, dateRange, sessionCount }) => (
    <div
        onClick={onClick}
        className={`bg-slate-800 p-4 rounded-lg border transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${
          isSelected ? 'border-indigo-400 ring-2 ring-indigo-400/50' : 'border-slate-700 hover:border-indigo-500'
        }`}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
    >
        <h3 className="text-lg font-bold text-white flex items-baseline flex-wrap gap-x-2">
          <span>{name}</span>
          {dateRange && sessionCount && (
            <span className="text-xs font-normal text-slate-400 whitespace-nowrap">
              ({dateRange})
            </span>
          )}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
            <p className={`text-2xl font-bold ${progressIsPositive ? 'text-green-400' : 'text-red-400'}`}>
                {progressDisplay}
            </p>
            <p className="text-sm text-slate-400">{weightChange}</p>
        </div>
        <p className="mt-1 text-sm text-slate-400">
            <span className="font-semibold text-white">{formatNumber(totalReps)}</span> repeticiones totales
             {sessionCount && (
                <span className="ml-2">
                    en <span className="font-semibold text-white">{sessionCount}</span> {sessionCount === 1 ? 'sesión' : 'sesiones'}
                </span>
            )}
        </p>
    </div>
);
