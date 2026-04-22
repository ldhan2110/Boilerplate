import { AddButton } from '@/components/common/buttons';
import { PermissionGate } from '@/components/common';
import { ABILITY_ACTION, ABILITY_SUBJECT } from '@/constants';
import { useAppTranslate, useToggle } from '@/hooks';
import { AddBatchJobModal } from '../modals';


export const AddBatchJobButton = () => {
    const { t } = useAppTranslate();
    const { isToggle, toggle } = useToggle(false);

    return (
        <>
            <PermissionGate permissions={[
                {
                    ability: ABILITY_ACTION.ADD,
                    entity: ABILITY_SUBJECT.BATCH_JOB_MANAGEMENT,
                },
            ]}
                variant="hidden">
                <AddButton onClick={toggle}>
                    {t('Add New')}
                </AddButton>
            </PermissionGate>
            <AddBatchJobModal open={isToggle} onCancel={toggle} />
        </>
    );
};