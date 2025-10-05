import { useState, useEffect, useCallback } from 'react';
import { ClientsApiResponse } from '../types';
import { GOOGLE_SHEET_API_URL } from '../config';

export const useClients = (enabled: boolean = true) => {
  const [clients, setClients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchClients = useCallback(() => {
    if (!enabled) {
      setClients([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    fetch(`${GOOGLE_SHEET_API_URL}?action=getClients`)
      .then(res => res.json() as Promise<ClientsApiResponse>)
      .then((data) => {
        if (data.clients && data.clients.length > 0) {
          setClients(data.clients);
        } else {
          setError(data.error || 'No se encontraron deportistas.');
        }
      })
      .catch(() => setError('Error al cargar la lista de deportistas.'))
      .finally(() => setIsLoading(false));
  }, [enabled]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients, retryCount]);

  const retry = () => {
    setRetryCount(c => c + 1);
  };

  return { clients, isLoading, error, retry };
};
