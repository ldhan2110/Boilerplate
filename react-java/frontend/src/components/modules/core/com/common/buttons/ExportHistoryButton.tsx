import { useAppTranslate, useToggle } from "@hooks"
import { DownloadOutlined } from "@ant-design/icons"
import { Badge, Button, Tooltip } from "antd"
import { observer } from "mobx-react-lite"
import { ExportHistoryModal } from "../modals";
import appStore from "@stores/AppStore";

export const ExportHistoryButton = observer(() => {
    const { t } = useAppTranslate()
    const { isToggle, toggle } = useToggle(false);
    const { state, setHasBackgroundTask } = appStore;
    return (
        <>
            <Tooltip title={t('Export History')}>
                <Badge dot={state.hasBackgroundTask}>
                    <Button onClick={() => {
                        toggle();
                        setHasBackgroundTask(false);
                    }} shape="circle" icon={<DownloadOutlined />} style={{ height: 32 }} />
                </Badge>
            </Tooltip>

            <ExportHistoryModal onClose={toggle} open={isToggle} />
        </>
    )
});