import { useAppTranslate } from '@/hooks';
import { Flex, Modal } from 'antd';
import { ExportHistoryTable } from '../tables';

type ExportHistoryModalProps = {
    open: boolean;
    onClose: () => void;
};

export const ExportHistoryModal = ({ open, onClose }: ExportHistoryModalProps) => {
    const { t } = useAppTranslate();

    return (
        <Modal
            title={t('Export History')}
            open={open}
            onCancel={onClose}
            cancelText={t('Close')}
            centered
            okButtonProps={{
                hidden: true,
            }}
            width={'70%'}
            destroyOnHidden
        >
            <Flex vertical gap={16}>
                {open && <ExportHistoryTable />}
            </Flex>
        </Modal>
    );
};
