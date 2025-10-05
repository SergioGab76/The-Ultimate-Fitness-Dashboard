import React, { useState } from 'react';

interface AdminTokenPromptProps {
  onTokenSubmit: (token: string) => void;
}

export const AdminTokenPrompt: React.FC<AdminTokenPromptProps> = ({ onTokenSubmit }) => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      setIsLoading(true);
      onTokenSubmit(token.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 p-4 text-center bg-slate-900">
      <img src="https://assets.zyrosite.com/dJoby7nkNOfbKLv3/image-5-mjE4G1wPvGIVBng8.png" alt="Dashboard Logo" className="h-16 w-auto mb-4" />
      <h1 className="text-2xl font-bold text-white">Acceso de Administrador</h1>
      <p className="text-slate-400 max-w-sm">
        Para continuar, por favor ingresa tu token de administrador.
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-sm mt-4">
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Ingresa tu token aquí"
            className="bg-slate-800 border border-slate-700 text-white rounded-md p-3 text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            aria-label="Admin Token"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="w-full flex items-center justify-center px-4 py-3 font-medium rounded-md transition-colors bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
            disabled={!token.trim() || isLoading}
          >
            {isLoading ? (
               <>
                <svg className="h-5 w-5 animate-spin mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verificando...
              </>
            ) : 'Continuar'}
          </button>
        </div>
      </form>
    </div>
  );
};
