import React, { useMemo, useRef, useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  ChartEvent,
  ActiveElement
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ProcessedExerciseStats, WorkoutSession, ChartPopoverData, DataPoint, HoveredPoint, PerformanceChartRef } from '../types';
import { formatDate, formatNumber, generateChartColors } from '../utils';
import { DisambiguationChoice } from './DisambiguationPopover';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface PerformanceChartProps {
  statsToDisplay: ProcessedExerciseStats[];
  selectedExercise: string;
  setSelectedExercise: (exercise: string) => void;
  uniqueExercises: string[];
  workoutsByDate: Map<string, WorkoutSession>;
  onPointClick: (data: ChartPopoverData | null) => void;
  onMultiplePointsClick: (choices: DisambiguationChoice[], position: { x: number, y: number }) => void;
  isRecalculating: boolean;
  dateRange: string;
  sessionCount: number;
}
export const PerformanceChart = forwardRef<PerformanceChartRef, PerformanceChartProps>(({ statsToDisplay, selectedExercise, setSelectedExercise, uniqueExercises, workoutsByDate, onPointClick, onMultiplePointsClick, isRecalculating, dateRange, sessionCount }, ref) => {
    const chartInstanceRef = useRef<ChartJS<'line'>>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      outerDiv: containerRef.current,
      getChartInstance: () => chartInstanceRef.current,
      focus: () => containerRef.current?.focus(),
    }), []);

    const chartColors = useMemo(() => generateChartColors(Math.max(statsToDisplay.length, 4)), [statsToDisplay.length]);
    const [hoveredLegendIndex, setHoveredLegendIndex] = useState<number | null>(null);
    const [activePoint, setActivePoint] = useState<HoveredPoint | null>(null);
    // FIX: The useRef hook was called with a generic type <number> but without an initial value.
    // This causes a TypeScript error because the initial value is implicitly `undefined`, which is not assignable to `number`.
    // Initializing it with `null` and updating the type to `number | null` resolves the error.
    const animationFrameRef = useRef<number | null>(null);

    // Performance Optimization: Animate using a direct canvas update loop
    useEffect(() => {
        const chart = chartInstanceRef.current;
        if (!chart || !activePoint) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            return;
        }

        // The animate function is called on every frame to update the chart.
        const animate = () => {
            if (chart) {
                chart.update('none');
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            // Reset point size when not active
            if (chart?.options?.elements?.point) {
                // FIX: Chart.js's scriptable options for point radius expect a function that accepts one argument (the context).
                // The function was previously defined with zero arguments, causing a type error.
                chart.options.elements.point.radius = (_) => 4;
                chart.update('none');
            }
        };
    }, [activePoint]);

    // BUGFIX: Add mouseleave listener to the canvas to clear stuck active points.
    useEffect(() => {
        const chart = chartInstanceRef.current;
        if (!chart) return;

        const canvas = chart.canvas;
        const handleMouseLeave = () => {
            setActivePoint(null);
        };

        canvas.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            if (canvas) { // Canvas might be destroyed on cleanup
                canvas.removeEventListener('mouseleave', handleMouseLeave);
            }
        };
    }, []); // Run only once when the chart mounts
    
    // Performance Optimization: Memoize the point radius function separately
    const getPointRadius = useCallback((context: any) => {
        if (activePoint && context.datasetIndex === activePoint.datasetIndex && context.dataIndex === activePoint.index) {
            // Greatly increased base size and pulse amplitude for a more noticeable hover effect.
            return 10 + 6 * Math.sin(Date.now() / 150);
        }
        return 4; // Default size for non-active points
    }, [activePoint]);

    const { chartData, finalLabels } = useMemo<{ chartData: ChartData<'line'>; finalLabels: string[] }>(() => {
        if (!statsToDisplay.length) return { chartData: { labels: [], datasets: [] }, finalLabels: [] };
        
        const MAX_LABELS = 13;
        const allDates = [...new Set<string>(statsToDisplay.flatMap(s => s.dataPoints.map(dp => dp.date)))].sort();

        let finalLabels = allDates;
        let finalStats = statsToDisplay;

        if (allDates.length > MAX_LABELS) {
            const bucketSize = Math.ceil(allDates.length / MAX_LABELS);
            const dateBuckets: string[][] = [];
            for (let i = 0; i < allDates.length; i += bucketSize) {
                dateBuckets.push(allDates.slice(i, i + bucketSize));
            }

            const newSampledStats = statsToDisplay.map(stat => {
                const newDatapoints: DataPoint[] = [];
                for (const bucket of dateBuckets) {
                    const pointsInBucket = stat.dataPoints.filter(dp => bucket.includes(dp.date));
                    if (pointsInBucket.length > 0) {
                        const bestPoint = pointsInBucket.reduce((best, current) => 
                            current.maxWeight > best.maxWeight ? current : best
                        );
                        newDatapoints.push(bestPoint);
                    }
                }
                return { ...stat, dataPoints: newDatapoints };
            });
            
            finalStats = newSampledStats;
            finalLabels = [...new Set<string>(finalStats.flatMap(s => s.dataPoints.map(dp => dp.date)))].sort();
        }
        
        const VIBRANT_AMBER = '#fbbf24';

        const data = {
            labels: finalLabels.map(date => formatDate(date)),
            datasets: finalStats.map((stat, datasetIndex) => {
                const dataMap = new Map(stat.dataPoints.map(dp => [dp.date, dp.maxWeight]));
                const isHovered = hoveredLegendIndex === datasetIndex;
                const isDimmed = hoveredLegendIndex !== null && !isHovered;
                const baseColor = chartColors[datasetIndex % chartColors.length];

                return {
                    label: stat.name,
                    data: finalLabels.map(date => dataMap.get(date) ?? null),
                    borderColor: isDimmed ? baseColor + '4D' : baseColor,
                    backgroundColor: baseColor + '33',
                    tension: 0.1,
                    fill: false,
                    spanGaps: true,
                    borderWidth: isHovered ? 4 : 2,
                    pointBackgroundColor: (context: any) => {
                        if (activePoint && context.datasetIndex === activePoint.datasetIndex && context.dataIndex === activePoint.index) {
                            return VIBRANT_AMBER;
                        }
                        return baseColor;
                    },
                    pointBorderColor: (context: any) => {
                        if (activePoint && context.datasetIndex === activePoint.datasetIndex && context.dataIndex === activePoint.index) {
                            return VIBRANT_AMBER;
                        }
                        return baseColor;
                    },
                    pointHoverRadius: 8,
                    pointBorderWidth: 1,
                    pointHoverBorderWidth: 3,
                    pointHitRadius: 20,
                };
            }),
        };

        return { chartData: data, finalLabels };
    }, [statsToDisplay, chartColors, hoveredLegendIndex, activePoint]);
    
    // Accessibility: Keyboard navigation handler
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const chart = chartInstanceRef.current;
        if (!chart) return;
        
        const currentPoint = activePoint ?? { datasetIndex: 0, index: 0 };
        let nextPoint = { ...currentPoint };

        switch (e.key) {
            case 'ArrowRight':
                nextPoint.index++;
                break;
            case 'ArrowLeft':
                nextPoint.index--;
                break;
            case 'ArrowUp':
                nextPoint.datasetIndex--;
                break;
            case 'ArrowDown':
                nextPoint.datasetIndex++;
                break;
            case 'Enter':
            case ' ':
                 if (activePoint) {
                    const { datasetIndex, index } = activePoint;
                    const datasetLabel = chart.data.datasets[datasetIndex].label as string;
                    const originalDate = finalLabels[index];
                    const exercise = workoutsByDate.get(originalDate)?.exercises.find(e => e.name === datasetLabel);
                    if (exercise) {
                       onPointClick({
                            exerciseName: datasetLabel,
                            date: originalDate,
                            sets: exercise.sets,
                        });
                    }
                 }
                 e.preventDefault();
                 return;
            default:
                return; // Do nothing for other keys
        }
        
        e.preventDefault();

        const numDatasets = chart.data.datasets.length;
        const numDataPoints = (chart.data.labels ?? []).length;
        
        nextPoint.datasetIndex = (nextPoint.datasetIndex + numDatasets) % numDatasets;
        nextPoint.index = (nextPoint.index + numDataPoints) % numDataPoints;
        
        setActivePoint(nextPoint);
    };

    const chartOptions: ChartOptions<'line'> = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: 20 },
        elements: {
            point: {
                radius: getPointRadius,
            }
        },
        onHover: (event: ChartEvent, elements: ActiveElement[]) => {
          if (elements.length > 0) {
            const { datasetIndex, index } = elements[0];
            if (activePoint?.datasetIndex !== datasetIndex || activePoint?.index !== index) {
              setActivePoint({ datasetIndex, index });
            }
          } else {
            if (activePoint !== null) {
              setActivePoint(null);
            }
          }
        },
        onClick: (event: ChartEvent) => {
            const chart = chartInstanceRef.current;
            if (!chart || !event.native) return;
            
            const elements = chart.getElementsAtEventForMode(event.native, 'point', { intersect: true }, true);

            if (elements.length === 0) {
                 onPointClick(null);
                 return;
            }
            
            const canvasRect = chart.canvas.getBoundingClientRect();
            const clickPosition = { 
                x: canvasRect.left + (event.x ?? 0),
                y: canvasRect.top + (event.y ?? 0)
            };

            if (elements.length === 1) {
                const firstPoint = elements[0];
                const datasetLabel = chart.data.datasets[firstPoint.datasetIndex].label as string;
                const originalDate = finalLabels[firstPoint.index];
                const exercise = workoutsByDate.get(originalDate)?.exercises.find(e => e.name === datasetLabel);
                
                if (exercise) {
                    onPointClick({
                        exerciseName: datasetLabel,
                        date: originalDate,
                        sets: exercise.sets,
                    });
                }
            } else {
                const choices: DisambiguationChoice[] = elements.map(element => {
                    const datasetLabel = chart.data.datasets[element.datasetIndex].label as string;
                    const originalDate = finalLabels[element.index];
                    const exercise = workoutsByDate.get(originalDate)?.exercises.find(e => e.name === datasetLabel);
                    
                    if (!exercise) return null;

                    return {
                        name: `${datasetLabel} (${formatDate(originalDate)})`,
                        point: { datasetIndex: element.datasetIndex, index: element.index },
                        popoverData: {
                            exerciseName: datasetLabel,
                            date: originalDate,
                            sets: exercise.sets,
                        }
                    };
                }).filter((choice): choice is DisambiguationChoice => choice !== null);
                
                if (choices.length > 0) {
                    onMultiplePointsClick(choices, clickPosition);
                }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
        },
        scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
            y: {
                beginAtZero: false,
                ticks: { color: '#94a3b8', callback: (value) => `${formatNumber(Number(value))} kg` },
                grid: { color: '#334155' }
            }
        }
    }), [setSelectedExercise, selectedExercise, finalLabels, workoutsByDate, onPointClick, onMultiplePointsClick, hoveredLegendIndex, getPointRadius, activePoint]);

    return (
        <div 
          ref={containerRef} 
          className="bg-slate-800 p-4 rounded-lg relative focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          aria-label="Performance chart, use arrow keys to navigate data points and Enter to view details."
        >
            {isRecalculating && <div className="absolute inset-0 bg-slate-800/50 z-10 flex items-center justify-center transition-opacity animate-fade-in"><div className="text-white">Actualizando...</div></div>}
            <div className={`transition-opacity ${isRecalculating ? 'opacity-50' : 'opacity-100'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-white">Evolución del Peso Máximo por Sesión</h2>
                        <p className="text-sm text-slate-400">
                            {dateRange} ({sessionCount} {sessionCount === 1 ? 'sesión' : 'sesiones'})
                        </p>
                        <p className="text-xs text-amber-400 animate-slow-flash mt-1">
                            Toca cualquier punto del gráfico para más información
                        </p>
                    </div>
                    <div className={`relative w-full sm:w-[25rem] select-container-with-hint ${selectedExercise === 'all' ? 'show-hint' : ''}`}>
                        <select
                            value={selectedExercise}
                            onChange={(e) => setSelectedExercise(e.target.value)}
                            className="w-full appearance-none bg-slate-700 border border-slate-600 rounded-md p-2 pl-3 pr-8 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            aria-label="Select exercise to display on chart"
                        >
                            <option value="all">Top 4</option>
                            {uniqueExercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-red-400 animate-pulse-scale">
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                               <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="h-[400px] relative">
                    <Line ref={chartInstanceRef} options={chartOptions} data={chartData} />
                </div>
                {/* Custom HTML Legend */}
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-300 sm:flex sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-2">
                    {statsToDisplay.map((stat, index) => {
                        const isHovered = hoveredLegendIndex === index;
                        const isDimmed = hoveredLegendIndex !== null && !isHovered;
                        const isSelected = selectedExercise === stat.name;

                        return (
                            <button
                                key={stat.name}
                                onClick={() => setSelectedExercise(stat.name)}
                                onMouseEnter={() => setHoveredLegendIndex(index)}
                                onMouseLeave={() => setHoveredLegendIndex(null)}
                                className={`flex items-center gap-2 p-1 rounded-md transition-all duration-200 ${isDimmed ? 'opacity-50' : 'opacity-100'} ${isSelected ? 'bg-slate-700' : ''} hover:bg-slate-700/80`}
                                aria-label={`Focus on ${stat.name}`}
                                aria-pressed={isSelected}
                            >
                                <span
                                className="h-3 w-3 rounded-sm"
                                style={{ backgroundColor: chartColors[index % chartColors.length] }}
                                ></span>
                                <span>{stat.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});
PerformanceChart.displayName = 'PerformanceChart';
