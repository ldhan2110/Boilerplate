import { QUERY_KEY } from '@/constants';
import { getMessageList } from '@/services/api';
import type { MessageListDto, SearchMessageDto } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { message } from 'antd';

export const useGetMessageList = (request: SearchMessageDto) => {
	const query = useQuery<MessageListDto>({
		queryKey: [QUERY_KEY.SYSTEM_CONFIGURATION.MESSAGE_MANAGEMENT.GET_MESSAGE_LIST, request],
		queryFn: () => getMessageList(request),
		staleTime: 0,
		refetchOnWindowFocus: false,
		retry: 0,
		enabled: request.coId != null,
		throwOnError: (error) => {
			message.error(error.message || 'Failed to load Message List data.');
			return false;
		},
	});
	return query;
};

