import { useState } from "react";

interface UseReportViewerReturn {
  visible: boolean;
  openReport: (
    endpoint: string,
    title?: string,
    filename?: string,
    parameters?: Record<string, unknown>
  ) => void;
  closeReport: () => void;
  currentReport: {
    endpoint: string;
    title: string;
    filename: string;
    parameters: Record<string, unknown>;
  } | null;
}

export const useReportViewer = (): UseReportViewerReturn => {
  const [visible, setVisible] = useState(false);
  const [currentReport, setCurrentReport] = useState<{
    endpoint: string;
    title: string;
    filename: string;
    parameters: Record<string, unknown>;
  } | null>(null);

  const openReport = (
    endpoint: string,
    title: string = "Report Viewer",
    filename: string = "report.pdf",
    parameters: Record<string, unknown> = {}
  ) => {
    setCurrentReport({ endpoint, title, filename, parameters });
    setVisible(true);
  };

  const closeReport = () => {
    setVisible(false);
    setCurrentReport(null);
  };

  return {
    visible,
    openReport,
    closeReport,
    currentReport,
  };
};
