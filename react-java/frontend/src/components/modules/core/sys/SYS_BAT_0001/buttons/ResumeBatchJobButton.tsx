import { Button, message } from 'antd';

import { PermissionGate } from '@/components/common';
import { ABILITY_ACTION, ABILITY_SUBJECT, MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';
import { useResumeBatchJob } from '@/hooks/modules';
import { useBatchJobStore } from '@/stores';

export const ResumeBatchJobButton = () => {
    const { t, m } = useAppTranslate();

    // Zustands
    const rowSelection = useBatchJobStore((state) => state.rowSelection);

    // Hooks
    const { mutate: resumeBatchJob, isPending } = useResumeBatchJob({
        onSuccess: () => {
            message.success(m(MESSAGE_CODES.COM000016));
        },
        onError: (err) => {
            console.log(err);
            message.error(m(err.errorCode || MESSAGE_CODES.SYSMESSAGE));
        },
    });

    const handleResumeJob = () => {
        if (rowSelection.length == 0) {
            message.error(m(MESSAGE_CODES.COM000014));
            return;
        }
        resumeBatchJob(rowSelection[0]);
    }

    return (
        <PermissionGate permissions={[
            {
                ability: ABILITY_ACTION.RESUME,
                entity: ABILITY_SUBJECT.BATCH_JOB_MANAGEMENT,
            },
        ]}
            variant="hidden">
            <Button onClick={handleResumeJob} loading={isPending}>
                {t('Resume')}
            </Button>
        </PermissionGate>
    );
};