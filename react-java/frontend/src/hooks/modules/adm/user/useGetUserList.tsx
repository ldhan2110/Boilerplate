import { QUERY_KEY } from '@/constants';
import { getUsersList } from '@/services/api';
import type { SearchUserDto, UserInfoListDto } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { message } from 'antd';

export const useGetUserList = (request: SearchUserDto) => {
	const query = useQuery<UserInfoListDto>({
		queryKey: [QUERY_KEY.ADMIN.USER_MANAGEMENT.GET_USER_INFO_LIST, request],
		queryFn: () => getUsersList(request),
		staleTime: 0,
		refetchOnWindowFocus: false,
		retry: 0,
		enabled: request.coId != null,
		throwOnError: (error) => {
			message.error(error.message || 'Failed to load User Info List data.');
			return false;
		},
	});
	return query;
};
