import { QUERY_KEY } from '@/constants';
import { updateMessage } from '@/services/api';
import type { ErrorResponseDto, SuccessDto } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

export const useUpdateMessage = ({
	onSuccess,
	onError,
}: {
	onSuccess?: (data: SuccessDto) => void;
	onError?: (error: ErrorResponseDto) => void;
}) => {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: updateMessage,
		onSuccess: (response) => {
			onSuccess?.(response);
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.SYSTEM_CONFIGURATION.MESSAGE_MANAGEMENT.GET_MESSAGE],
			});
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.SYSTEM_CONFIGURATION.MESSAGE_MANAGEMENT.GET_MESSAGE_LIST],
			});
		},
		onError: (err: AxiosError) => {
			console.log(err);
			onError?.(err.response?.data || {});
		},
	});

	return mutation;
};

