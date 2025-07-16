import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
  context?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console with context
    console.group(`🚨 Error Boundary: ${this.props.context || 'Unknown Component'}`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Stack:', error.stack);
    console.groupEnd();
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount < maxRetries) {
      console.log(`🔄 Retrying... (${this.state.retryCount + 1}/${maxRetries})`);
      
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      console.error('❌ Max retries reached, giving up');
    }
  };

  private handleReset = () => {
    console.log('🔄 Resetting error boundary');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallback, maxRetries = 3, context = 'Component' } = this.props;
      const { error, errorInfo, retryCount } = this.state;

      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback;
      }

      // Determine error type for better messaging
      const isCanvasError = error?.message?.toLowerCase().includes('canvas') || 
                          error?.message?.toLowerCase().includes('webgl') ||
                          error?.message?.toLowerCase().includes('context');

      const isNetworkError = error?.message?.toLowerCase().includes('network') ||
                            error?.message?.toLowerCase().includes('fetch') ||
                            error?.message?.toLowerCase().includes('load');

      // Default error boundary UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="text-center max-w-md">
            {/* Error Icon */}
            <div className="text-red-500 text-6xl mb-4">
              {isCanvasError ? '🎨' : isNetworkError ? '🌐' : '⚠️'}
            </div>
            
            {/* Error Title */}
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
              {isCanvasError ? 'Canvas Error' : isNetworkError ? 'Network Error' : 'Something went wrong'}
            </h2>
            
            {/* Error Message */}
            <p className="text-red-700 dark:text-red-300 mb-4">
              {isCanvasError 
                ? 'There was a problem with the canvas rendering system. This might be due to graphics driver issues or browser compatibility.'
                : isNetworkError
                ? 'Network connection issue. Please check your internet connection and try again.'
                : `An error occurred in ${context}. Please try refreshing the page.`
              }
            </p>
            
            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200">
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/40 rounded border text-xs font-mono text-red-800 dark:text-red-200">
                  <div className="mb-2">
                    <strong>Error:</strong> {error?.message}
                  </div>
                  {errorInfo?.componentStack && (
                    <div className="mb-2">
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs mt-1">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                  {error?.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="whitespace-pre-wrap text-xs mt-1">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              {/* Retry Button */}
              {retryCount < maxRetries && (
                <button
                  onClick={this.handleRetry}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200 text-sm font-medium"
                >
                  Retry ({retryCount + 1}/{maxRetries})
                </button>
              )}
              
              {/* Reset Button */}
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors duration-200 text-sm font-medium"
              >
                Reset
              </button>
              
              {/* Reload Button */}
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 text-sm font-medium"
              >
                Reload Page
              </button>
            </div>
            
            {/* Retry Count Display */}
            {retryCount >= maxRetries && (
              <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700 rounded text-sm">
                <p className="text-yellow-800 dark:text-yellow-200">
                  Maximum retry attempts reached. Please reload the page or contact support if the problem persists.
                </p>
              </div>
            )}
            
            {/* Canvas-specific suggestions */}
            {isCanvasError && (
              <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 rounded text-sm">
                <p className="text-blue-800 dark:text-blue-200">
                  <strong>💡 Suggestions:</strong>
                </p>
                <ul className="text-left mt-2 space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• Try using a different browser (Chrome, Firefox, Safari)</li>
                  <li>• Enable hardware acceleration in your browser settings</li>
                  <li>• Update your graphics drivers</li>
                  <li>• Check if WebGL is supported on your device</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Canvas-specific error boundary
export const CanvasErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      context="Canvas Rendering System"
      maxRetries={2}
      onError={(error, errorInfo) => {
        // Additional canvas-specific error handling
        console.error('Canvas error boundary triggered:', {
          error: error.message,
          userAgent: navigator.userAgent,
          webglSupported: !!document.createElement('canvas').getContext('webgl'),
          webgl2Supported: !!document.createElement('canvas').getContext('webgl2'),
          devicePixelRatio: window.devicePixelRatio
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

// Studio-specific error boundary for the main studio page
export const StudioErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      context="Studio Application"
      maxRetries={3}
      onError={(error, errorInfo) => {
        // Studio-specific error handling
        console.error('Studio error boundary triggered:', {
          error: error.message,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};