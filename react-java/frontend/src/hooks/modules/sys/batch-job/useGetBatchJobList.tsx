import { QUERY_KEY } from '@/constants';
import { getBatchJobList } from '@/services/api';
import type { BatchJobConfigDto, SearchBatchJobConfigDto } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { message } from 'antd';

export const useGetBatchJobList = (request: SearchBatchJobConfigDto) => {
    const query = useQuery<Array<BatchJobConfigDto>>({
        queryKey: [QUERY_KEY.COMMON.GET_BATCH_JOB_LIST, request],
        queryFn: () => getBatchJobList(request),
        staleTime: 0,
        refetchOnWindowFocus: false,
        retry: 0,
        enabled: request.coId != null,
        throwOnError: (error) => {
            message.error(error.message || 'Failed to load Batch Job List data.');
            return false;
        },
    });
    return query;
};
