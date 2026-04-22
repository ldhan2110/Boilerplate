import { QUERY_KEY } from '@/constants';
import { getMessageHistoryList } from '@/services/api';
import type { ExceptionLogListDto, SearchExceptionLogDto } from '@/types';
import { useInfiniteQuery } from '@tanstack/react-query';
import { message } from 'antd';

export const useGetMessageHistoryList = (
	request: SearchExceptionLogDto,
	defaultPageSize: number = 20,
) => {
	const query = useInfiniteQuery<ExceptionLogListDto, Error>({
		queryKey: [QUERY_KEY.COMMON.GET_MESSAGE_HISTORY_LIST, request],
		queryFn: ({ pageParam }) =>
			getMessageHistoryList({
				...request,
				pagination: {
					pageSize: defaultPageSize,
					current: pageParam as number,
				},
			}),
		initialPageParam: 1,
		staleTime: 0,
		refetchOnWindowFocus: false,
		retry: 0,
		enabled: request.coId != null,
		getNextPageParam: (lastPage, pages) =>
			(lastPage.messageList ?? []).length > 0 ? pages.length + 1 : undefined,
		throwOnError: (error) => {
			message.error(error.message || 'Failed to load Message History List data.');
			return false;
		},
	});

	return query;
};
