import { QUERY_KEY } from '@/constants';
import { getBatchJob } from '@/services/api';
import type { BatchJobConfigDto, SearchBatchJobConfigDto } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { message } from 'antd';

export const useGetBatchJob = (request: SearchBatchJobConfigDto) => {
    const query = useQuery<BatchJobConfigDto>({
        queryKey: [QUERY_KEY.COMMON.GET_BATCH_JOB, request],
        queryFn: () => getBatchJob(request),
        staleTime: 0,
        refetchOnWindowFocus: false,
        retry: 0,
        enabled: request.coId != null,
        throwOnError: (error) => {
            message.error(error.message || 'Failed to load Batch Job data.');
            return false;
        },
    });
    return query;
};
