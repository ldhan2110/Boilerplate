import { DeleteButton, PermissionGate } from "@/components";
import { ABILITY_ACTION, ABILITY_SUBJECT, MESSAGE_CODES } from "@/constants";
import { useAppTranslate, useDeleteReport, useShowMessage } from "@/hooks";
import { useReportManagementStore } from "@/stores";
import { App } from "antd";

export const DeleteReportButton = () => {
    const { t, m } = useAppTranslate();
    const { message } = App.useApp();
    const { showConfirmMessage } = useShowMessage();

    const selectedRows = useReportManagementStore((state) => state.selectedRows);

    const { mutate: deleteReport, isPending: isDeleting } = useDeleteReport({
        onSuccess: () => {
			message.success(m(MESSAGE_CODES.COM000007));
			
		},
		onError: (err) => {
			message.error(m(err.errorCode || MESSAGE_CODES.SYSMESSAGE));
		},
    });
   
    function handleDeleteReport() {
        showConfirmMessage(m(MESSAGE_CODES.COM000006), () => {
            deleteReport(selectedRows.map((row) => row.rptCd as string));
        });
    }

    return (
        <PermissionGate permissions={[
            {
                ability: ABILITY_ACTION.DELETE,
                entity: ABILITY_SUBJECT.REPORT_MANAGEMENT,
            },
        ]} variant="hidden">
            <DeleteButton onClick={handleDeleteReport} loading={isDeleting}>
                {t('Delete')}
            </DeleteButton>
        </PermissionGate>
    );
};
