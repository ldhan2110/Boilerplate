import { QUERY_KEY } from '@/constants';
import { insertReport } from '@/services/api';
import type { ErrorResponseDto, ReportDto, SuccessDto } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

export const useInsertReport = ({
	onSuccess,
	onError,
}: {
	onSuccess?: (data: SuccessDto) => void;
	onError?: (error: ErrorResponseDto) => void;
}) => {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: ({ report, file }: { report: ReportDto; file: File }) => insertReport(report, file),
		onSuccess: (response) => {
			onSuccess?.(response);
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.MASTER_DATA.REPORT_MANAGEMENT.GET_REPORT_LIST],
			});
		},
		onError: (err: AxiosError) => {
			console.log(err);
			onError?.(err.response?.data || {});
		},
	});

	return mutation;
};
