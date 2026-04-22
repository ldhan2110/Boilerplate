import { useToggle, useAppTranslate } from "@hooks";
import { BugOutlined } from "@ant-design/icons"
import { Button, Tooltip } from "antd"
import DebugPanel from "../panels/DebugPanel";

export const DebugButton = () => {
    const { t } = useAppTranslate();
    const { isToggle: isOpenDebugPanel, toggle: toggleDebugPanel } = useToggle(false);

    return (
        <>
            <Tooltip title={t('Debug Panel')}>
                <Button
                    shape="circle"
                    icon={<BugOutlined />}
                    onClick={toggleDebugPanel}
                    style={{ color: '#ff4d4f', height: 32 }}
                />
            </Tooltip>

            {/* Debug Panel - show when param mode=DEBUG */}
            <DebugPanel visible={isOpenDebugPanel} onClose={toggleDebugPanel} />
        </>
    )
}