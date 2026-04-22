export interface ErrorBoundaryProps {
  children: React.ReactNode;
  handleRefresh?: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
}
