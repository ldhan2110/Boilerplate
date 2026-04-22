import { QUERY_KEY } from '@/constants';
import { changeUserInfo } from '@/services/api';
import type { ErrorResponseDto, SuccessDto } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

export const useChangeUserInfo = ({
	onSuccess,
	onError,
}: {
	onSuccess?: (data: SuccessDto) => void;
	onError?: (error: ErrorResponseDto) => void;
}) => {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: changeUserInfo,
		onSuccess: (response) => {
			onSuccess?.(response);
			
			// Invalidate queries after onSuccess callback (to allow message to show first)
			setTimeout(() => {
				queryClient.invalidateQueries({
					queryKey: [QUERY_KEY.ADMIN.USER_MANAGEMENT.GET_USER_INFO_LIST],
				});
				queryClient.invalidateQueries({
					queryKey: [QUERY_KEY.ADMIN.USER_MANAGEMENT.GET_USER_INFO],
				});
			}, 500);
		},
		onError: (err: AxiosError) => {
			console.log(err);
			onError?.(err.response?.data || {});
		},
	});

	return mutation;
};

