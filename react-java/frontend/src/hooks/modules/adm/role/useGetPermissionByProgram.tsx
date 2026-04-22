import { QUERY_KEY } from '@/constants';
import { getPermissionByProgram } from '@/services/api';
import type { PermissionDto, ProgramDto } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { message } from 'antd';

export const useGetPermissionByProgram = (request: ProgramDto, enabled?: boolean) => {
	const query = useQuery<PermissionDto[]>({
		queryKey: [QUERY_KEY.ADMIN.ROLE_MANAGEMENT.GET_PERMISSION_BY_PROGRAM, request],
		queryFn: () => getPermissionByProgram(request),
		staleTime: 500,
		refetchOnWindowFocus: false,
		retry: 0,
		enabled: enabled,
		throwOnError: (error) => {
			message.error(error.message || 'Failed to load Program data.');
			return false;
		},
	});
	return query;
};
