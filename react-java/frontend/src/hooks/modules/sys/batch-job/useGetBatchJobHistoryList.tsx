import { QUERY_KEY } from '@/constants';
import { getBatchJobHistory } from '@/services/api';
import type { BatchJobExecutionHistoryListDto, SearchBatchJobExecutionHistoryDto } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { message } from 'antd';

export const useGetBatchJobHistoryList = (request: SearchBatchJobExecutionHistoryDto, enabled: boolean) => {
    const query = useQuery<BatchJobExecutionHistoryListDto>({
        queryKey: [QUERY_KEY.COMMON.GET_BATCH_JOB_HISTORY_LIST, request],
        queryFn: () => getBatchJobHistory(request),
        staleTime: 0,
        refetchOnWindowFocus: false,
        retry: 0,
        enabled: enabled,
        throwOnError: (error) => {
            message.error(error.message || 'Failed to load Batch Job History List data.');
            return false;
        },
    });
    return query;
};
