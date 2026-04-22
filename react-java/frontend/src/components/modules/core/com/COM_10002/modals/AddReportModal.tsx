import { App, Col, Flex, Form, Row, type UploadFile } from 'antd';
import React from 'react';

import type { ProgramDto, ReportDto } from '@/types';
import { FormCheckbox, FormInput, FormSelect } from '@/components/common/form';
import { CommonFormModal } from '@/components/common/modals';
import { UploadDnD } from '@/components/common/input/upload';
import { MESSAGE_CODES } from '@/constants';
import { useAppForm, useAppTranslate } from '@/hooks';
import { useInsertReport } from '@/hooks/modules/com/report';
import { authService } from '@/services/auth/authJwtService';
import { useReportManagementStore } from '@/stores';

type AddReportModalProps = {
	open: boolean;
	onCancel: () => void;
};

export const AddReportModal = ({ open, onCancel }: AddReportModalProps) => {
	const { t, m } = useAppTranslate();
	const form = useAppForm<ReportDto & { file?: File }>({ formName: 'addReport' });
	const { message } = App.useApp();

	// Manage fileList separately for display
	const [fileList, setFileList] = React.useState<UploadFile[]>([]);

	const programList = useReportManagementStore((state)=>state.options.programList);

	// Insert Report Hook
	const { mutate: insertReport, isPending: isCreating } = useInsertReport({
		onSuccess: () => {
			message.success(m(MESSAGE_CODES.COM000004));
			handleCloseModal();
		},
		onError: (err) => {
			console.log(err);
			message.error(m(err.errorCode || MESSAGE_CODES.SYSMESSAGE));
		},
	});

	// Modal Events
	function handleCloseModal() {
		form.resetFields();
		setFileList([]);
		onCancel();
	}

	function handleBeforeCloseModal() {
		form.checkUnsavedFormChange(handleCloseModal);
	}

	async function handleSave() {
		try {
			const formValues = await form.validateFields();
			const file = form.getFieldValue('file') as File | undefined;

			if (!file) {
				message.error(m(MESSAGE_CODES.COM000002));
				return;
			}

			insertReport({
				report: {
					coId: authService.getCurrentCompany()!,
					rptCd: formValues.rptCd,
					rptNm: formValues.rptNm,
					rptUrl: formValues.rptUrl,
					pgmId: formValues.pgmId,
					useFlg: formValues.useFlg || 'Y',
				},
				file: file,
			});
		} catch {
			// Validation failed
			return;
		}
	}

	return (
		<CommonFormModal
			form={form}
			open={open}
			title={t('Add Report')}
			onCancel={handleBeforeCloseModal}
			onConfirm={handleSave}
			confirmLoading={isCreating}
			destroyOnHidden
			initialValues={{
				useFlg: 'Y',
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
