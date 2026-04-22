import { AddButton, PermissionGate } from "@/components";
import { useAppTranslate, useToggle } from "@/hooks";
import { AddReportModal } from "../modals";
import { ABILITY_ACTION, ABILITY_SUBJECT } from "@/constants";

export const AddReportButton = () => {
    const { t } = useAppTranslate();
    const { isToggle, toggle } = useToggle(false);
    return (
        <>
            <PermissionGate permissions={[
                {
                    ability: ABILITY_ACTION.ADD,
                    entity: ABILITY_SUBJECT.REPORT_MANAGEMENT,
                },
            ]} variant="hidden">
                <AddButton onClick={toggle}>
                    {t('Add New')}
                </AddButton>
            </PermissionGate>
            <AddReportModal open={isToggle} onCancel={toggle} />
        </>
    );
};