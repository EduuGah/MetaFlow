import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportError } from '../lib/logger';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * Última linha de defesa. Sem isto, qualquer exceção em render derrubava a
 * árvore inteira e o usuário ficava com uma página em branco sem saída.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError('render', error, { componentStack: info.componentStack });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-dvh grid place-items-center px-5">
        <div className="panel max-w-narrow w-full p-8 text-center">
          <p className="eyebrow">Erro inesperado</p>
          <h1 className="text-2xl mt-3">Algo quebrou nesta tela</h1>
          <p className="text-sm text-fg-muted mt-3 max-w-prose mx-auto">
            Seus dados não foram perdidos — eles ficam no servidor, não nesta página.
            Recarregar costuma resolver.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center mt-7">
            <button type="button" onClick={() => window.location.reload()} className="btn btn-primary btn-lg">
              Recarregar a página
            </button>
            <a href="/dashboard" className="btn btn-secondary btn-lg">
              Ir para o painel
            </a>
          </div>
        </div>
      </div>
    );
  }
}
