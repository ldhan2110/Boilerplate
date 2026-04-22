import { CommonFormModal, FormCheckbox, FormInput, FormSelect, UploadDnD } from "@/components/common";
import { ABILITY_ACTION, ABILITY_SUBJECT, MESSAGE_CODES } from "@/constants";
import { useAppForm, useAppTranslate, useGetReport, useUpdateReport } from "@/hooks";
import { authStore, useReportManagementStore } from "@/stores";
import type { ProgramDto, ReportDto } from "@/types";
import { App, Col, Flex, Form, Row, type UploadFile } from "antd";
import React from "react";

type ViewReportModalProps = {
	open: boolean;
	onCancel: () => void;
};

export const ViewReportModal = ({ open, onCancel }: ViewReportModalProps) => {
    const { t, m } = useAppTranslate();
	const { message } = App.useApp(); // ✅ use the context-aware version

    const selectedReportCd = useReportManagementStore((state)=>state.selectedReportCd);
    const programList = useReportManagementStore((state)=>state.options.programList);

	// Manage fileList separately for display
	const [fileList, setFileList] = React.useState<UploadFile[]>([]);

    const { data: reportInfo, isPending: isLoading } = useGetReport(selectedReportCd!);
    const form = useAppForm<ReportDto>({ formName: 'viewReport', initialValues: reportInfo });

	React.useEffect(() => {
		if (reportInfo && reportInfo.rptFileName) {
			const initialFile: UploadFile = {
				uid: reportInfo.rptFileId || '-1',
				name: reportInfo.rptFileName,
				status: 'done',
				url: reportInfo.rptFileName,
			};
			setFileList([initialFile]);
			form.setFieldValue("file", initialFile);
		}
	}, [reportInfo]);

    // Update Report Hook
    const { mutate: updateReport, isPending: isUpdating } = useUpdateReport({
        onSuccess: () => {
            message.success(m(MESSAGE_CODES.COM000004));
            handleCloseModal();
        },
		onError: (err) => {
			message.error(m(err.errorCode || MESSAGE_CODES.SYSMESSAGE));
		},
    });
    async function handleUpdateReport() {
        try {
            const formValues = await form.validateFields();
			const file = form.getFieldValue('file') as File | undefined;
            updateReport({
                report: {
					coId: authStore.user?.userInfo.coId,
					rptCd: selectedReportCd!,
					pgmId: formValues.pgmId,
					rptUrl: formValues.rptUrl,
					useFlg: formValues.useFlg || 'Y',
					rptNm: formValues.rptNm,
				},
				file: file,
            });
        } catch {
            return;
        }
    }


    function handleCloseModal() {
		form.resetFields();
		setFileList([]);
		onCancel();
	}

    function handleBeforeCloseModal() {
		form.checkUnsavedFormChange(handleCloseModal);
	}

	return (
		<CommonFormModal
			form={form}
			open={open}
			title={t('View Report')}
			onConfirm={handleUpdateReport}
			onCancel={handleBeforeCloseModal}
			width={450}
			okText="Save"
			cancelText="Close"
			loading={isLoading}
            confirmLoading={isUpdating}
			savePermission={{
				action: ABILITY_ACTION.SAVE,
				subject: ABILITY_SUBJECT.REPORT_MANAGEMENT,
			}}
		>
            <Flex gap={12} className="!mt-4" vertical>
				<Row gutter={[16, 16]}>
					<Col span={19}>
						<FormInput
							name="rptCd"
							label={t('Report Code')}
							placeholder={t('Input Report Code')}
							required
							disabled
							maxLength={20}
						/>
					</Col>
					<Col span={4}>
						<Flex align="end" className="h-full">
							<FormCheckbox
								name="useFlg"
								title={t('Active')}
								checkboxMapping={{
									checked: 'Y',
									unchecked: 'N',
								}}
							/>
						</Flex>
					</Col>
				</Row>
				<FormInput
					name="rptNm"
					label={t('Report Name')}
					placeholder={t('Input Report Name')}
					required
					maxLength={100}
				/>

				<FormSelect
					name="pgmId"
					label={t('Program')}
					placeholder={t('Select Program')}
					options={programList?.map((program: ProgramDto) => ({
						label: program.pgmNm,
						value: program.pgmId,
					}))}
					maxLength={20}
				/>

				<FormInput
					name="rptUrl"
					label={t('URL')}
					placeholder={t('Input URL')}
					required
					maxLength={500}
				/>
				
			<Form.Item
				name="file"
				label={t('File')}
				required
				rules={[{ required: true, message: m(MESSAGE_CODES.COM000002) }]}
				getValueFromEvent={(e) => {
					if (Array.isArray(e)) {
						return e[0]?.originFileObj || e[0];
					}
					return e?.file?.originFileObj || e?.file;
				}}
			>
				<UploadDnD
					beforeUpload={() => false}
					maxCount={1}
					accept=".pdf,.xlsx,.xls,.doc,.docx"
					fileList={fileList}
					onChange={(info) => {
						setFileList(info.fileList);
						if (info.fileList.length > 0) {
							const file = info.fileList[0];
							form.setFieldValue('file', file.originFileObj || file);
						} else {
							form.setFieldValue('file', undefined);
						}
					}}
					onRemove={() => {
						setFileList([]);
						form.setFieldValue('file', undefined);
					}}
				/>
			</Form.Item>
			</Flex>
        </CommonFormModal>
	);
};