import { QUERY_KEY } from '@/constants';
import { getMasterCode } from '@/services/api';
import type { MasterCodeDto, SearchMasterCodeDto } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { message } from 'antd';

export const useGetMasterCode = (request: SearchMasterCodeDto, enabled?: boolean) => {
	const query = useQuery<MasterCodeDto>({
		queryKey: [QUERY_KEY.MASTER_DATA.MASTER_CODE_MANAGEMENT.GET_MASTER_CODE, request],
		queryFn: () => getMasterCode(request),
		staleTime: 0,
		refetchOnWindowFocus: false,
		retry: 0,
		enabled: request.coId != null && enabled,
		throwOnError: (error) => {
			message.error(error.message || 'Failed to load Master Code data.');
			return false;
		},
	});
	return query;
};

