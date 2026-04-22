import { useState } from 'react';
import { App } from 'antd';
import { useAppTranslate } from './useAppTranslate';
import { useShowMessage } from './useShowMessage';
import type { ExcelExportResultDto } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEY } from '@/constants';
import appStore from '@/stores/AppStore';

/**
 * Generic Excel Export Hook
 * 
 * @template TRequest - The type of the request object (e.g., SearchUserDto)
 * @param exportService - The export service function that returns ExcelExportResultDto
 * @param options - Optional configuration
 * @returns Object containing export function and loading state
 * 
 * @example
 * ```tsx
 * const { handleExport, isExporting } = useExcelExport(exportExcel, {
 *   defaultFileName: 'users.xlsx',
 *   confirmAsyncExport: true,
 *   onSuccess: () => console.log('Export completed'),
 * });
 * 
 * // In your component
 * <Button loading={isExporting} onClick={() => handleExport(searchRequest)}>
 *   Export Excel
 * </Button>
 * ```
 */
export interface UseExcelExportOptions {
    /** Default filename if not provided by server */
    defaultFileName?: string;
    /** Show confirmation dialog for async exports */
    confirmAsyncExport?: boolean;
    /** Custom success message */
    successMessage?: string;
    /** Custom error message */
    errorMessage?: string;
    /** Callback when export succeeds */
    onSuccess?: (result: ExcelExportResultDto) => void;
    /** Callback when export fails */
    onError?: (error: Error) => void;
    /** Callback when async export is confirmed */
    onAsyncConfirmed?: (jobId: string) => void;
    /** Callback when async export is cancelled */
    onAsyncCancelled?: (jobId: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useExcelExport<TRequest = any>(
    exportService: (request: TRequest, pathParams?: string) => Promise<ExcelExportResultDto>,
    options: UseExcelExportOptions = {}
) {
    const {
        defaultFileName = 'export.xlsx',
        confirmAsyncExport = true,
        successMessage,
        errorMessage,
        onSuccess,
        onError,
        onAsyncConfirmed,
        onAsyncCancelled,
    } = options;

    const queryClient = useQueryClient();
    const [isExporting, setIsExporting] = useState(false);
    const { message } = App.useApp();
    const { t } = useAppTranslate();
    const { showConfirmMessage } = useShowMessage();
    const { setHasBackgroundTask } = appStore;

    /**
     * Trigger browser download for a blob
     */
    const downloadBlob = (blob: Blob, fileName: string) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    };

    /**
     * Handle async export with optional confirmation
     */
    const handleAsyncExport = async (result: ExcelExportResultDto) => {
        const asyncMessage =
            result.message ||
            t('The export is large and will be processed in the background. Do you want to continue?');

        queryClient.invalidateQueries({
            queryKey: [QUERY_KEY.COMMON.GET_EXPORT_HISTORY_LIST],
        });

        if (confirmAsyncExport) {
            // Show confirmation dialog
            showConfirmMessage(
                asyncMessage,
                () => {
                    // User confirmed
                    message.info(t('Export job started. You will be notified when it is ready.'));
                    setHasBackgroundTask(true);
                    onAsyncConfirmed?.(result.taskId || '');
                    onSuccess?.(result);
                },
                () => {
                    // User cancelled
                    onAsyncCancelled?.(result.taskId || '');
                }
            );
        } else {
            // No confirmation needed, just show info
            message.info(asyncMessage);
            onAsyncConfirmed?.(result.taskId || '');
            onSuccess?.(result);
        }
    };

    /**
     * Main export handler
     */
    const handleExport = async (request: TRequest, customFileName?: string, pathParams?: string) => {
        try {
            setIsExporting(true);

            // Call the export service
            const result = await exportService(request, pathParams);

            if (result.immediate && result.fileData) {
                // Immediate download
                const fileName = customFileName || result.fileName || defaultFileName;
                downloadBlob(result.fileData, fileName);
                message.success(successMessage || t('Excel file downloaded successfully'));
                onSuccess?.(result);
            } else {
                // Async export
                await handleAsyncExport(result);
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown error');
            message.error(errorMessage || t('Failed to export Excel file'));
            console.error('Export error:', err);
            onError?.(err);
        } finally {
            setIsExporting(false);
        }
    };

    return {
        /** Function to trigger export */
        handleExport,
        /** Loading state */
        isExporting,
        /** Manual download function (if needed) */
        downloadBlob,
    };
}
