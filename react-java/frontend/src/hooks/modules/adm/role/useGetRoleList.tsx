import { QUERY_KEY } from '@/constants';
import { getRoleList } from '@/services/api';
import type { RoleListDto, SearchRoleDto } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { message } from 'antd';

export const useGetRoleList = (request: SearchRoleDto) => {
	const query = useQuery<RoleListDto>({
		queryKey: [QUERY_KEY.ADMIN.ROLE_MANAGEMENT.GET_ROLE_LIST, request],
		queryFn: () => getRoleList(request),
		staleTime: 0,
		refetchOnWindowFocus: false,
		retry: 0,
		enabled: request.coId != null,
		throwOnError: (error) => {
			message.error(error.message || 'Failed to load Role List data.');
			return false;
		},
	});
	return query;
};
