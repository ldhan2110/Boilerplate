import { useEffect } from 'react';
import { App, DatePicker, Flex, Form } from 'antd';
import dayjs from 'dayjs';

import type { BatchJobConfigDto } from '@/types';
import { CommonFormModal } from '@/components/common/modals';
import { MESSAGE_CODES } from '@/constants';
import { useAppForm, useAppTranslate } from '@/hooks';
import { useGetBatchJob, useRunBatchJob } from '@/hooks/modules';
import { authService } from '@/services/auth/authJwtService';
import { BatchJobParamsEditor } from '../forms';

type RunBatchJobModalProps = {
	open: boolean;
	batJbId: string;
	onCancel: () => void;
	onSuccess: () => void;
};

export const RunBatchJobModal = ({ open, batJbId, onCancel, onSuccess }: RunBatchJobModalProps) => {
	const { t, m } = useAppTranslate();
	const form = useAppForm<BatchJobConfigDto & { runDt: unknown; jobParamsList: unknown }>({
		formName: 'runBatchJob',
	});
	const { message } = App.useApp();

	const coId = authService.getCurrentCompany()!;

	// Fetch saved default params — only when modal is open and batJbId is set
	// Pass coId as undefined when closed to leverage the hook's enabled guard (coId != null)
	const { data: batchJob, isLoading } = useGetBatchJob({
		coId: open && batJbId ? coId : undefined,
		batJbId,
	});

	const { mutate: runBatchJob, isPending } = useRunBatchJob({
		onSuccess: () => {
			message.success(m(MESSAGE_CODES.COM000027));
			onSuccess();
			onCancel();
		},
		onError: (err) => {
			console.log(err);
			message.error(m(err.errorCode || MESSAGE_CODES.SYSMESSAGE));
		},
	});

	// Pre-fill saved defaults when job data loads, reset when modal closes
	useEffect(() => {
		if (batchJob && open) {
			const jobParamsList = batchJob.jobParams
				? Object.entries(batchJob.jobParams).map(([paramKey, paramValue]) => ({
						paramKey,
						paramValue: String(paramValue ?? ''),
					}))
				: [];
			form.setFieldsValue({
				runDt: dayjs(),
				jobParamsList,
			});
		}
		if (!open) {
			form.resetFields();
		}
	}, [batchJob, open]);

	async function handleRunBatchJob() {
		try {
			const formValues = await form.validateFields();

			// Convert Form.List array to Map
			const jobParams: Record<string, string> = {};
			if (formValues.jobParamsList) {
				(formValues.jobParamsList as Array<{ paramKey: string; paramValue: string }>).forEach(
					(item) => {
						if (item.paramKey) {
							jobParams[item.paramKey] = item.paramValue || '';
						}
					}
				);
			}

			// Add runDt as ISO-8601 string
			const runDtValue = formValues.runDt as unknown as dayjs.Dayjs;
			jobParams['runDt'] = runDtValue.format('YYYY-MM-DD');

			runBatchJob({
				batJbId,
				coId,
				jobParams,
			} as BatchJobConfigDto);
		} catch {
			return;
		}
	}

	return (
		<CommonFormModal
			title={t('Run Batch Job')}
			open={open}
			form={form}
			onConfirm={handleRunBatchJob}
			onCancel={onCancel}
			width={520}
			okText={t('Run')}
			cancelText={t('Close')}
			confirmLoading={isPending}
			loading={isLoading}
		>
			<Flex gap={12} className="!mt-4" vertical>
				<Form.Item
					name="runDt"
					label={t('Run Date')}
					rules={[{ required: true, message: t('Run Date is required') }]}
				>
					<DatePicker className="w-full" format="YYYY-MM-DD" />
				</Form.Item>

				<BatchJobParamsEditor />
			</Flex>
		</CommonFormModal>
	);
};
