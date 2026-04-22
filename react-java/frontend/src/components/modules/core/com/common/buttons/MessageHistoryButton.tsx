import { ProfileOutlined } from "@ant-design/icons"
import { Button, Tooltip } from "antd"
import { MessageHistoryModal } from "../modals"
import { useAppTranslate, useToggle } from "@hooks"

export const MessageHistoryButton = () => {
    const { t } = useAppTranslate();
    const { isToggle: isOpenMessageHistory, toggle: toggleMessageHistory } = useToggle(false);

    return (
        <>
            <Tooltip title={t('Message History')}>
                <Button
                    shape="circle"
                    icon={<ProfileOutlined />}
                    style={{ height: 32 }}
                    onClick={toggleMessageHistory}
                />
            </Tooltip>

            <MessageHistoryModal open={isOpenMessageHistory} onClose={toggleMessageHistory} />
        </>
    )
}