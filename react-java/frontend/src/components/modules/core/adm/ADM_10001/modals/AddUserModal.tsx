import { App, Col, Flex, Row } from 'antd';

import type { UserInfoDto } from '@/types';
import { FormCheckbox, FormInput, FormSelect, FormTextArea } from '@/components/common/form';
import { CommonFormModal } from '@/components/common/modals';
import { MESSAGE_CODES } from '@/constants';
import { useAppForm, useAppTranslate } from '@/hooks';
import { useAddUser, useGetRoleList } from '@/hooks/modules';
import { authService } from '@/services/auth/authJwtService';
import { authStore } from '@/stores';

type AddUserModalProps = {
	open: boolean;
	onCancel: () => void;
};

export const AddUserModal = ({ open, onCancel }: AddUserModalProps) => {
	const { t, m } = useAppTranslate();
	const form = useAppForm<UserInfoDto>({ formName: 'addUser' });
	const { message } = App.useApp(); // ✅ use the context-aware version

	// Hooks
	const { data: roleList, isLoading: isLoadingRole } = useGetRoleList({
		coId: authStore.user?.userInfo.coId,
		useFlg: 'Y',
	});

	const { mutate: createUser, isPending: isCreating } = useAddUser({
		onSuccess: () => {
			message.success(m(MESSAGE_CODES.COM000004));
			handleCloseModal();
		},
		onError: (err) => {
			console.log(err);
			message.error(m(err.errorCode || MESSAGE_CODES.SYSMESSAGE));
		},
	});

	async function handleAddNewUser() {
		try {
			const formValues = await form.validateFields();
			await createUser({
				coId: authService.getCurrentCompany()!,
				...formValues,
			});
		} catch {
			return;
		}
	}

	function handleCloseModal() {
		form.resetFields();
		onCancel();
	}

	function handleBeforeCloseModal() {
		form.checkUnsavedFormChange(handleCloseModal);
	}

	return (
		<CommonFormModal
			title="Add New"
			open={open}
			form={form}
			onConfirm={handleAddNewUser}
			onCancel={handleBeforeCloseModal}
			width={450}
			okText="Save"
			cancelText="Close"
			confirmLoading={isCreating}
			loading={isLoadingRole}
			initialValues={{
				useFlg: 'Y',
			}}
		>
			<Flex gap={12} className="!mt-4" vertical>
				<Row gutter={[16, 16]}>
					<Col span={19}>
						<FormInput
							name="usrId"
							label="User ID"
							placeholder={t('Input User ID')}
							required
							maxLength={20}
						/>
					</Col>
					<Col span={4}>
						<Flex align="end" className="h-full w-fit">
							<FormCheckbox
								style={{ width: '100px' }}
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
				<FormSelect
					name="roleId"
					label={t('Role')}
					placeholder={t('Select User Role')}
					required
					maxLength={100}
					options={roleList?.roleList!.map((role) => ({
						label: role.roleNm,
						value: role.roleId,
					}))}
				/>
				<FormInput
					name="usrNm"
					label={t('Full Name')}
					placeholder={t('Input User Name')}
					required
					maxLength={100}
				/>
				<FormInput
					name="usrEml"
					label={t('Email')}
					placeholder={t('Input User Email')}
					required
					maxLength={100}
				/>
				<FormInput
					name="usrPhn"
					label="Phone Number"
					placeholder={t('Input Phone Number')}
					maxLength={20}
				/>
				<FormTextArea name="usrDesc" label="Remark" maxLength={500} />
			</Flex>
		</CommonFormModal>
	);
};
