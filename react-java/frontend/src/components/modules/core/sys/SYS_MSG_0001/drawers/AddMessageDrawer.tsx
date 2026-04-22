import React from 'react';
import { App, Col, Flex, Row } from 'antd';

import type { MessageDto, MessageTranslationDto, EditTableHandler } from '@/types';
import { CancelButton, SaveButton } from '@/components/common/buttons';
import { CommonFormDrawer } from '@/components/common/drawer';
import { FormInput, FormSelect, FormTextArea } from '@/components/common/form';
import { MESSAGE_CODES } from '@/constants';
import { useAppForm, useAppTranslate } from '@/hooks';
import { useAddMessage } from '@/hooks/modules';
import { authService } from '@/services/auth/authJwtService';
import { useMessageManagementStore } from '@/stores';
import { TranslationTable } from '../tables';

type AddMessageDrawerProps = {
	open: boolean;
	onClose: () => void;
};

export const AddMessageDrawer = ({ open, onClose }: AddMessageDrawerProps) => {
	const { m } = useAppTranslate();
	const form = useAppForm<MessageDto>({ formName: 'addMessage' });
	const tableForm = useAppForm<{ [key: string]: MessageTranslationDto[] }>({ formName: 'translationTable' });
	const { message } = App.useApp();

	// Edit Table Refs
	const tableRef = React.useRef<EditTableHandler<MessageTranslationDto> | null>(null);

	// Zustands
	const setSelectedRows = useMessageManagementStore((state) => state.setSelectedRows);

	// Hooks
	const { mutate: createMessage, isPending: isCreating } = useAddMessage({
		onSuccess: () => {
			message.success(m(MESSAGE_CODES.COM000004));
			handleCloseDrawer();
		},
		onError: (err) => {
			console.log(err);
			message.error(m(err.errorCode || MESSAGE_CODES.SYSMESSAGE));
		},
	});

	function handleCloseDrawer() {
		form.resetFields();
		tableForm.resetFields();
		setSelectedRows([]);
		onClose();
	}

	function handleBeforeCloseModal() {
		const isClean = tableForm.checkUnsavedFormChange(handleCloseDrawer);
		if (!isClean) {
			return;
		}
		form.checkUnsavedFormChange(handleCloseDrawer);
	}

	async function handleSave() {
		const formValue = await form.validateFields();
		const tableValue = (await tableForm.validateFields()) as { [key: string]: MessageTranslationDto[] };
		createMessage({
			coId: authService.getCurrentCompany(),
			...formValue,
			translations: tableValue['translationTable'],
		});
	}

	return (
		<CommonFormDrawer<MessageDto>
			form={form}
			initialValues={{
				mdlNm: 'COM',
				msgTpVal: 'INFO',
			}}
			open={open}
			title={'Add Message'}
			onClose={handleBeforeCloseModal}
			footer={
				<Flex gap={8}>
					<SaveButton loading={isCreating} onClick={handleSave}>
						Save
					</SaveButton>
					<CancelButton onClick={handleBeforeCloseModal}>Cancel</CancelButton>
				</Flex>
			}
			tableNode={<TranslationTable form={tableForm} tableRef={tableRef} />}
		>
			<Flex gap={32} vertical>
				<Flex gap={12} vertical>
					<Row gutter={[16, 16]}>
						<Col span={12}>
							<FormInput
								name="msgId"
								label="Message ID"
								placeholder="Enter Message ID (e.g., COM000001)"
								required
								maxLength={20}
							/>
						</Col>
						<Col span={6}>
							<FormSelect
								name="mdlNm"
								label="Module"
								required
								options={[
									{ label: 'Common', value: 'COM' },
									{ label: 'Admin', value: 'ADM' },
									{ label: 'Master', value: 'MST' },
									{ label: 'Employee', value: 'EMP' },
									{ label: 'Payroll', value: 'PRL' },
									{ label: 'Performance Evaluation', value: 'PEV' },
									{ label: 'Attendance', value: 'ATND' },
									{ label: 'System Configuration', value: 'SYS' },
								]}
							/>
						</Col>
						<Col span={6}>
							<FormSelect
								name="msgTpVal"
								label="Type"
								required
								options={[
									{ label: 'Info', value: 'INFO' },
									{ label: 'Warning', value: 'WARN' },
									{ label: 'Error', value: 'ERROR' },
									{ label: 'Success', value: 'SUCCESS' },
								]}
							/>
						</Col>
					</Row>
					<FormTextArea
						name="dfltMsgVal"
						label="Default Message"
						placeholder="Enter Default Message"
						required
						maxLength={500}
						rows={3}
					/>
				</Flex>
			</Flex>
		</CommonFormDrawer>
	);
};

