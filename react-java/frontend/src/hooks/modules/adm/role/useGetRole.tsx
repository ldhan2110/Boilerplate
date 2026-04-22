import { QUERY_KEY } from '@/constants';
import { getRole } from '@/services/api';
import type { RoleDto, SearchRoleDto } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { message } from 'antd';

export const useGetRole = (request: SearchRoleDto, enabled?: boolean) => {
	const query = useQuery<RoleDto>({
		queryKey: [QUERY_KEY.ADMIN.ROLE_MANAGEMENT.GET_ROLE, request],
		queryFn: () => getRole(request),
		staleTime: 0,
		refetchOnWindowFocus: false,
		retry: 0,
		enabled: request.coId != null || enabled,
		throwOnError: (error) => {
			message.error(error.message || 'Failed to load Role data.');
			return false;
		},
	});
	return query;
};
