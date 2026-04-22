import { message } from 'antd';
import axios from 'axios';
import React from 'react';

interface UseFetchReportOptions {
    endpoint: string;
    convertToPdf?: boolean;
    onSuccess?: (blob: Blob) => void;
    onError?: (error: Error) => void;
}

export const useFetchReport = ({
    endpoint,
    convertToPdf = false,
    onSuccess,
    onError
}: UseFetchReportOptions) => {
    const [blob, setBlob] = React.useState<Blob | null>(null);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string | null>(null)

    const fetchReport = React.useCallback(async () => {
        setLoading(true);
        setError(null);
      
        try {
          // Build URL with conversion parameter if needed
          const url = convertToPdf
            ? `${endpoint}${endpoint.includes('?') ? '&' : '?'}convert=pdf`
            : endpoint;
      
          const response = await axios.get(url, {
            responseType: 'blob',
          });
      
          const blobData = response.data;
      
          // Validate blob
          if (!(blobData instanceof Blob) || blobData.size === 0) {
            throw new Error('Received empty blob from server');
          }
      
          setBlob(blobData);
      
          if (onSuccess) {
            onSuccess(blobData);
          }
        } catch (err: unknown) {
          let errorMessage = 'Failed to fetch report';
      
          if (axios.isAxiosError(err)) {
            errorMessage =
              err.response?.status
                ? `HTTP error! status: ${err.response.status} - ${err.response.statusText}`
                : err.message;
          } else if (err instanceof Error) {
            errorMessage = err.message;
          }
      
          setError(errorMessage);
          message.error(errorMessage);
      
          if (onError && err instanceof Error) {
            onError(err);
          }
        } finally {
          setLoading(false);
        }
    }, [endpoint, convertToPdf, onSuccess, onError]);
    
      // Fetch on mount
    React.useEffect(() => {
        fetchReport();
    }, [fetchReport]);
    
    return {
        blob,
        loading,
        error,
        refetch: fetchReport
    };
};