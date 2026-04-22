import { App, Col, Flex, Row } from 'antd';

import type { BatchJobConfigDto } from '@/types';
import { FormCheckbox, FormInput, FormTextArea } from '@/components/common/form';
import { CommonFormModal } from '@/components/common/modals';
import { BatchJobParamsEditor } from '../forms';
import { MESSAGE_CODES } from '@/constants';
import { useAppForm, useAppTranslate } from '@/hooks';
import { useRegisterBatchJob } from '@/hooks/modules';
import { authService } from '@/services/auth/authJwtService';

type AddBatchJobModalProps = {
    open: boolean;
    onCancel: () => void;
}

export const AddBatchJobModal = ({ open, onCancel }: AddBatchJobModalProps) => {
    const { m } = useAppTranslate();
    const form = useAppForm<BatchJobConfigDto & { jobParamsList?: Array<{ paramKey: string; paramValue: string }> }>({ formName: 'registerBatch' });
    const { message } = App.useApp(); // ✅ use the context-aware version

    //Hooks
    const { mutate: registerBatchJob, isPending: isCreating } = useRegisterBatchJob({
        onSuccess: () => {
            message.success(m(MESSAGE_CODES.COM000004));
            handleCloseModal();
        },
        onError: (err) => {
            console.log(err);
            message.error(m(err.errorCode || MESSAGE_CODES.SYSMESSAGE));
        },
    });

    function handleCloseModal() {
        form.resetFields();
        onCancel();
    }

    function handleBeforeCloseModal() {
        form.checkUnsavedFormChange(handleCloseModal);
    }


    async function handleRegisterBatchJob() {
        try {
            const formValues = await form.validateFields();
            // Convert Form.List array to Map
            const { jobParamsList, ...rest } = formValues;
            const jobParams: Record<string, string> = {};
            if (jobParamsList) {
                jobParamsList.forEach(
                    (item: { paramKey: string; paramValue: string }) => {
                        if (item.paramKey) {
                            jobParams[item.paramKey] = item.paramValue || '';
                        }
                    }
                );
            }
            registerBatchJob({
                coId: authService.getCurrentCompany()!,
                ...rest,
                jobParams: Object.keys(jobParams).length > 0 ? jobParams : undefined,
            });
        } catch {
            return;
        }
    }

    return (
        <CommonFormModal
            title="Register Batch Job"
            open={open}
            form={form}
            onConfirm={handleRegisterBatchJob}
            onCancel={handleBeforeCloseModal}
            width={520}
            okText={'Save'}
            cancelText={'Close'}
            confirmLoading={isCreating}
            initialValues={{
                useFlg: 'Y',
            }}
        >
            <Flex gap={12} className="!mt-4" vertical>
                <Row gutter={[16, 16]}>
                    <Col span={19}>
                        <FormInput
                            name="batJbId"
                            label="Batch Job ID"
                            placeholder="Input Batch Job ID"
                            required
                            maxLength={100}
                        />
                    </Col>
                    <Col span={4}>
                        <Flex align="end" className="h-full">
                            <FormCheckbox
                                name="useFlg"
                                title="Active"
                                checkboxMapping={{
                                    checked: 'Y',
                                    unchecked: 'N',
                                }}
                            />
                        </Flex>
                    </Col>
                </Row>

                <FormInput
                    name="batJbNm"
                    label="Batch Job Name"
                    placeholder="Input Batch Job Name"
                    required
                    maxLength={200}
                />

                <FormInput
                    name="batJbClss"
                    label="Batch Job Class"
                    placeholder="Input Batch Job Class"
                    required
                    maxLength={200}
                />

                <FormInput
                    name="cronXprVal"
                    label="Cron Expression"
                    placeholder="Input Cron Expression"
                    required
                    maxLength={200}
                />

                <FormTextArea
                    name="batJbDesc"
                    label="Description"
                    placeholder="Input Description"
                    maxLength={200}
                />

                <BatchJobParamsEditor />
            </Flex>
        </CommonFormModal>
    );
};