import React from 'react';
import { App, Col, Flex, Row } from 'antd';
import { isEmpty } from 'lodash';

import type { MessageDto, MessageTranslationDto, EditTableHandler, TableData } from '@/types';
import { CancelButton, SaveButton } from '@/components/common/buttons';
import { CommonFormDrawer } from '@/components/common/drawer';
import { FormInput, FormSelect, FormTextArea } from '@/components/common/form';
import { PermissionGate } from '@/components/common';
import { ABILITY_ACTION, ABILITY_SUBJECT, MESSAGE_CODES } from '@/constants';
import { useAppForm, useAppTranslate } from '@/hooks';
import { useGetMessage, useUpdateMessage } from '@/hooks/modules';
import { authService } from '@/services/auth/authJwtService';
import { authStore, useMessageManagementStore } from '@/stores';
import { TranslationTable } from '../tables';

type ViewMessageDrawerProps = {
	open: boolean;
	onClose: () => void;
};

export const ViewMessageDrawer = ({ open, onClose }: ViewMessageDrawerProps) => {
	const { m } = useAppTranslate();
	const { message } = App.useApp();

	// Edit Table Refs
	const tableRef = React.useRef<EditTableHandler<MessageTranslationDto> | null>(null);

	// Zustands
	const selectMsgId = useMessageManagementStore((state) => state.selectMsgId);
	const setSelectedRows = useMessageManagementStore((state) => state.setSelectedRows);

	// Hooks
	const { data: messageInfo, isLoading } = useGetMessage(
		{
			coId: authStore.user?.userInfo.coId,
			msgId: selectMsgId!,
		},
		!isEmpty(selectMsgId),
	);

	const form = useAppForm<MessageDto>({
		formName: 'viewMessage',
		initialValues: messageInfo,
	});
	const tableForm = useAppForm<{ [key: string]: MessageTranslationDto[] }>({
		formName: 'translationTable',
	});

	const { mutate: updateMessageMutation, isPending: isUpdating } = useUpdateMessage({
		onSuccess: () => {
			message.success(m(MESSAGE_CODES.COM000004));
			handleCloseDrawer();
		},
		onError: (err) => {
			console.log(err);
			message.error(m(err.errorCode || MESSAGE_CODES.SYSMESSAGE));
		},
	});

	React.useEffect(() => {
		tableForm.setInitialFieldsValue({
			['translationTable']: messageInfo?.translations?.map((item, index) => ({
				...item,
				key: index,
				procFlag: 'S',
			})),
		});
	}, [messageInfo]);

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
		const deletedRows = tableRef.current?.getDeletedRows?.() || [];
		const modifiedRows = (tableValue['translationTable'] as TableData<MessageTranslationDto>[]).filter(
			(item: MessageTranslationDto) => item.procFlag != 'S',
		);

		updateMessageMutation({
			coId: authService.getCurrentCompany(),
			...formValue,
			translations: [...modifiedRows, ...deletedRows],
		});
	}

	return (
		<CommonFormDrawer<MessageDto>
			form={form}
			initialValues={{}}
			open={open}
			title={'Message Information'}
			loading={isLoading}
			onClose={handleBeforeCloseModal}
			footer={
				<Flex gap={8}>
					<PermissionGate
						permissions={[
							{ ability: ABILITY_ACTION.SAVE, entity: ABILITY_SUBJECT.MESSAGE_MANAGEMENT },
						]}
						variant="hidden"
					>
						<SaveButton loading={isUpdating} onClick={handleSave}>
							Save
						</SaveButton>
					</PermissionGate>
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
								placeholder="Message ID"
								required
								maxLength={20}
								disabled
							/>
						</Col>
						<Col span={6}>
							<FormSelect
								name="mdlNm"
								label="Module"
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
						maxLength={500}
						rows={3}
					/>
				</Flex>
			</Flex>
		</CommonFormDrawer>
	);
};

