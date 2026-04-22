import React from 'react';
import { App, Col, Flex, Row, Typography } from 'antd';
import { FileFilled, FolderFilled } from '@ant-design/icons';
import { isEmpty } from 'lodash';

import type { ProgramTree, RoleDto } from '@/types';
import { FormCheckbox, FormInput, FormTextArea } from '@/components/common/form';
import { CommonFormModal } from '@/components/common/modals';
import { MESSAGE_CODES } from '@/constants';
import { useAppForm, useAppTranslate } from '@/hooks';
import {
	useGetPermissionByProgram,
	useGetProgramList,
	useGetRole,
	useUpdateRole,
} from '@/hooks/modules';
import { authService } from '@/services/auth/authJwtService';
import { authStore, useRoleManagementStore } from '@/stores';
import { PermissionTreeList, ProgramTreeList } from '../trees';
import appStore from '@/stores/AppStore';

type ViewRoleModalProps = {
	open: boolean;
	onCancel: () => void;
};

export const ViewRoleModal = ({ open, onCancel }: ViewRoleModalProps) => {
	const { t, m } = useAppTranslate();
	const form = useAppForm<RoleDto>({ formName: 'viewRole' });
	const { message } = App.useApp();
	const { darkMode } = appStore.state;

	// ===================== ZUSTAND ===================
	const selectedRoleId = useRoleManagementStore((state) => state.selectedRoleId);
	const roleAuthList = useRoleManagementStore((state) => state.roleAuthList);
	const setRoleAuthList = useRoleManagementStore((state) => state.setRoleAuthList);
	const resetRoleProgram = useRoleManagementStore((state) => state.resetRoleProgram);

	// ===================== HOOKS =====================
	const { data: roleData, isLoading: isLoadingRole } = useGetRole(
		{
			coId: authStore.user?.userInfo.coId,
			roleId: selectedRoleId!,
		},
		!isEmpty(selectedRoleId),
	);

	const { data: programList } = useGetProgramList({
		coId: authStore.user?.userInfo.coId,
		useFlg: 'Y',
	});

	const { data: permissionList } = useGetPermissionByProgram(
		{
			coId: authStore.user?.userInfo.coId,
			useFlg: 'Y',
		},
		true,
	);

	const { mutate: updateRole, isPending: isCreatingRole } = useUpdateRole({
		onSuccess: () => {
			message.success(m(MESSAGE_CODES.COM000004));
			handleCloseModal();
		},
		onError: (err) => {
			console.log(err);
			message.error(m(err.errorCode || MESSAGE_CODES.SYSMESSAGE));
		},
	});

	React.useEffect(() => {
		if (roleData && selectedRoleId != null) {
			form.setInitialFieldsValue(roleData);
			setRoleAuthList(roleData.roleAuthList || []);
		}
	}, [selectedRoleId, roleData]);

	// ===================== EVENTS =====================
	const buildProgramTree = React.useCallback((nodes: ProgramTree[]): ProgramTree[] => {
		const map = new Map<string, ProgramTree>();
		const tree: ProgramTree[] = [];

		// 1. Map all nodes
		nodes.forEach((node) =>
			map.set(node.pgmId!, {
				...node,
				icon: node.pgmTpCd == 'MENU' ? <FolderFilled /> : <FileFilled />,
			}),
		);

		// 2. Build tree
		nodes.forEach((node) => {
			const parentId = node.prntPgmId;
			if (parentId && map.has(parentId)) {
				const parent = map.get(parentId)!;
				// Only create children array if parent has children
				if (!parent.children) parent.children = [];
				parent.children.push(map.get(node.pgmId!)!);
			} else {
				tree.push(map.get(node.pgmId!)!);
			}
		});

		return tree;
	}, []);

	// Modals Events
	function handleCloseModal() {
		form.resetFields();
		resetRoleProgram();
		onCancel();
	}

	function handleBeforeCloseModal() {
		form.checkUnsavedFormChange(handleCloseModal);
	}

	async function handleSave() {
		try {
			const formValues = await form.validateFields();
			console.log(roleAuthList);
			await updateRole({
				coId: authService.getCurrentCompany()!,
				...formValues,
				roleAuthList: roleAuthList,
				roleId: roleData?.roleId,
			});
		} catch {
			return;
		}
	}

	return (
		<CommonFormModal
			form={form}
			open={open}
			title="Role Information"
			onCancel={handleBeforeCloseModal}
			onConfirm={handleSave}
			destroyOnHidden
			loading={isLoadingRole}
			confirmLoading={isCreatingRole}
			width={650}
			initialValues={roleData}
		>
			<Flex gap={12} className="!mt-4" vertical>
				<Row gutter={[16, 16]}>
					<Col span={19}>
						<FormInput
							name="roleCd"
							label="Role Code"
							placeholder={t('Input Role Code')}
							required
							maxLength={20}
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
					name="roleNm"
					label="Role Name"
					placeholder={t('Input Role Name')}
					required
					maxLength={200}
				/>

				<FormTextArea
					name="roleDesc"
					maxLength={500}
					label="Remark"
					placeholder={t('Input Remark')}
					rows={3}
				/>
				<Flex vertical>
					<div className="space-y-4">
						<Typography.Text
							strong
							style={{
								fontSize: 12,
							}}
						>
							{t('Permissions')}
						</Typography.Text>
					</div>
					<Flex gap={8}>
						<div
							className="border rounded-lg p-4 min-w-[300px] h-[45vh] overflow-y-auto"
							style={{
								backgroundColor: darkMode ? '#141414' : 'white',
								borderColor: 'var(--ant-color-border-secondary)',
							}}
						>
							<ProgramTreeList
								treeData={buildProgramTree(
									programList?.programList!.map((item) => ({
										...item,
										key: item.treeKey!,
										title: item.pgmNm,
									})) || [],
								)}
								programList={programList?.programList || []}
								permissionList={permissionList || []}
							/>
						</div>
						<div
							className="border rounded-lg p-4 min-w-[295px] h-[45vh] overflow-y-auto"
							style={{
								backgroundColor: darkMode ? '#141414' : 'white',
								borderColor: 'var(--ant-color-border-secondary)',
							}}
						>
							<PermissionTreeList
								treeData={permissionList || []}
								treeProgramData={buildProgramTree(
									programList?.programList!.map((item) => ({
										...item,
										key: item.treeKey!,
										title: item.pgmNm,
									})) || [],
								)}
								programList={programList?.programList || []}
							/>
						</div>
					</Flex>
				</Flex>
			</Flex>
		</CommonFormModal>
	);
};
