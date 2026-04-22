import { useAppMessage, useAppTranslate } from "@/hooks";
import { invalidateCommonCode } from "@/services/api";
import { authStore } from "@/stores";
import { ClearOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd"

export const CacheClearButton = () => {
    const { t } = useAppTranslate();
    const { message } = useAppMessage();

    async function handleClearCache() {
        const coId = authStore.user?.userInfo.coId;
        if (!coId) {
            message.error(t('Company ID is required'));
            return;
        }
        const result = await invalidateCommonCode(coId);
        if (result.success) {
            message.success(t('Cache cleared successfully'));
        } else {
            message.error(t('Failed to clear cache'));
        }
    }
    
    return (
        <Tooltip title={t('Clear Cache')}>
            <Button shape="circle" icon={<ClearOutlined />} style={{ height: 32 }} onClick={handleClearCache} />
        </Tooltip>
    )
}