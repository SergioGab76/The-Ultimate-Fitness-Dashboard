import React, { useState, useEffect } from 'react';
import { GOOGLE_SHEET_API_URL } from '../config';
import { AuthState } from '../types';

interface HeaderProps {
  clientName: string;
  clientList: string[];
  selectedClient: string;
  onClientChange: (client: string) => void;
  authState: AuthState;
  authToken?: string | null;
}

export const Header: React.FC<HeaderProps> = ({ clientName, clientList, selectedClient, onClientChange, authState, authToken }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');

  useEffect(() => {
    if (copyStatus === 'copied' || copyStatus === 'error') {
      const timer = setTimeout(() => setCopyStatus('idle'), 2500);
      return () => clearTimeout(timer);
    }
  }, [copyStatus]);

  const handleCopyLink = async () => {
    if (!selectedClient || !authToken) {
      alert('Por favor, selecciona un deportista y asegúrate de tener un token de administrador.');
      return;
    }

    setCopyStatus('copying');

    try {
      const res = await fetch(`${GOOGLE_SHEET_API_URL}?action=getTokenForClient&clientName=${encodeURIComponent(selectedClient)}&adminToken=${encodeURIComponent(authToken)}`);
      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`);
      }
      const data = await res.json();

      if (data.token) {
        // Use a hardcoded production base URL to ensure the link is always correct and shareable.
        const productionBaseUrl = 'https://dashboard.scvpersonaltraining.com/';
        const url = new URL(productionBaseUrl);
        // Add the client's name to the URL for better readability
        url.searchParams.set('client', selectedClient);
        url.searchParams.set('token', data.token);
        const clientUrl = url.toString();
        
        await navigator.clipboard.writeText(clientUrl);
        setCopyStatus('copied');
      } else {
        console.error('API Error:', data.error);
        alert(`Error al obtener el enlace: ${data.error || 'Respuesta inválida del servidor.'}`);
        setCopyStatus('error');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      alert('Hubo un error de conexión al intentar obtener el enlace.');
      setCopyStatus('error');
    }
  };

  const CopyFeedbackIcon = () => {
    switch (copyStatus) {
      case 'copying':
        return (
          <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'copied':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default: // 'idle'
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  const copyButtonTitle = () => {
    switch (copyStatus) {
      case 'copying':
        return 'Copiando enlace...';
      case 'copied':
        return '¡Enlace copiado!';
      case 'error':
        return 'Error al copiar';
      default:
        return 'Copiar enlace privado del deportista';
    }
  };

  return (
    <header className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-800/50 rounded-lg ${authState !== 'admin' ? 'sm:justify-center' : 'sm:justify-between'}`}>
      <div className="flex items-center gap-4">
          <img src="https://assets.zyrosite.com/dJoby7nkNOfbKLv3/image-5-mjE4G1wPvGIVBng8.png" alt="Dashboard Logo" className="h-10 w-auto" />
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            <span className="text-slate-400 font-medium">Deportista:</span> <span className="text-indigo-400">{clientName}</span>
          </h1>
      </div>
      {authState === 'admin' && clientList.length > 0 && (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
              value={selectedClient}
              onChange={(e) => onClientChange(e.target.value)}
              className="w-full sm:w-auto bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              aria-label="Seleccionar deportista"
              role="listbox"
            >
              {clientList.map(client => <option key={client} value={client}>{client}</option>)}
          </select>
          <button
            onClick={handleCopyLink}
            disabled={copyStatus === 'copying' || !selectedClient}
            className="p-2 rounded-md transition-all bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title={copyButtonTitle()}
            aria-label={copyButtonTitle()}
          >
            <CopyFeedbackIcon />
          </button>
        </div>
      )}
    </header>
  );
};
