import { QUERY_KEY } from '@/constants';
import { getProgramList } from '@/services/api';
import type { ProgramListDto, SearchProgramDto } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { message } from 'antd';

export const useGetProgramList = (request: SearchProgramDto) => {
	const query = useQuery<ProgramListDto>({
		queryKey: [QUERY_KEY.ADMIN.ROLE_MANAGEMENT.GET_PROGRAM_LIST, request],
		queryFn: () => getProgramList(request),
		staleTime: 0,
		refetchOnWindowFocus: false,
		retry: 0,
		enabled: request.coId != null,
		throwOnError: (error) => {
			message.error(error.message || 'Failed to load Program List data.');
			return false;
		},
	});
	return query;
};
