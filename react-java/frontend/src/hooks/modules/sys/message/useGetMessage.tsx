import { QUERY_KEY } from '@/constants';
import { getMessage } from '@/services/api';
import type { MessageDto, SearchMessageDto } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { message } from 'antd';

export const useGetMessage = (request: SearchMessageDto, enabled = true) => {
	const query = useQuery<MessageDto>({
		queryKey: [QUERY_KEY.SYSTEM_CONFIGURATION.MESSAGE_MANAGEMENT.GET_MESSAGE, request],
		queryFn: () => getMessage(request),
		staleTime: 0,
		refetchOnWindowFocus: false,
		retry: 0,
		enabled: enabled,
		throwOnError: (error) => {
			message.error(error.message || 'Failed to load Message data.');
			return false;
		},
	});
	return query;
};

