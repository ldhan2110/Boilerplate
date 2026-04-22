import { QUERY_KEY } from '@/constants';
import { getProgram } from '@/services/api';
import type { ProgramDto, SearchProgramDto } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { message } from 'antd';

export const useGetProgram = (request: SearchProgramDto) => {
	const query = useQuery<ProgramDto>({
		queryKey: [QUERY_KEY.ADMIN.ROLE_MANAGEMENT.GET_PROGRAM, request],
		queryFn: () => getProgram(request),
		staleTime: 500,
		refetchOnWindowFocus: false,
		retry: 0,
		enabled: request.coId != null,
		throwOnError: (error) => {
			message.error(error.message || 'Failed to load Program data.');
			return false;
		},
	});
	return query;
};
