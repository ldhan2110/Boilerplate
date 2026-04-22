import { QUERY_KEY } from '@/constants';
import { getUserInfo } from '@/services/api';
import type { SearchUserDto, UserInfoDto } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { message } from 'antd';

export const useGetUserInfo = (request: SearchUserDto) => {
	const query = useQuery<UserInfoDto>({
		queryKey: [QUERY_KEY.ADMIN.USER_MANAGEMENT.GET_USER_INFO, request],
		queryFn: () => getUserInfo(request),
		staleTime: 0,
		refetchOnWindowFocus: false,
		retry: 0,
		enabled: request.usrId != null,
		throwOnError: (error) => {
			message.error(error.message || 'Failed to load User Info data.');
			return false;
		},
	});
	return query;
};
