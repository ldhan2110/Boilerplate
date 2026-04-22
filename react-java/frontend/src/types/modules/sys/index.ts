import type { DynamicFilterDto } from '@/types/api';

/**
 * Excel Export Result DTO
 * Matches the ExcelExportResultDto from the Java backend
 */
export interface ExcelExportResultDto {
    /** Whether the export is immediate (file data included) or async (background job) */
    immediate: boolean;
    /** File name for the exported Excel */
    fileName?: string;
    /** File data as Blob (only present when immediate is true) */
    fileData?: Blob;
    /** Job ID for tracking async exports (only present when immediate is false) */
    taskId?: string;
    /** Status message */
    message?: string;
}


// Search/Filter form (local form state - not from API)
export type MessageListFilterForm = {
	coId?: string;
	msgId?: string;
	dfltMsgVal?: string;
	mdlNm?: string;
	msgTpVal?: string;
	filters?: DynamicFilterDto[];
};

