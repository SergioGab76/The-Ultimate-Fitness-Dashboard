import React, { useMemo } from 'react';

interface DateFilterProps {
  filter: string;
  setFilter: (filter: string) => void;
  customRange: { start: string; end: string };
  setCustomRange: (range: { start: string; end: string }) => void;
}
export const DateFilter: React.FC<DateFilterProps> = ({ filter, setFilter, customRange, setCustomRange }) => {
  const filters = [
    { id: 'last-10', label: 'Últimas 10 Sesiones' },
    { id: 'all-time', label: 'Historial completo' },
    { id: 'custom', label: 'Fechas específicas' },
  ];
  
  const isRangeInvalid = useMemo(() => {
      if (customRange.start && customRange.end) {
          return new Date(customRange.start) > new Date(customRange.end);
      }
      return false;
  }, [customRange]);

  return (
    <div className="bg-slate-800 p-4 rounded-lg">
      <div className="flex flex-wrap items-center gap-4">
        {filters.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === id ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600'
            }`}
            aria-pressed={filter === id}
          >
            {label}
          </button>
        ))}
      </div>
      {filter === 'custom' && (
        <div className="mt-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="date"
              aria-label="Start Date"
              value={customRange.start}
              onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
              className="bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <input
              type="date"
              aria-label="End Date"
              value={customRange.end}
              onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
              className="bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          {isRangeInvalid && (
            <p className="mt-2 text-sm text-red-400" role="alert">
              La fecha de inicio no puede ser posterior a la fecha de finalización.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
