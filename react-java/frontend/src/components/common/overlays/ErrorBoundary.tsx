import React from 'react';
import { Button } from 'antd';

import type { ErrorBoundaryProps, ErrorBoundaryState } from '@/types';
import { useAppTranslate } from '@/hooks';

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can log error info here
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const handleRefresh = this.props.handleRefresh ?? (() => window.location.reload());
      return <OopsSomethingWentWrong handleRefresh={handleRefresh} />;
    }
    return this.props.children;
  }
}

function OopsSomethingWentWrong({
  handleRefresh,
}: {
  handleRefresh: () => void;
}) {
  const { t } = useAppTranslate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "85vh",
        minHeight: "-webkit-fill-available",
        background: "linear-gradient(135deg, #f0f4ff 0%, #fafafa 100%)",
        padding: "clamp(16px, 4vw, 40px) 20px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
          padding: "clamp(28px, 5vw, 56px) clamp(20px, 5vw, 48px) clamp(24px, 4vw, 48px)",
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "clamp(48px, 10vw, 72px)",
            marginBottom: "16px",
            lineHeight: 1,
          }}
        >
          😵
        </div>
        <h1
          style={{
            fontSize: "clamp(18px, 4vw, 26px)",
            fontWeight: 700,
            color: "#1a1a2e",
            margin: "0 0 12px",
          }}
        >
          {t("Oops, Something went wrong")}
        </h1>
        <p
          style={{
            fontSize: "clamp(13px, 2vw, 15px)",
            color: "#6b7280",
            margin: "0 0 32px",
            lineHeight: 1.6,
          }}
        >
          {t("We're sorry, but an unexpected error has occurred.")}
        </p>
        <Button
          type="primary"
          size="large"
          onClick={handleRefresh}
          style={{
            borderRadius: "10px",
            height: "44px",
            paddingInline: "36px",
            fontWeight: 600,
            fontSize: "clamp(13px, 2vw, 15px)",
          }}
        >
          {t("Refresh")}
        </Button>
      </div>
    </div>
  );
}

export default ErrorBoundary;
