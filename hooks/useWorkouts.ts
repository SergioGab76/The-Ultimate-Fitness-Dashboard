import { useState, useEffect, useCallback } from 'react';
import { WorkoutsApiResponse, WorkoutSession } from '../types';
import { parseDate } from '../utils';
import { GOOGLE_SHEET_API_URL } from '../config';

export const useWorkouts = (clientName: string) => {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchWorkouts = useCallback((signal: AbortSignal) => {
    if (!clientName) {
        setIsLoading(false);
        return;
    };
    
    setIsLoading(true);
    setError(null);
    setWorkouts([]);

    fetch(`${GOOGLE_SHEET_API_URL}?action=getWorkouts&sheetName=${encodeURIComponent(clientName)}`, { signal })
      .then(res => res.json() as Promise<WorkoutsApiResponse>)
      .then((data) => {
        if (data.workouts) {
          // Filter out any workouts with invalid dates before sorting
          const sortedWorkouts = data.workouts
            .map(w => ({ ...w, parsedDate: parseDate(w.date) }))
            .filter(w => w.parsedDate)
            .sort((a, b) => a.parsedDate!.getTime() - b.parsedDate!.getTime())
            .map(({ parsedDate, ...rest }) => rest);
          setWorkouts(sortedWorkouts);
        } else {
          setError(data.error || `No se encontraron entrenamientos para ${clientName}.`);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(`Error al cargar los entrenamientos para ${clientName}.`);
        }
      })
      .finally(() => setIsLoading(false));
  }, [clientName]);
  
  useEffect(() => {
      const controller = new AbortController();
      fetchWorkouts(controller.signal);
      
      return () => {
          controller.abort();
      };
  }, [fetchWorkouts, retryCount]);

  const retry = () => {
    setRetryCount(c => c + 1);
  };

  return { workouts, isLoading, error, retry };
};
