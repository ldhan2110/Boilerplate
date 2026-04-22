import { useState } from 'react';
import { Button, message } from 'antd';

import { PermissionGate } from '@/components/common';
import { ABILITY_ACTION, ABILITY_SUBJECT, MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';
import { useBatchJobStore } from '@/stores';
import { RunBatchJobModal } from '../modals';

export const RunBatchJobButton = () => {
	const { t, m } = useAppTranslate();
	const [open, setOpen] = useState(false);

	// Zustands
	const rowSelection = useBatchJobStore((state) => state.rowSelection);
	const setRowSelection = useBatchJobStore((state) => state.setRowSelection);

	const handleRunJob = () => {
		if (rowSelection.length == 0) {
			message.error(m(MESSAGE_CODES.COM000014));
			return;
		}
		setOpen(true);
	};

	return (
		<PermissionGate
			permissions={[
				{
					ability: ABILITY_ACTION.RUN,
					entity: ABILITY_SUBJECT.BATCH_JOB_MANAGEMENT,
				},
			]}
			variant="hidden"
		>
			<Button onClick={handleRunJob}>{t('Run')}</Button>
			<RunBatchJobModal
				open={open}
				batJbId={rowSelection[0]?.batJbId ?? ''}
				onCancel={() => setOpen(false)}
				onSuccess={() => setRowSelection([])}
			/>
		</PermissionGate>
	);
};
