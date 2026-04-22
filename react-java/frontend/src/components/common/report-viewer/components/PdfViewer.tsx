import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Button, Space } from "antd";
import React from "react";
import { Document, Page } from "react-pdf";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { getPdfWorkerReady } from '../pdf-worker';

interface PDFViewerProps {
    blob: Blob;
    zoom: number;
    /** Controlled current page (1-based). When provided, parent owns pagination. */
    pageNumber?: number;
    /** Called when user changes page (e.g. prev/next). Only used when pageNumber is controlled. */
    onPageChange?: (page: number) => void;
    /** Called when document loads with total page count. Parent can use this for toolbar display. */
    onDocumentLoadSuccess?: (payload: { numPages: number }) => void;
    /** When true, do not render the bottom pagination bar (use when parent shows pagination in toolbar). */
    hidePagination?: boolean;
}

export const PdfViewer = ({
    blob,
    zoom,
    pageNumber: controlledPageNumber,
    onPageChange,
    onDocumentLoadSuccess: onDocumentLoadSuccessProp,
    hidePagination = false,
}: PDFViewerProps) => {
    const [numPages, setNumPages] = React.useState<number>(0);
    const [internalPageNumber, setInternalPageNumber] = React.useState<number>(1);
    const [fileUrl, setFileUrl] = React.useState<string>('');
    const [workerReady, setWorkerReady] = React.useState(false);

    const isControlled = controlledPageNumber !== undefined;
    const pageNumber = isControlled ? controlledPageNumber : internalPageNumber;

    React.useEffect(() => {
        getPdfWorkerReady().then(() => setWorkerReady(true));
    }, []);

    // Calculate scale based on zoom percentage
    const scale = zoom / 100;

    const onDocumentLoadSuccess = ({ numPages: total }: { numPages: number }) => {
        setNumPages(total);
        if (!isControlled) {
            setInternalPageNumber(1);
        }
        onDocumentLoadSuccessProp?.({ numPages: total });
    };

    const onDocumentLoadError = (error: Error) => {
        console.error('Error loading PDF:', error);
    };

    // Create object URL from blob
    React.useEffect(() => {
        const url = URL.createObjectURL(blob);
        setFileUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [blob]);

    const goToPrevPage = () => {
        const next = Math.max(pageNumber - 1, 1);
        if (isControlled) {
            onPageChange?.(next);
        } else {
            setInternalPageNumber(next);
        }
    };

    const goToNextPage = () => {
        const next = Math.min(pageNumber + 1, numPages);
        if (isControlled) {
            onPageChange?.(next);
        } else {
            setInternalPageNumber(next);
        }
    };

    if (!workerReady || !fileUrl) {
        return <div className="pdf-viewer"><div>Loading PDF...</div></div>;
    }

    return (
        <div className="pdf-viewer">
            <div className="pdf-viewer-container">
                <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={<div>Loading PDF...</div>}
                >
                    <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                    />
                </Document>
            </div>

            {!hidePagination && (
                <div className="pdf-viewer-pagination">
                    <Space>
                        <Button
                            icon={<LeftOutlined />}
                            onClick={goToPrevPage}
                            disabled={pageNumber <= 1}
                        >
                            Previous
                        </Button>

                        <span>
                            Page {pageNumber} of {numPages || '—'}
                        </span>

                        <Button
                            icon={<RightOutlined />}
                            onClick={goToNextPage}
                            disabled={pageNumber >= numPages || numPages === 0}
                        >
                            Next
                        </Button>
                    </Space>
                </div>
            )}
        </div>
    );
};