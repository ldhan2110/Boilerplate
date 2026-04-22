import { useEffect } from 'react';
import { App, Col, Flex, Row } from 'antd';

import type { BatchJobConfigDto } from '@/types';
import { FormCheckbox, FormInput, FormTextArea } from '@/components/common/form';
import { CommonFormModal } from '@/components/common/modals';
import { BatchJobParamsEditor } from '../forms';
import { ABILITY_ACTION, ABILITY_SUBJECT, MESSAGE_CODES } from '@/constants';
import { useAppForm, useAppTranslate } from '@/hooks';
import { useGetBatchJob, useUpdateBatchJob } from '@/hooks/modules';
import { authService } from '@/services/auth/authJwtService';
import { useBatchJobStore } from '@/stores';

type ViewBatchJobModalProps = {
    open: boolean;
    onCancel: () => void;
}

export const ViewBatchJobModal = ({ open, onCancel }: ViewBatchJobModalProps) => {
    const { m } = useAppTranslate();
    const form = useAppForm<BatchJobConfigDto & { jobParamsList?: Array<{ paramKey: string; paramValue: string }> }>({ formName: 'registerBatch' });
    const { message } = App.useApp(); // ✅ use the context-aware version

    // Zustands
    const selectedRowId = useBatchJobStore((state) => state.selectedRowId);

    // Hooks
    const { data: batchJob, isLoading: isLoadingBatchJob } = useGetBatchJob({
        coId: authService.getCurrentCompany()!,
        batJbId: selectedRowId,
    });

    const { mutate: updateBatchJob, isPending: isUpdating } = useUpdateBatchJob({
        onSuccess: () => {
            message.success(m(MESSAGE_CODES.COM000004));
            handleCloseModal();
        },
        onError: (err) => {
            console.log(err);
            message.error(m(err.errorCode || MESSAGE_CODES.SYSMESSAGE));
        },
    });

    useEffect(() => {
        if (batchJob) {
            // Convert jobParams Map to Form.List array format
            const jobParamsList = batchJob.jobParams
                ? Object.entries(batchJob.jobParams).map(([paramKey, paramValue]) => ({
                      paramKey,
                      paramValue: String(paramValue ?? ''),
                  }))
                : [];
            form.setInitialFieldsValue({ ...batchJob, jobParamsList });
        }
    }, [batchJob]);

    function handleCloseModal() {
        form.resetFields();
        onCancel();
    }

    function handleBeforeCloseModal() {
        form.checkUnsavedFormChange(handleCloseModal);
    }


    async function handleUpdateBatchJob() {
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
            updateBatchJob({
                coId: authService.getCurrentCompany()!,
                ...rest,
                jobParams,
            });
        } catch {
            return;
        }
    }

    return (
        <CommonFormModal
            title="Batch Job Information"
            open={open}
            form={form}
            onConfirm={handleUpdateBatchJob}
            onCancel={handleBeforeCloseModal}
            width={520}
            okText={'Save'}
            cancelText={'Close'}
            confirmLoading={isUpdating}
            loading={isLoadingBatchJob}
            savePermission={{
                action: ABILITY_ACTION.SAVE,
                subject: ABILITY_SUBJECT.BATCH_JOB_MANAGEMENT,
            }}
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
                            disabled
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
                    disabled
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