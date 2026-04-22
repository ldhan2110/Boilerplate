import { QUERY_KEY } from '@/constants';
import { addNewProgram } from '@/services/api';
import type { ErrorResponseDto, SuccessDto } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

export const useAddProgram = ({
	onSuccess,
	onError,
}: {
	onSuccess?: (data: SuccessDto) => void;
	onError?: (error: ErrorResponseDto) => void;
}) => {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: addNewProgram,
		onSuccess: (response) => {
			onSuccess?.(response);
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.ADMIN.ROLE_MANAGEMENT.GET_PROGRAM_LIST],
			});
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.ADMIN.ROLE_MANAGEMENT.GET_PERMISSION_BY_PROGRAM],
			});
		},
		onError: (err: AxiosError) => {
			console.log(err);
			onError?.(err.response?.data || {});
		},
	});

	return mutation;
};
