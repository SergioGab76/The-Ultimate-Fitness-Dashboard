import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: undefined,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 p-4 text-center" role="alert">
          <h1 className="text-2xl font-bold text-red-400">¡Ups! Algo salió mal.</h1>
          <p className="text-slate-400">
            Ocurrió un error inesperado. Por favor, intenta refrescar la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 font-medium rounded-md transition-colors bg-indigo-600 text-white hover:bg-indigo-500"
          >
            Refrescar Página
          </button>
          <details className="mt-4 text-left w-full max-w-xl">
            <summary className="cursor-pointer text-slate-500 hover:text-slate-300">
              Detalles del Error
            </summary>
            <pre className="mt-2 p-2 bg-slate-800 border border-slate-700 rounded-md text-sm text-red-300 overflow-auto">
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
