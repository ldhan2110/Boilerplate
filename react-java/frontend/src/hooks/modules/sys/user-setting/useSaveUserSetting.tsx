import { saveUserSetting } from '@/services/api';
import { authService } from '@/services/auth/authJwtService';
import type { ErrorResponseDto, SuccessDto } from '@/types';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

export const useSaveUserSetting = ({
	onSuccess,
	onError,
}: {
	onSuccess?: (data: SuccessDto) => void;
	onError?: (error: ErrorResponseDto) => void;
}) => {
	const mutation = useMutation({
		mutationFn: saveUserSetting,
		onSuccess: async (response) => {
			onSuccess?.(response);
			await authService.refreshToken();
		},
		onError: (err: AxiosError) => {
			console.log(err);
			onError?.(err.response?.data || {});
		},
	});

	return mutation;
};
