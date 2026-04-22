import { message } from "antd";
import React from "react";

export const useDownloadBlob = () => {
    const downloadBlob = React.useCallback((blob: Blob, filename: string) => {
      try {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        window.URL.revokeObjectURL(url);
        
        message.success(`Downloaded ${filename}`);
      } catch (error) {
        message.error('Failed to download file');
        console.error('Download error:', error);
      }
    }, []);
  
    return { downloadBlob };
  };