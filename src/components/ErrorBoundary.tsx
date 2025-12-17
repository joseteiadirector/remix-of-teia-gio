import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log erro no console para debug
    console.error('ErrorBoundary caught error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Render fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback padrão - sem dependências externas
      return (
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#0f172a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              maxWidth: "560px",
              width: "100%",
              backgroundColor: "#1e293b",
              borderRadius: "12px",
              padding: "32px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#f1f5f9",
                marginBottom: "8px",
              }}
            >
              Algo deu errado
            </h1>
            <p style={{ color: "#94a3b8", marginBottom: "16px" }}>
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>

            {this.state.error?.message && (
              <p style={{
                color: "#cbd5e1",
                margin: "0 0 14px",
                fontSize: "13px",
                lineHeight: 1.4,
                wordBreak: "break-word",
              }}>
                <strong>Erro:</strong> {this.state.error.message}
              </p>
            )}

            {(this.state.error?.message || this.state.error?.stack || this.state.errorInfo?.componentStack) && (
              <details
                open={import.meta.env.DEV}
                style={{
                  textAlign: "left",
                  margin: "0 0 16px",
                  background: "rgba(2, 6, 23, 0.35)",
                  border: "1px solid rgba(148, 163, 184, 0.20)",
                  borderRadius: "10px",
                  padding: "12px",
                }}
              >
                <summary style={{ cursor: "pointer", color: "#cbd5e1", fontSize: "13px" }}>
                  Ver detalhes técnicos
                </summary>
                <pre
                  style={{
                    marginTop: "10px",
                    color: "#cbd5e1",
                    fontSize: "12px",
                    lineHeight: 1.4,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: "240px",
                    overflow: "auto",
                  }}
                >
                  {this.state.error?.stack || this.state.error?.message}
                  {this.state.errorInfo?.componentStack
                    ? `\n\n--- Component stack ---\n${this.state.errorInfo.componentStack}`
                    : ""}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: "#8b5cf6",
                color: "white",
                padding: "12px 24px",
                borderRadius: "8px",
                border: "none",
                fontSize: "16px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
