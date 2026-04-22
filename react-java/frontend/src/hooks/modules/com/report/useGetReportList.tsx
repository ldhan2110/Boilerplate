import { QUERY_KEY } from '@/constants';
import { getReportList } from '@/services/api';
import type { ReportListDto, SearchReportDto } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { message } from 'antd';

export const useGetReportList = (request: SearchReportDto) => {
	const query = useQuery<ReportListDto>({
		queryKey: [QUERY_KEY.MASTER_DATA.REPORT_MANAGEMENT.GET_REPORT_LIST, request],
		queryFn: () => getReportList(request),
		staleTime: 0,
		refetchOnWindowFocus: false,
		retry: 0,
		enabled: !!request.coId,
		throwOnError: (error) => {
			message.error(error.message || 'Failed to load Report List data.');
			return false;
		},
	});
	return query;
};
