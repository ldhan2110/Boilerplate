import { QUERY_KEY } from '@/constants';
import { getReport } from '@/services/api';
import type { ReportDto } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { message } from 'antd';

export const useGetReport = (rptCd: string | undefined, enabled?: boolean) => {
	const query = useQuery<ReportDto>({
		queryKey: [QUERY_KEY.MASTER_DATA.REPORT_MANAGEMENT.GET_REPORT, rptCd],
		queryFn: () => getReport(rptCd!),
		staleTime: 0,
		refetchOnWindowFocus: false,
		retry: 0,
		enabled: rptCd != null && enabled !== false,
		throwOnError: (error) => {
			message.error(error.message || 'Failed to load Report data.');
			return false;
		},
	});
	return query;
};
