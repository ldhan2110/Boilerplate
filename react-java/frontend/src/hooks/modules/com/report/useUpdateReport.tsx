import { QUERY_KEY } from '@/constants';
import { updateReport } from '@/services/api';
import type { ErrorResponseDto, ReportDto, SuccessDto } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

export const useUpdateReport = ({
	onSuccess,
	onError,
}: {
	onSuccess?: (data: SuccessDto) => void;
	onError?: (error: ErrorResponseDto) => void;
}) => {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: ({ report, file }: { report: ReportDto; file?: File }) => updateReport(report, file),
		onSuccess: (response) => {
			onSuccess?.(response);
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.MASTER_DATA.REPORT_MANAGEMENT.GET_REPORT_LIST],
			});
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.MASTER_DATA.REPORT_MANAGEMENT.GET_REPORT],
			});
		},
		onError: (err: AxiosError) => {
			console.log(err);
			onError?.(err.response?.data || {});
		},
	});

	return mutation;
};
