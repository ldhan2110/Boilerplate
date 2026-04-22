import { resetUserPassword } from '@/services/api';
import type { ErrorResponseDto, SuccessDto } from '@/types';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

export const useResetUserPassword = ({
	onSuccess,
	onError,
}: {
	onSuccess?: (data: SuccessDto) => void;
	onError?: (error: ErrorResponseDto) => void;
}) => {
	const mutation = useMutation({
		mutationFn: resetUserPassword,
		onSuccess: (response) => {
			onSuccess?.(response);
		},
		onError: (err: AxiosError) => {
			console.log(err);
			onError?.(err.response?.data || {});
		},
	});

	return mutation;
};
