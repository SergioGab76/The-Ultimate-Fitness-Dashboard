import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ProcessedExerciseStats,
  DetailedExerciseStats,
  ChartPopoverData,
  WorkoutSession,
  PerformanceChartRef,
  AuthState,
} from './types';
import { parseDate, formatNumber, formatDate, formatDateRange } from './utils';
import { useClients } from './hooks/useClients';
import { useWorkouts } from './hooks/useWorkouts';
import { usePopoverPosition } from './hooks/usePopoverPosition';

import { Header } from './components/Header';
import { DateFilter } from './components/DateFilter';
import { Scorecard } from './components/Scorecard';
import { ExerciseDetailView } from './components/ExerciseDetailView';
import { ChartPopover } from './components/ChartPopover';
import { HistoricalSummary } from './components/HistoricalSummary';
import { PerformanceChart } from './components/PerformanceChart';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { DisambiguationPopover, DisambiguationChoice } from './components/DisambiguationPopover';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GOOGLE_SHEET_API_URL } from './config';
import { AdminTokenPrompt } from './components/AdminTokenPrompt';

// --- AUTHENTICATION SCREEN ---
const AuthScreen = ({ title, message, icon }: {title: string, message: string, icon: React.ReactNode}) => (
    <div className="flex flex-col items-center justify-center h-screen gap-4 p-4 text-center" aria-live="polite">
        <div className="text-indigo-400">{icon}</div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-slate-400">{message}</p>
    </div>
);

// --- MAIN APP COMPONENT ---
const App = () => {
  const [authState, setAuthState] = useState<AuthState>('verifying');
  const [selectedClient, setSelectedClient] = useState('');
  const [authToken, setAuthToken] = useState<string | null>(null);

  // --- Authentication Flow ---
  const validateToken = useCallback((tokenToValidate: string) => {
    if (!tokenToValidate) {
        setAuthState('denied');
        return;
    }
    setAuthState('verifying');
    setAuthToken(tokenToValidate);

    fetch(`${GOOGLE_SHEET_API_URL}?action=validateToken&token=${encodeURIComponent(tokenToValidate)}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`El servidor respondió con un error: ${res.status}`);
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          // Google Apps Script can return HTML error pages with a 200 OK status.
          // This check prevents trying to parse HTML as JSON.
          throw new TypeError("La respuesta del servidor no es un JSON válido. Revisa el script.");
        }
        return res.json();
      })
      .then(data => {
        if (data.clientName === 'ADMIN') {
          setAuthState('admin'); // Special token grants admin access
        } else if (data.clientName) {
          setSelectedClient(data.clientName);
          setAuthState('authenticated'); // Regular token for a client
        } else {
          console.error('Token validation failed:', data.error || 'Unknown error');
          setAuthState('denied');
        }
      })
      .catch((err) => {
        console.error('Fetch error during token validation:', err.message);
        setAuthState('denied');
      });
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      validateToken(token);
    } else {
      setAuthState('prompting_for_token');
    }
  }, [validateToken]);

  const { clients, isLoading: clientsLoading, error: clientsError, retry: retryClients } = useClients(authState === 'admin');
  
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Set the first client as selected once the list loads in admin mode
  useEffect(() => {
    if (authState === 'admin' && clients.length > 0 && !selectedClient) {
      setSelectedClient(clients[0]);
    }
  }, [clients, selectedClient, authState]);

  const { workouts, isLoading: workoutsLoading, error: workoutsError, retry: retryWorkouts } = useWorkouts(selectedClient);
  
  const [filter, setFilter] = useState('last-10');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  
  // Popover state management - Simplified for "Tap-to-Inspect"
  const [chartPopoverData, setChartPopoverData] = useState<ChartPopoverData | null>(null);
  const [disambiguationChoices, setDisambiguationChoices] = useState<{ choices: DisambiguationChoice[], position: { x: number, y: number } } | null>(null);
  
  const popoverRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<PerformanceChartRef>(null);
  const popoverStyle = usePopoverPosition(chartPopoverData, popoverRef, chartRef);
  
  // Reset exercise selection when client changes
  useEffect(() => {
    setSelectedExercise(null);
  }, [selectedClient]);

  // Scroll to chart when an exercise is selected
  useEffect(() => {
    // Only scroll if an exercise is selected (not when deselecting back to 'all')
    if (selectedExercise && chartRef.current?.outerDiv) {
      chartRef.current.outerDiv.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedExercise]);

  const handleFilterChange = useCallback((newFilter: string) => {
    setIsRecalculating(true);
    setFilter(newFilter);
  }, []);

  const handleCustomRangeChange = useCallback((newRange: { start: string, end: string }) => {
    setIsRecalculating(true);
    setCustomRange(newRange);
  }, []);

  // Performance Optimization: Pre-index workouts by date for O(1) lookup.
  const workoutsByDate = useMemo(() => {
    const map = new Map<string, WorkoutSession>();
    workouts.forEach(workout => {
        map.set(workout.date, workout);
    });
    return map;
  }, [workouts]);


  const filteredWorkouts = useMemo(() => {
    if (filter === 'all-time') {
      return workouts;
    }
    if (filter.startsWith('last-')) {
      const count = parseInt(filter.split('-')[1], 10);
      return workouts.slice(-count);
    }
    if (filter === 'custom' && customRange.start && customRange.end) {
      const start = parseDate(customRange.start);
      const end = parseDate(customRange.end);
      if (start && end && start <= end) {
        return workouts.filter(w => {
            const d = parseDate(w.date);
            return d && d >= start && d <= end;
        });
      }
    }
    return workouts;
  }, [workouts, filter, customRange]);

  const chartDateRange = useMemo(() => {
    if (filteredWorkouts.length < 2) {
      return '';
    }
    const startDateStr = filteredWorkouts[0].date;
    const endDateStr = filteredWorkouts[filteredWorkouts.length - 1].date;
    return formatDateRange(startDateStr, endDateStr);
  }, [filteredWorkouts]);

  const processedStats = useMemo<ProcessedExerciseStats[]>(() => {
    const exerciseMap = new Map<string, { dataPoints: { date: string; maxWeight: number }[], totalReps: number }>();
    filteredWorkouts.forEach(session => {
      session.exercises.forEach(exercise => {
        if (!exerciseMap.has(exercise.name)) {
          exerciseMap.set(exercise.name, { dataPoints: [], totalReps: 0 });
        }
        const current = exerciseMap.get(exercise.name)!;
        const maxWeight = Math.max(...exercise.sets.map(s => s.weight));
        current.dataPoints.push({ date: session.date, maxWeight });
        current.totalReps += exercise.sets.reduce((sum, set) => sum + set.reps, 0);
      });
    });

    return Array.from(exerciseMap.entries()).map(([name, data]) => {
      const weights = data.dataPoints.map(dp => dp.maxWeight);
      const firstWeight = weights[0] || 0;
      const lastWeight = weights[weights.length - 1] || 0;
      
      const ABSOLUTE_GAIN_THRESHOLD = 2;
      let progressDisplay: string;
      let progressIsPositive: boolean;
      const gain = lastWeight - firstWeight;

      if (firstWeight < ABSOLUTE_GAIN_THRESHOLD) {
        // For exercises starting with very light or no weight (bodyweight), show absolute gain.
        progressDisplay = `${gain >= 0 ? '+' : ''}${formatNumber(gain, { maximumFractionDigits: 1 })} kg`;
        progressIsPositive = gain >= 0;
      } else {
        // For all other exercises, show percentage gain.
        const percentage = (gain / firstWeight) * 100;
        progressDisplay = `${percentage >= 0 ? '+' : ''}${formatNumber(percentage, { maximumFractionDigits: 1 })}%`;
        progressIsPositive = percentage >= 0;
      }
      
      const dateRange = data.dataPoints.length > 1
        ? formatDateRange(data.dataPoints[0].date, data.dataPoints[data.dataPoints.length - 1].date)
        : (data.dataPoints.length === 1 ? formatDate(data.dataPoints[0].date, { year: 'numeric', month: 'short', day: 'numeric' }) : '');

      return {
        name,
        maxWeight: Math.max(...weights),
        firstWeight,
        lastWeight,
        progressDisplay,
        progressIsPositive,
        totalReps: data.totalReps,
        sessionCount: data.dataPoints.length,
        dataPoints: data.dataPoints,
        dateRange,
      };
    }).sort((a, b) => b.sessionCount - a.sessionCount);
  }, [filteredWorkouts]);

  // Effect to turn off recalculating indicator and update status message
  useEffect(() => {
    if (isRecalculating) {
      setIsRecalculating(false);
      setStatusMessage(`Dashboard actualizado. Mostrando ${filteredWorkouts.length} sesiones.`);
    }
  }, [processedStats, isRecalculating, filteredWorkouts.length]);


  const chartStats = useMemo(() => {
    if (selectedExercise) {
      const specificStat = processedStats.find(s => s.name === selectedExercise);
      return specificStat ? [specificStat] : [];
    }
    return processedStats.slice(0, 4);
  }, [processedStats, selectedExercise]);
  
  // The scorecard that is selected and will be featured above the chart.
  const selectedScorecardStat = useMemo(() => {
    if (!selectedExercise) return null;
    return processedStats.find(stat => stat.name === selectedExercise) || null;
  }, [processedStats, selectedExercise]);

  // The scorecards that remain in the main grid.
  const gridScorecardStats = useMemo(() => {
    const top4 = processedStats.slice(0, 4);
    // If an exercise is selected, show the top 4 but exclude the selected one from this grid.
    if (selectedExercise) {
      return top4.filter(stat => stat.name !== selectedExercise);
    }
    // If nothing is selected, just show the top 4.
    return top4;
  }, [processedStats, selectedExercise]);
    
  // Effect to close popover when clicking outside or pressing Escape.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If the popover is open and the click is outside both the popover and the chart, close it.
      if (
        chartPopoverData &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        chartRef.current?.outerDiv &&
        !chartRef.current.outerDiv.contains(event.target as Node)
      ) {
        setChartPopoverData(null);
        chartRef.current?.focus(); // Return focus to the chart for accessibility
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setChartPopoverData(null);
        setDisambiguationChoices(null); // Also close disambiguation popover
        chartRef.current?.focus(); // Return focus to chart for accessibility
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [chartPopoverData]);
  

  const detailedStatsForSelected = useMemo<DetailedExerciseStats | null>(() => {
    if (!selectedExercise) return null;
    let totalWeightLifted = 0;
    let totalSets = 0;
    let bestSet = { reps: 0, weight: 0 };
    filteredWorkouts.forEach(session => {
      session.exercises.forEach(exercise => {
        if (exercise.name === selectedExercise) {
          exercise.sets.forEach(set => {
            totalWeightLifted += set.reps * set.weight;
            totalSets++;
            if (set.weight > bestSet.weight || (set.weight === bestSet.weight && set.reps > bestSet.reps)) {
              bestSet = set;
            }
          });
        }
      });
    });
    return {
      totalWeightLifted,
      avgWeightPerSet: totalSets > 0 ? totalWeightLifted / totalSets : 0,
      bestSet,
    };
  }, [selectedExercise, filteredWorkouts]);

  const historicalSummaryStats = useMemo(() => {
    return workouts.reduce((acc, session) => {
        session.exercises.forEach(exercise => {
            acc.totalSets += exercise.sets.length;
            acc.totalReps += exercise.sets.reduce((sum, set) => sum + set.reps, 0);
        });
        return acc;
    }, { totalSessions: workouts.length, totalSets: 0, totalReps: 0 });
  }, [workouts]);

  // Single handler for all chart clicks.
  const handleChartClick = useCallback((data: ChartPopoverData | null) => {
    setDisambiguationChoices(null); // Always close disambiguation on a new click
    
    // Toggle popover: if clicking the same point, close it.
    if (data && chartPopoverData && data.date === chartPopoverData.date && data.exerciseName === chartPopoverData.exerciseName) {
      setChartPopoverData(null);
      chartRef.current?.focus(); // Return focus after closing
    } else {
      setChartPopoverData(data); // Set new popover data, or null to close
    }
  }, [chartPopoverData]);
  
  const handleMultiplePointsClick = useCallback((choices: DisambiguationChoice[], position: { x: number, y: number }) => {
    setChartPopoverData(null); // Close main popover
    setDisambiguationChoices({ choices, position }); // Show disambiguation choices
  }, []);
  
  // --- RENDER LOGIC ---

  if (authState === 'verifying') {
    return (
      <AuthScreen
        title="Verificando Acceso..."
        message="Por favor, espera mientras verificamos tus credenciales."
        icon={
          <svg className="h-12 w-12 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        }
      />
    );
  }

  if (authState === 'prompting_for_token') {
    return <AdminTokenPrompt onTokenSubmit={validateToken} />;
  }

  if (authState === 'denied') {
    return (
      <AuthScreen
        title="Acceso Denegado"
        message="El enlace proporcionado no es válido o ha expirado. Por favor, contacta a soporte."
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    );
  }

  if (clientsLoading && authState === 'admin') {
    return <LoadingSkeleton />;
  }
  
  const error = clientsError || workoutsError;
  const retry = clientsError ? retryClients : retryWorkouts;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4" aria-live="polite">
        <div className="text-xl text-red-400">{error}</div>
        <button
          onClick={retry}
          className="px-4 py-2 font-medium rounded-md transition-colors bg-indigo-600 text-white hover:bg-indigo-500"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div key={`${authState}-${selectedClient}`} className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <Header
        clientName={selectedClient}
        clientList={clients}
        selectedClient={selectedClient}
        onClientChange={setSelectedClient}
        authState={authState}
        authToken={authToken}
      />
      
      {/* Visually hidden status container for screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>
      
      {workoutsLoading && (
        <div className="flex items-center justify-center gap-2 py-4 text-slate-400" aria-live="polite">
          <svg className="h-5 w-5 animate-spin text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Cargando entrenamientos...</span>
        </div>
      )}

      <DateFilter
        filter={filter}
        setFilter={handleFilterChange}
        customRange={customRange}
        setCustomRange={handleCustomRangeChange}
      />

      {workouts.length > 0 && !workoutsLoading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {gridScorecardStats.map((stat) => (
              <Scorecard
                key={stat.name}
                name={stat.name}
                progressDisplay={stat.progressDisplay}
                progressIsPositive={stat.progressIsPositive}
                weightChange={`${formatNumber(stat.firstWeight)}kg ➞ ${formatNumber(stat.lastWeight)}kg`}
                totalReps={stat.totalReps}
                isSelected={selectedExercise === stat.name}
                onClick={() => setSelectedExercise(prev => (prev === stat.name ? null : stat.name))}
                dateRange={stat.dateRange}
                sessionCount={stat.sessionCount}
              />
            ))}
          </div>

          {/* Featured Scorecard Section */}
          {selectedScorecardStat && (
            <div className="mt-6 animate-fade-in">
              <Scorecard
                key={selectedScorecardStat.name}
                name={selectedScorecardStat.name}
                progressDisplay={selectedScorecardStat.progressDisplay}
                progressIsPositive={selectedScorecardStat.progressIsPositive}
                weightChange={`${formatNumber(selectedScorecardStat.firstWeight)}kg ➞ ${formatNumber(selectedScorecardStat.lastWeight)}kg`}
                totalReps={selectedScorecardStat.totalReps}
                isSelected={true}
                onClick={() => setSelectedExercise(null)}
                dateRange={selectedScorecardStat.dateRange}
                sessionCount={selectedScorecardStat.sessionCount}
              />
            </div>
          )}
          
          <PerformanceChart
            ref={chartRef}
            statsToDisplay={chartStats}
            selectedExercise={selectedExercise || 'all'}
            setSelectedExercise={(name) => setSelectedExercise(name === 'all' ? null : name)}
            uniqueExercises={processedStats.map(s => s.name)}
            workoutsByDate={workoutsByDate}
            onPointClick={handleChartClick}
            onMultiplePointsClick={handleMultiplePointsClick}
            isRecalculating={isRecalculating}
            dateRange={chartDateRange}
            sessionCount={filteredWorkouts.length}
          />
          
          {selectedExercise && detailedStatsForSelected && (
            <ExerciseDetailView
              exerciseName={selectedExercise}
              stats={detailedStatsForSelected}
              onClose={() => setSelectedExercise(null)}
            />
          )}

          <HistoricalSummary stats={historicalSummaryStats} />
          
          {disambiguationChoices && (
            <DisambiguationPopover 
              choices={disambiguationChoices.choices}
              position={disambiguationChoices.position}
              onSelect={(choice) => {
                handleChartClick(choice.popoverData);
              }}
              onClose={() => {
                setDisambiguationChoices(null);
                chartRef.current?.focus(); // Return focus to chart
              }}
            />
          )}

          {chartPopoverData && !disambiguationChoices && (
            <ChartPopover
                ref={popoverRef}
                data={chartPopoverData}
                style={popoverStyle}
                onClose={() => {
                  setChartPopoverData(null);
                  chartRef.current?.focus(); // Return focus to chart
                }}
            />
          )}
        </>
      )}
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
