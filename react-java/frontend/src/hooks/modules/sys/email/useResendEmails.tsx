import { QUERY_KEY } from '@/constants';
import { resendEmails } from '@/services/api';
import type { ErrorResponseDto, SuccessDto } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

export const useResendEmails = ({
	onSuccess,
	onError,
}: {
	onSuccess?: (data: SuccessDto) => void;
	onError?: (error: ErrorResponseDto) => void;
}) => {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: resendEmails,
		onSuccess: (response) => {
			onSuccess?.(response);
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.SYSTEM_CONFIGURATION.EMAIL.GET_EMAIL_LIST],
			});
		},
		onError: (err: AxiosError) => {
			console.log(err);
			onError?.(err.response?.data || {});
		},
	});

	return mutation;
};
