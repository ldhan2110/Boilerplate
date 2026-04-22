import { QUERY_KEY } from '@/constants';
import { getCommonCode } from '@/services/api';
import type { GetCommonCodeRequestDto, SubCodeResponseDto } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { message } from 'antd';

export const useGetCommonCode = (request: GetCommonCodeRequestDto, enabled?: boolean) => {
	const query = useQuery<SubCodeResponseDto[][]>({
		queryKey: [QUERY_KEY.MASTER_DATA.MASTER_CODE_MANAGEMENT.GET_COMMON_CODE, request],
		queryFn: () => getCommonCode(request),
		staleTime: 0,
		refetchOnWindowFocus: false,
		retry: 0,
		enabled: request.coId != null && request.cdList != null && request.cdList.length > 0 && enabled !== false,
		throwOnError: (error) => {
			message.error(error.message || 'Failed to load Common Code data.');
			return false;
		},
	});
	return query;
};

