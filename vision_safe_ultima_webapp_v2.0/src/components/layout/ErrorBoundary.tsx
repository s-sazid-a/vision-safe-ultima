import React, { ReactNode } from 'react';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: (error: Error) => ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error) {
        console.error('Error caught by boundary:', error);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback && this.state.error) {
                return this.props.fallback(this.state.error);
            }
            return (
                <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                    <h2 className="text-destructive font-bold mb-2">Something went wrong</h2>
                    <p className="text-sm text-destructive/80">{this.state.error?.message}</p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="mt-2 px-3 py-1 bg-destructive text-white rounded text-sm"
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
