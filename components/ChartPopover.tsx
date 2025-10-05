import React from 'react';
import { ChartPopoverData } from '../types';
import { formatDate, formatNumber } from '../utils';

interface ChartPopoverProps {
  data: ChartPopoverData;
  style: React.CSSProperties;
  onClose: () => void;
}

export const ChartPopover = React.forwardRef<HTMLDivElement, ChartPopoverProps>(({ data, style, onClose }, ref) => {
  return (
    <div
      ref={ref}
      style={style}
      className="fixed z-50 bg-slate-800 border border-indigo-500/50 ring-1 ring-indigo-500/30 rounded-lg shadow-2xl p-4 w-52 sm:w-64 animate-fade-in-popover"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popover-title"
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 rounded-full text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors animate-pulse-scale"
        aria-label="Close details"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div>
        <h3 id="popover-title" className="font-bold text-indigo-400 pr-6">{data.exerciseName}</h3>
        <p className="text-sm text-slate-400 mb-2">{formatDate(data.date)}</p>
      </div>
      <ul className="space-y-1 text-sm">
        {data.sets.map((set, i) => (
          <li key={`${data.date}-${data.exerciseName}-set-${i}`} className="flex justify-between items-center bg-slate-700/50 px-2 py-1 rounded gap-2">
            <span className="text-slate-300 whitespace-nowrap">Serie {i + 1}:</span>
            <span className="font-semibold text-white whitespace-nowrap">{formatNumber(set.weight)} kg x {set.reps} reps</span>
          </li>
        ))}
      </ul>
    </div>
  );
});

ChartPopover.displayName = 'ChartPopover';
