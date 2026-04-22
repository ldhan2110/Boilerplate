import { QUERY_KEY } from '@/constants';
import { registerBatchJob } from '@/services/api';
import type { ErrorResponseDto, SuccessDto } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

export const useRegisterBatchJob = ({
    onSuccess,
    onError,
}: {
    onSuccess?: (data: SuccessDto) => void;
    onError?: (error: ErrorResponseDto) => void;
}) => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: registerBatchJob,
        onSuccess: (response) => {
            onSuccess?.(response);
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEY.COMMON.GET_BATCH_JOB_LIST],
            });
        },
        onError: (err: AxiosError) => {
            console.log(err);
            onError?.(err.response?.data || {});
        },
    });

    return mutation;
};
