import React from "react";
import * as XLSX from 'xlsx';

interface ExcelViewerProps {
  blob: Blob;
  zoom: number;
}

export const ExcelViewer = ({ blob, zoom }: ExcelViewerProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [workbook, setWorkbook] = React.useState<XLSX.WorkBook | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (!blob) return;

    setLoading(true);
    setError(null);

    // Read the Excel file
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        setWorkbook(wb);
        setError(null);
      } catch (err) {
        console.error('Error reading Excel file:', err);
        setError(err instanceof Error ? err.message : 'Failed to read Excel file');
        setWorkbook(null);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
      setLoading(false);
    };

    reader.readAsArrayBuffer(blob);
  }, [blob]);

  // Render Excel sheets as HTML tables
  React.useEffect(() => {
    if (!workbook || !containerRef.current) return;

    containerRef.current.innerHTML = '';

    workbook.SheetNames.forEach((sheetName, index) => {
      const sheet = workbook.Sheets[sheetName];
      
      // Convert sheet to HTML
      const htmlString = XLSX.utils.sheet_to_html(sheet, {
        id: `sheet-${index}`,
        editable: false,
      });

      // Create sheet container
      const sheetContainer = document.createElement('div');
      sheetContainer.className = 'excel-sheet-container';
      
      // Add sheet name as header
      const sheetHeader = document.createElement('h3');
      sheetHeader.className = 'excel-sheet-header';
      sheetHeader.textContent = sheetName;
      sheetContainer.appendChild(sheetHeader);

      // Add the HTML table
      const tableWrapper = document.createElement('div');
      tableWrapper.className = 'excel-table-wrapper';
      tableWrapper.innerHTML = htmlString;
      sheetContainer.appendChild(tableWrapper);

      containerRef.current?.appendChild(sheetContainer);

      // Add spacing between sheets (except for the last one)
      if (index < workbook.SheetNames.length - 1) {
        const spacer = document.createElement('div');
        spacer.style.height = '40px';
        containerRef.current?.appendChild(spacer);
      }
    });
  }, [workbook]);

  // Apply zoom through CSS transform
  const containerStyle: React.CSSProperties = {
    transform: `scale(${zoom / 100})`,
    transformOrigin: 'top center',
    transition: 'transform 0.2s ease-in-out',
  };

  if (loading) {
    return (
      <div className="excel-viewer">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading Excel file...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="excel-viewer">
        <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="excel-viewer">
      <div className="excel-viewer-wrapper" style={containerStyle}>
        <div ref={containerRef} className="excel-container" />
      </div>
    </div>
  );
};
