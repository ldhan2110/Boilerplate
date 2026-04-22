import { QUERY_KEY } from '@/constants';
import { getListMasterCode } from '@/services/api';
import type { MasterCodeListDto, SearchMasterCodeDto } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { message } from 'antd';
import { AxiosError } from 'axios';

export const useGetListMasterCode = (request: SearchMasterCodeDto) => {
	const query = useQuery<MasterCodeListDto>({
		queryKey: [QUERY_KEY.MASTER_DATA.MASTER_CODE_MANAGEMENT.GET_MASTER_CODE_LIST, request],
		queryFn: () => getListMasterCode(request),
		staleTime: 0,
		refetchOnWindowFocus: false,
		retry: 0,
		throwOnError: (error) => {
			if (error instanceof AxiosError && error.response?.data?.errorCode?.includes('SERVICE_UNAVAILABLE')) {
				message.error("Module is not available. Please contact your administrator.");
			} else message.error(error.message || 'Failed to load Master Code List data.');
			return false;
		},
	});
	return query;
};

