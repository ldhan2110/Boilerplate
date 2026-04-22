import { QUERY_KEY } from '@/constants';
import { updateUser } from '@/services/api';
import type { ErrorResponseDto, SuccessDto } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

export const useUpdateUser = ({
	onSuccess,
	onError,
}: {
	onSuccess?: (data: SuccessDto) => void;
	onError?: (error: ErrorResponseDto) => void;
}) => {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: updateUser,
		onSuccess: (response) => {
			onSuccess?.(response);
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.ADMIN.USER_MANAGEMENT.GET_USER_INFO_LIST],
			});
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.ADMIN.USER_MANAGEMENT.GET_USER_INFO],
			});
		},
		onError: (err: AxiosError) => {
			console.log(err);
			onError?.(err.response?.data || {});
		},
	});

	return mutation;
};
