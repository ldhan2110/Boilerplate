import { QUERY_KEY, POLL_INTERVAL } from '@/constants';
import { getExportHistoryList } from '@/services/api';
import type { ExportJobListDto, SearchExportJobDto } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { message } from 'antd';

export const useGetExportHistoryList = (request: SearchExportJobDto, enabled?: boolean) => {
    const query = useQuery<ExportJobListDto>({
        queryKey: [QUERY_KEY.COMMON.GET_EXPORT_HISTORY_LIST, request],
        queryFn: () => getExportHistoryList(request),
        staleTime: 0,
        refetchOnWindowFocus: false,
        retry: 0,
        enabled: enabled,
        throwOnError: (error) => {
            message.error(error.message || 'Failed to load Export History List data.');
            return false;
        },
        refetchInterval: (query) => {
            if (!enabled) return false;
            const data = query.state.data;

            // Stop polling if no data or all jobs are completed/failed
            if (!data || data.jobs?.length === 0) return false;

            const hasActiveJobs = data.jobs?.some(
                (job) => job.jbSts === 'PENDING' || job.jbSts === 'PROCESSING' || job.jbSts === 'PENDING_CONFIRMATION' || job.jbSts === 'QUEUED'
            );

            return hasActiveJobs ? POLL_INTERVAL : false;
        },
    });
    return query;
};
