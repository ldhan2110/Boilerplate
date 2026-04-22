import React from 'react';
import printJS from 'print-js';
import { Button, Flex, Modal, Select, Spin, message } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, RedoOutlined, DownloadOutlined, PrinterOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { PdfViewer, DocxViewer, ExcelViewer } from './components';
import './ReportViewer.css';
import axios from 'axios';
import { authService } from '@/services/auth/authJwtService';
import { getApiUrl } from '@/configs';
import { useAppTranslate } from '@/hooks';
interface ReportViewerProps {
  endpoint: string;
  reportType: 'pdf' | 'docx' | 'xlsx' | 'unknown';
  filename: string;
  open: boolean;
  parameters?: Record<string, unknown>;
  title?: string;
  width?: number | string;
  onClose: () => void;
  /** Chunked preview: load more on scroll (e.g. payslip); opt in from feature code, not URL heuristics. */
  enablePreviewInfiniteScroll?: boolean;
  /** If returns true, full download was handled (e.g. payslip async export). */
  onFullDownload?: (args: ReportFullDownloadArgs) => Promise<boolean>;
}

export type ReportViewerViewType = 'pdf' | 'docx' | 'xlsx' | 'unknown';

export type ReportFullDownloadArgs = {
  fullParams: Record<string, unknown>;
  currentViewType: ReportViewerViewType;
  filename: string;
};

type ViewType = ReportViewerViewType;

export const ReportViewer: React.FC<ReportViewerProps> = ({
  endpoint,
  reportType,
  filename,
  open,
  title = 'Report Viewer',
  parameters = {},
  width = 1200,
  onClose,
  enablePreviewInfiniteScroll = false,
  onFullDownload,
}) => {
  const { t } = useAppTranslate();
  const [blob, setBlob] = React.useState<Blob | null>(null);
  const [currentViewType, setCurrentViewType] = React.useState<ViewType>(reportType);
  const [zoom, setZoom] = React.useState<number>(100);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [isAppending, setIsAppending] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pdfPageNumber, setPdfPageNumber] = React.useState<number>(1);
  const [pdfNumPages, setPdfNumPages] = React.useState<number>(0);
  const [currentPreviewLimit, setCurrentPreviewLimit] = React.useState<number | null>(null);
  const [hasMorePreview, setHasMorePreview] = React.useState(false);
  const lastScrollTopRef = React.useRef(0);
  const lastBlobSizeRef = React.useRef(0);
  const [backgroundDownloading, setBackgroundDownloading] = React.useState(false);

  const selectedEmpeIds = React.useMemo(
    () => (Array.isArray(parameters?.empeIds) ? (parameters.empeIds as string[]) : []),
    [parameters],
  );
  const selectedTotal = selectedEmpeIds.length;

  // Build URL: PDF conversion, or XLSX endpoints that require ?convert=xlsx (e.g. printMonthlyInsuranceFee)
  const buildFetchUrl = React.useCallback(
    (convertToPdf: boolean) => {
      const base = getApiUrl(endpoint);
      const join = (q: string) => (base.includes('?') ? `${base}&${q}` : `${base}?${q}`);
      if (convertToPdf) {
        return join('convert=pdf');
      }
      if (reportType === 'xlsx') {
        return join('convert=xlsx');
      }
      return base;
    },
    [endpoint, reportType],
  );

  // Fetch the blob from the endpoint
  const fetchBlob = React.useCallback(async (
    convertToPdf: boolean = false,
    overrideParams?: Record<string, unknown>,
    append: boolean = false,
  ): Promise<Blob | null> => {
    if (append) {
      setIsAppending(true);
    } else {
      setLoading(true);
      setError(null);
    }
    
    try {
      const url = buildFetchUrl(convertToPdf);
      const response = await axios.post(url, overrideParams ?? parameters, {
        responseType: 'blob',
        headers: {
          withCredentials: true,
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authService.getAccessToken()}`,
        },
      });

      setBlob(response.data);
      return response.data as Blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load document';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      if (append) {
        setIsAppending(false);
      } else {
        setLoading(false);
      }
    }
  }, [buildFetchUrl, endpoint, parameters]);

  // Initial fetch when modal opens
  React.useEffect(() => {
    if (open) {
      const initialLimit =
        typeof parameters?.previewLimit === 'number' && parameters.previewLimit > 0
          ? parameters.previewLimit
          : null;
      setCurrentPreviewLimit(initialLimit);
      setHasMorePreview(Boolean(initialLimit && (selectedTotal <= 0 || initialLimit < selectedTotal)));
      fetchBlob(false, parameters).then((firstBlob) => {
        lastBlobSizeRef.current = firstBlob?.size ?? 0;
      });
      setCurrentViewType(reportType);
    } else {
      // Reset state when modal closes
      setBlob(null);
      setCurrentViewType(reportType);
      setZoom(100);
      setError(null);
      setCurrentPreviewLimit(null);
      setHasMorePreview(false);
      setIsAppending(false);
      lastScrollTopRef.current = 0;
      lastBlobSizeRef.current = 0;
    }
  }, [open, fetchBlob, reportType, parameters, selectedTotal]);

  // Handle view type change
  const handleViewTypeChange = (value: string) => {
    const newViewType = value as ViewType;
    setCurrentViewType(newViewType);
    setZoom(100); // Reset zoom when switching view type
    setPdfPageNumber(1);
    setPdfNumPages(0);

    if (newViewType === 'pdf' && reportType !== 'pdf') {
      // Convert to PDF
      fetchBlob(true, currentPreviewLimit ? { ...parameters, previewLimit: currentPreviewLimit } : parameters);
    } else if (newViewType === reportType) {
      // Switch back to original format
      fetchBlob(false, currentPreviewLimit ? { ...parameters, previewLimit: currentPreviewLimit } : parameters);
    }
  };

  const handleContentScroll = React.useCallback((event: React.UIEvent<HTMLDivElement>) => {
    if (!enablePreviewInfiniteScroll || loading || isAppending || !hasMorePreview || !currentPreviewLimit) {
      return;
    }
    const target = event.currentTarget;
    const currentScrollTop = target.scrollTop;
    if (currentScrollTop <= 0 || currentScrollTop <= lastScrollTopRef.current) {
      lastScrollTopRef.current = currentScrollTop;
      return;
    }
    lastScrollTopRef.current = currentScrollTop;
    if (target.scrollHeight <= target.clientHeight + 8) {
      return;
    }
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (distanceToBottom > 120) {
      return;
    }

    const nextLimit = selectedTotal > 0
      ? Math.min(currentPreviewLimit + 50, selectedTotal)
      : currentPreviewLimit + 50;
    if (selectedTotal > 0 && nextLimit <= currentPreviewLimit) {
      setHasMorePreview(false);
      return;
    }

    setCurrentPreviewLimit(nextLimit);
    if (selectedTotal > 0) {
      setHasMorePreview(nextLimit < selectedTotal);
    }
    fetchBlob(false, { ...parameters, previewLimit: nextLimit }, true).then((newBlob) => {
      const newSize = newBlob?.size ?? 0;
      if (newSize <= lastBlobSizeRef.current) {
        setHasMorePreview(false);
      }
      lastBlobSizeRef.current = newSize;
    });
  }, [enablePreviewInfiniteScroll, loading, isAppending, hasMorePreview, currentPreviewLimit, selectedTotal, fetchBlob, parameters]);

  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  // Download file (always full dataset, no previewLimit cap)
  const handleDownload = async () => {
    if (!blob) return;
    try {
      const fullParams = { ...parameters };
      if ('previewLimit' in fullParams) {
        delete (fullParams as { previewLimit?: unknown }).previewLimit;
      }
      if (onFullDownload) {
        setBackgroundDownloading(true);
        try {
          const handled = await onFullDownload({
            fullParams,
            currentViewType,
            filename,
          });
          if (handled) {
            return;
          }
        } finally {
          setBackgroundDownloading(false);
        }
      }

      const url = buildFetchUrl(currentViewType === 'pdf' && reportType !== 'pdf');
      const response = await axios.post(url, fullParams, {
        responseType: 'blob',
        headers: {
          withCredentials: true,
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authService.getAccessToken()}`,
        },
      });

      const fullBlob = response.data as Blob;
      const downloadUrl = window.URL.createObjectURL(fullBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${filename}_${Date.now()}.${currentViewType}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download full document';
      message.error(errorMessage);
      setBackgroundDownloading(false);
    }
  };

  // Get view type options
  const getViewTypeOptions = () => {
    const baseLabel =
      reportType === 'pdf'
        ? 'PDF'
        : reportType === 'docx'
          ? t('Word')
          : reportType === 'xlsx'
            ? 'Excel'
            : t('Default');

    const options = [{ label: baseLabel, value: reportType }];

    // Allow switching to PDF if original type is not PDF
    if (reportType !== 'pdf') {
      options.push({ label: 'PDF', value: 'pdf' });
    }

    return options;
  };

  // PDF document load: sync page count to parent for toolbar
  const handlePdfDocumentLoadSuccess = React.useCallback((payload: { numPages: number }) => {
    setPdfNumPages(payload.numPages);
    setPdfPageNumber(1);
  }, []);

  // Print: PDF via print-js; Excel/DOCX preview via HTML print of the rendered viewer
  const handlePrint = () => {
    if (!blob) return;
    if (currentViewType === 'pdf') {
      const url = URL.createObjectURL(blob);
      printJS({ printable: url, type: 'pdf', onLoadingEnd: () => URL.revokeObjectURL(url) });
      return;
    }
    if (currentViewType === 'xlsx' || currentViewType === 'docx') {
      const el = document.getElementById('report-viewer-printable-html');
      if (el) {
        printJS({
          printable: 'report-viewer-printable-html',
          type: 'html',
          scanStyles: true,
          targetStyles: ['*'],
        });
        return;
      }
      message.warning(t('Preview is not ready to print. Please wait for the document to load.'));
      return;
    }
    message.info(t('Print is available for PDF, Word, or Excel view. Switch view or download and print.'));
  };

  // Render the appropriate viewer based on current view type
  const renderViewer = () => {
    if (!blob) return null;

    switch (currentViewType) {
      case 'pdf':
        return (
          <PdfViewer
            blob={blob}
            zoom={zoom}
            pageNumber={pdfPageNumber}
            onPageChange={setPdfPageNumber}
            onDocumentLoadSuccess={handlePdfDocumentLoadSuccess}
            hidePagination
          />
        );
      case 'docx':
        return <DocxViewer blob={blob} zoom={zoom} />;
      case 'xlsx':
        return <ExcelViewer blob={blob} zoom={zoom} />;
      default:
        return <div>Unsupported document type</div>;
    }
  };

  return (
    <Modal
      title={t(title) || `${t('Report Viewer')} - ${filename}`}
      open={open}
      onCancel={onClose}
      footer={
        <Flex justify="end" gap={8}>
          <Button type="primary" key="close" onClick={onClose}>
            {t('Close')}
          </Button>
        </Flex>
      }
      width={width}
      centered
      className="report-viewer-modal"
      styles={{
        body: { 
          height: '70vh', 
          overflow: 'hidden',
          padding: '20px'
        }
      }}
      destroyOnHidden
    >
      <div className="report-viewer">
        {/* Toolbar */}
        <div className="report-viewer-toolbar">
          <div className="report-viewer-toolbar-inner">
            {/* Page indicator (PDF: X / Y; others: hidden) */}
            {currentViewType === 'pdf' && (
              <>
                <span className="report-viewer-page-info">
                  {pdfPageNumber} / {pdfNumPages || '—'}
                </span>
                <span className="report-viewer-toolbar-divider" />
              </>
            )}

            {/* Zoom: - , 100% , + */}
            <Button
              type="text"
              className="report-viewer-toolbar-btn"
              icon={<ZoomOutOutlined />}
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              title={t('Zoom Out')}
            />
            <span className="report-viewer-zoom-level">{zoom}%</span>
            <Button
              type="text"
              className="report-viewer-toolbar-btn"
              icon={<ZoomInOutlined />}
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              title={t('Zoom In')}
            />

            <span className="report-viewer-toolbar-divider" />

            <Button
              type="text"
              className="report-viewer-toolbar-btn"
              icon={<RedoOutlined />}
              onClick={handleResetZoom}
              title={t('Reset')}
            />

            {/* PDF: Previous / Next */}
            {currentViewType === 'pdf' && (
              <>
                <span className="report-viewer-toolbar-divider" />
                <Button
                  type="text"
                  className="report-viewer-toolbar-btn"
                  icon={<LeftOutlined />}
                  onClick={() => setPdfPageNumber((p) => Math.max(1, p - 1))}
                  disabled={!blob || pdfPageNumber <= 1 || pdfNumPages === 0}
                  title={t('Previous')}
                />
                <Button
                  type="text"
                  className="report-viewer-toolbar-btn"
                  icon={<RightOutlined />}
                  onClick={() => setPdfPageNumber((p) => Math.min(pdfNumPages, p + 1))}
                  disabled={!blob || pdfPageNumber >= pdfNumPages || pdfNumPages === 0}
                  title={t('Next')}
                />
              </>
            )}

            <span className="report-viewer-toolbar-divider" />

            {/* View type */}
            <Select
              value={currentViewType}
              onChange={handleViewTypeChange}
              options={getViewTypeOptions()}
              className="report-viewer-toolbar-select"
              style={{ width: 100 }}
            />

            <span className="report-viewer-toolbar-divider" />

            {/* Download & Print (icon only, like reference) */}
            <Button
              type="text"
              className="report-viewer-toolbar-btn"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              disabled={!blob || backgroundDownloading}
              title={t('Download')}
            />
            <Button
              type="text"
              className="report-viewer-toolbar-btn"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              disabled={!blob}
              title={t('Print')}
            />
          </div>
        </div>

        {/* Viewer Content */}
        <div className="report-viewer-content" onScroll={handleContentScroll} style={{ height: '100%', overflow: 'auto' }}>
          {loading && !blob && (
            <div className="report-viewer-loading">
              <Spin size="large" tip="Loading document..." />
            </div>
          )}
          
          {error && (
            <div className="report-viewer-error">
              <p>Error: {error}</p>
            </div>
          )}
          
          {blob && !error && (
            <div
              id={
                currentViewType === 'xlsx' || currentViewType === 'docx'
                  ? 'report-viewer-printable-html'
                  : undefined
              }
              className={
                currentViewType === 'xlsx' || currentViewType === 'docx'
                  ? 'report-viewer-print-region'
                  : undefined
              }
            >
              {renderViewer()}
            </div>
          )}
          {blob && isAppending && (
            <div className="report-viewer-loading" style={{ position: 'static', minHeight: 64 }}>
              <Spin size="small" tip={t('Loading more...')} />
            </div>
          )}
          {!blob && !loading && !error && <div />}
        </div>
      </div>
    </Modal>
  );
};