import { QUERY_KEY } from '@/constants';
import { getEmail } from '@/services/api';
import type { EmailDetailDto } from '@/services/api/core/sys/email/getEmail.service';
import { useQuery } from '@tanstack/react-query';
import { message } from 'antd';

export const useGetEmail = (request: { coId?: string; emlId: string }, enabled = true) => {
	const query = useQuery<EmailDetailDto>({
		queryKey: [QUERY_KEY.SYSTEM_CONFIGURATION.EMAIL.GET_EMAIL, request],
		queryFn: () => getEmail(request),
		staleTime: 0,
		refetchOnWindowFocus: false,
		retry: 0,
		enabled: enabled && !!request.emlId,
		throwOnError: (error) => {
			message.error(error.message || 'Failed to load email detail.');
			return false;
		},
	});
	return query;
};
