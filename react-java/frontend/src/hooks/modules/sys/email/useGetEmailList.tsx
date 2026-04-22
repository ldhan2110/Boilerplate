import { QUERY_KEY } from '@/constants';
import { getEmailList } from '@/services/api';
import type { EmailListResultDto, SearchEmailParams } from '@/services/api/core/sys/email/getEmailList.service';
import { useQuery } from '@tanstack/react-query';
import { message } from 'antd';

export const useGetEmailList = (request: SearchEmailParams) => {
	const query = useQuery<EmailListResultDto>({
		queryKey: [QUERY_KEY.SYSTEM_CONFIGURATION.EMAIL.GET_EMAIL_LIST, request],
		queryFn: () => getEmailList(request),
		staleTime: 0,
		refetchOnWindowFocus: false,
		retry: 0,
		enabled: request.coId != null,
		throwOnError: (error) => {
			message.error(error.message || 'Failed to load email list.');
			return false;
		},
	});
	return query;
};
