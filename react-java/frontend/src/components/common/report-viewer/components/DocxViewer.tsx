import React from "react";
import { renderAsync } from 'docx-preview';

interface DocxViewerProps {
  blob: Blob;
  zoom: number;
}

export const DocxViewer = ({ blob, zoom }: DocxViewerProps) => {
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!containerRef.current || !blob) return;
    
        // Clear previous content
        containerRef.current.innerHTML = '';
    
        // Render the DOCX document
        renderAsync(blob, containerRef.current, undefined, {
          className: 'docx-preview-container',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          experimental: false,
          trimXmlDeclaration: true,
          useBase64URL: true,
          renderChanges: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
        }).catch((error) => {
          console.error('Error rendering DOCX:', error);
          if (containerRef.current) {
            containerRef.current.innerHTML = '<p style="color: red;">Failed to render document</p>';
          }
        });
    }, [blob]);

     // Apply zoom through CSS transform
    const containerStyle: React.CSSProperties = {
        transform: `scale(${zoom / 100})`,
        transformOrigin: 'top center',
        transition: 'transform 0.2s ease-in-out',
    };

    return (
        <div className="docx-viewer">
          <div className="docx-viewer-wrapper" style={containerStyle}>
            <div ref={containerRef} className="docx-container" />
          </div>
        </div>
    );
};