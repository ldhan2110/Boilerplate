import { App, Col, Flex, Row } from 'antd';

import type { UserInfoDto } from '@/types';
import { FormCheckbox, FormInput, FormSelect, FormTextArea } from '@/components/common/form';
import { CommonFormModal } from '@/components/common/modals';
import { ABILITY_ACTION, ABILITY_SUBJECT, MESSAGE_CODES } from '@/constants';
import { useAppForm, useAppTranslate } from '@/hooks';
import { useGetRoleList, useGetUserInfo, useUpdateUser } from '@/hooks/modules';
import { authService } from '@/services/auth/authJwtService';
import { authStore, useUserManagementStore } from '@/stores';

type ViewUserModalProps = {
	open: boolean;
	onCancel: () => void;
};

export const ViewUserModal = ({ open, onCancel }: ViewUserModalProps) => {
	const { t, m } = useAppTranslate();
	const { message } = App.useApp(); // ✅ use the context-aware version
	const { selectedUserId } = useUserManagementStore();
	const { data: roleList, isLoading: isLoadingRole } = useGetRoleList({
		coId: authStore.user?.userInfo.coId,
		useFlg: 'Y',
	});

	const { data: userInfo, isLoading } = useGetUserInfo({
		usrId: selectedUserId!,
		coId: authService.getCurrentCompany()!,
	});

	const form = useAppForm<UserInfoDto>({ formName: 'viewUser', initialValues: userInfo });

	const { mutate: updateUser, isPending: isUpdating } = useUpdateUser({
		onSuccess: () => {
			message.success(m(MESSAGE_CODES.COM000004));
			handleCloseModal();
		},
		onError: (err) => {
			console.log(err);
			message.error(m(err.errorCode || MESSAGE_CODES.SYSMESSAGE));
		},
	});

	async function handleUpdateUserInfo() {
		try {
			const formValues = await form.validateFields();
			updateUser({
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
			title="User Information"
			open={open}
			form={form}
			onConfirm={handleUpdateUserInfo}
			onCancel={handleBeforeCloseModal}
			width={450}
			okText="Save"
			cancelText="Close"
			loading={isLoading || isLoadingRole}
			confirmLoading={isUpdating}
			initialValues={userInfo}
			savePermission={{
				action: ABILITY_ACTION.SAVE,
				subject: ABILITY_SUBJECT.USER_MANAGEMENT,
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
							disabled
						/>
					</Col>
					<Col span={4}>
						<Flex align="end" className="h-full">
							<FormCheckbox
								style={{ width: '120px' }}
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
