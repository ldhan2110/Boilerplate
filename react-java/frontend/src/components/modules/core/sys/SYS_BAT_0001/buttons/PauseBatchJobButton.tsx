import { Button, message } from 'antd';

import { PermissionGate } from '@/components/common';
import { ABILITY_ACTION, ABILITY_SUBJECT, MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';
import { usePauseBatchJob } from '@/hooks/modules';
import { useBatchJobStore } from '@/stores';

export const PauseBatchJobButton = () => {
    const { t, m } = useAppTranslate();

    // Zustands
    const rowSelection = useBatchJobStore((state) => state.rowSelection);

    // Hooks
    const { mutate: pauseBatchJob, isPending } = usePauseBatchJob({
        onSuccess: () => {
            message.success(m(MESSAGE_CODES.COM000015));
        },
        onError: (err) => {
            console.log(err);
            message.error(m(err.errorCode || MESSAGE_CODES.SYSMESSAGE));
        },
    });

    const handlePauseJob = () => {
        if (rowSelection.length == 0) {
            message.error(m(MESSAGE_CODES.COM000014));
            return;
        }
        pauseBatchJob(rowSelection[0]);
    }

    return (
        <PermissionGate permissions={[
            {
                ability: ABILITY_ACTION.PAUSE,
                entity: ABILITY_SUBJECT.BATCH_JOB_MANAGEMENT,
            },
        ]}
            variant="hidden">
            <Button onClick={handlePauseJob} loading={isPending}>
                {t('Pause')}
            </Button>
        </PermissionGate>
    );
};