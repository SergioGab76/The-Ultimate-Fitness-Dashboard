import { Chart as ChartJS } from 'chart.js';

// --- AUTHENTICATION ---
export type AuthState = 'verifying' | 'authenticated' | 'admin' | 'denied' | 'prompting_for_token';

// --- API RESPONSE TYPES ---
export interface ClientsApiResponse {
  clients?: string[];
  error?: string;
}

export interface WorkoutsApiResponse {
  clientName?: string;
  workouts?: WorkoutSession[];
  error?: string;
}

// --- DATA STRUCTURES ---
export interface Exercise {
  name: string;
  sets: { reps: number; weight: number }[];
}

export interface WorkoutSession {
  date: string; // YYYY-MM-DD
  exercises: Exercise[];
}

// --- PROCESSED DATA ---
export interface DataPoint {
  date: string;
  maxWeight: number;
}

export interface ProcessedExerciseStats {
  name: string;
  maxWeight: number;
  firstWeight: number;
  lastWeight: number;
  progressDisplay: string;
  progressIsPositive: boolean;
  totalReps: number;
  sessionCount: number;
  dataPoints: DataPoint[];
  dateRange: string;
}

export interface DetailedExerciseStats {
  totalWeightLifted: number;
  avgWeightPerSet: number;
  bestSet: { reps: number; weight: number };
}

// --- UI-RELATED TYPES ---
export interface ChartPopoverData {
  exerciseName: string;
  date: string;
  sets: { reps: number; weight: number }[];
}

export interface HoveredPoint {
  datasetIndex: number;
  index: number;
}

export interface HistoricalSummaryStats {
  totalSessions: number;
  totalSets: number;
  totalReps: number;
}

export interface PerformanceChartRef {
  outerDiv: HTMLDivElement | null;
  getChartInstance: () => ChartJS<'line'> | null;
  focus: () => void;
}
