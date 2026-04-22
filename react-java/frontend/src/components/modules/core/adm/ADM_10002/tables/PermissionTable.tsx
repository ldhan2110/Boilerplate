import React from 'react';
import { App, Flex, Typography } from 'antd';
import { get, isEmpty, isEqual } from 'lodash';

import {
	EDIT_TYPE,
	type EditTableHandler,
	type PermissionDto,
	type TableColumn,
	type TableData,
} from '@/types';
import { AddButton, DeleteButton, SaveButton } from '@/components/common/buttons';
import EditCustomTable from '@/components/common/custom-table/EditCustomTable';
import { PermissionGate } from '@/components/common';
import { ABILITY_ACTION, ABILITY_SUBJECT, MESSAGE_CODES, VIEW_PERMISSION_CODE } from '@/constants';
import { useAppForm, useAppTranslate } from '@/hooks';
import { useGetPermissionByProgram, useSavePermissionsByProgram } from '@/hooks/modules';
import { authStore, useRoleManagementStore } from '@/stores';
import { ROUTE_KEYS } from '@/utils/routes';

export type EditPermissionTableForm = {
	[key: string]: PermissionDto[];
};

export const PermissionTable = () => {
	const { t, m } = useAppTranslate();
	const { message } = App.useApp();
	const formTableName = React.useMemo(() => 'permissions', []);
	const form = useAppForm<EditPermissionTableForm>({
		formName: 'permissionTable',
		tabKey: ROUTE_KEYS.ADMIN.ROLE_MANAGEMENT,
		isWatching: true,
	});

	//=========================ZUSTAND STORES=============================
	const hideSavePermButton = useRoleManagementStore((state) => state.hideSavePermButton);
	const selectionPermissionRows = useRoleManagementStore((state) => state.selectionPermissionRows);
	const program = useRoleManagementStore((state) => state.selectedProgram);
	const setSelectionPermissions = useRoleManagementStore((state) => state.setSelectionPermissions);
	const setPermissionTableForm = useRoleManagementStore((state) => state.setPermissionTableForm);
	const setHideSavePermBtn = useRoleManagementStore((state) => state.setHideSavePermBtn);

	// Edit Table Refs
	const tableRef = React.useRef<EditTableHandler<PermissionDto> | null>(null);

	// =========================PERMISSION TABLE HOOKS===========================
	const { data: permissionList, isLoading: isLoadingPermission } = useGetPermissionByProgram(
		{
			pgmId: program?.pgmId,
			coId: authStore.user?.userInfo.coId,
		},
		!isEmpty(program?.pgmId),
	);

	const { mutate: savePermissions, isPending: isSaving } = useSavePermissionsByProgram({
		onSuccess: () => {
			message.success(m(MESSAGE_CODES.COM000004));
			tableRef.current?.resetDeletedRows();
		},
		onError: (err) => {
			console.log(err);
			message.error(m(err.errorCode || MESSAGE_CODES.SYSMESSAGE));
		},
	});

	// =========================USE EFFECTS===========================
	React.useEffect(() => {
		form.setInitialFieldsValue({
			[formTableName]: permissionList?.map((item, index) => ({
				...item,
				key: index,
				procFlag: 'S',
			})),
		});
		setPermissionTableForm(form);
	}, [form, formTableName, permissionList, setPermissionTableForm]);

	const permissionColumn: TableColumn<PermissionDto>[] = [
		{
			key: 'permCd',
			title: t('Permission Code'),
			dataIndex: 'permCd',
			width: 80,
			draggable: false,
			editType: EDIT_TYPE.INPUT,
			editProps: {
				required: true,
				maxLength: 20,
				placeholder: t('Enter Permission Code'),
				rules: [
					{
						validator: (_, value) => {
							const permissionList = form.getFieldValue(formTableName) || [];
							const permissions = permissionList
								.map((permission: PermissionDto) => permission?.permCd)
								.filter(Boolean);

							const duplicateCount = permissions.filter((p: string) => p === value).length;

							if (duplicateCount > 1) {
								return Promise.reject(new Error(t('Duplicate Permission Code')));
							}
							return Promise.resolve();
						},
					},
				],
				shouldUpdate: (prev, curr, rowIndex) => {
					if (curr[formTableName] == undefined || prev[formTableName] == undefined) return false;
					return !isEqual(prev[formTableName][rowIndex], curr[formTableName][rowIndex]);
				},
				overrideEditProps(curVal, rowIdx) {
					const dataTable = (curVal[formTableName] || []) as TableData<PermissionDto>[];
					const row = dataTable[rowIdx];
					return {
						disabled:
							row?.permCd == VIEW_PERMISSION_CODE &&
							row?.procFlag == 'S',
						clearValueDisable: false,
					};
				},
			},
		},
		{
			key: 'permNm',
			title: t('Permission Name'),
			dataIndex: 'permNm',
			width: 250,
			draggable: false,
			editType: EDIT_TYPE.INPUT,
			editProps: {
				required: true,
				maxLength: 50,
				placeholder: t('Enter Permission Name'),
				shouldUpdate: (prev, curr, rowIndex) => {
					if (curr[formTableName] == undefined || prev[formTableName] == undefined) return false;
					return !isEqual(prev[formTableName][rowIndex], curr[formTableName][rowIndex]);
				},
				overrideEditProps(curVal, rowIdx) {
					const dataTable = (curVal[formTableName] || []) as TableData<PermissionDto>[];
					const row = dataTable[rowIdx];
					return {
						disabled:
							row?.permCd == VIEW_PERMISSION_CODE &&
							row?.procFlag == 'S',
						clearValueDisable: false,
					};
				},
			},
		},
	];

	function handleSelectChange(_selectedKey: React.Key[], selectedRows: TableData<PermissionDto>[]) {
		setSelectionPermissions(selectedRows);
	}

	function handleAddPermissionRow() {
		tableRef.current?.onAddRow?.();
	}

	function handleDeletePermissionRow() {
		if (selectionPermissionRows.length === 0) {
			message.warning(m(MESSAGE_CODES.COM000005));
		} else {
			tableRef.current?.onRemoveRow?.(selectionPermissionRows.map((item) => item.key) as number[]);
			setSelectionPermissions([]);
		}
	}

	async function handleSavePermission() {
		const permissionList = await form.validateFields();
		const deletedRows = tableRef.current?.getDeletedRows?.() || [];
		const modifiedRows = (permissionList[formTableName] as TableData<PermissionDto>[])
			.filter((item: PermissionDto) => item.procFlag != 'S')
			.map((item: PermissionDto) => ({
				...item,
				pgmId: program?.pgmId,
				coId: program?.coId,
			}));
		savePermissions([...modifiedRows, ...deletedRows]);
	}

	function onSaveButtonClick() {
		const isFormChange = form.checkFormChange();
		if (isFormChange) handleSavePermission();
		else message.warning(m(MESSAGE_CODES.COM000009));
	}

	function onTableDataChange() {
		setHideSavePermBtn(false);
	}

	function disableDefaultPermission({ index }: { key: number; index: number }) {
		const permission = form.getFieldValue([formTableName, index]);
		return {
			disabled: get(permission, 'permCd', '') == VIEW_PERMISSION_CODE,
		};
	}

	return (
		<>
			<Flex justify="space-between">
				<div>
					<Typography.Text type="secondary">
						{t('Selected Program:')}{' '}
						<Typography.Text strong>{program?.pgmNm ?? ''}</Typography.Text>
					</Typography.Text>
				</div>
				<Flex
					justify="end"
					gap={8}
					style={{
						paddingBottom: '8px',
					}}
				>
					<PermissionGate
						permissions={[
							{
								ability: ABILITY_ACTION.SAVE_PERMISSION,
								entity: ABILITY_SUBJECT.ROLE_MANAGEMENT,
							},
						]}
						variant="hidden"
					>
						<SaveButton loading={isSaving} hidden={hideSavePermButton} onClick={onSaveButtonClick}>
							{t('Save')}
						</SaveButton>
					</PermissionGate>
					<PermissionGate
						permissions={[
							{
								ability: ABILITY_ACTION.DELETE_PERMISSION,
								entity: ABILITY_SUBJECT.ROLE_MANAGEMENT,
							},
						]}
						variant="hidden"
					>
						<DeleteButton
							hidden={selectionPermissionRows.length == 0}
							onClick={handleDeletePermissionRow}
						>
							{t('Delete Permission')}
						</DeleteButton>
					</PermissionGate>
					<PermissionGate
						permissions={[
							{
								ability: ABILITY_ACTION.ADD_PERMISSION,
								entity: ABILITY_SUBJECT.ROLE_MANAGEMENT,
							},
						]}
						variant="hidden"
					>
						<AddButton
							disabled={program == null || program.pgmTpCd == 'MENU'}
							type="default"
							onClick={handleAddPermissionRow}
						>
							{t('Add Permission')}
						</AddButton>
					</PermissionGate>
				</Flex>
			</Flex>

			<EditCustomTable<PermissionDto>
				formTableName={formTableName}
				columns={permissionColumn}
				headerOffset={375}
				data={
					permissionList?.map((perm, index) => ({
						...perm,
						key: index,
						procFlag: 'S',
					})) || []
				}
				tableState={{
					rowSelection: selectionPermissionRows,
				}}
				loading={isLoadingPermission}
				form={form}
				ref={tableRef}
				onSelectChange={handleSelectChange}
				onTableDataChange={onTableDataChange}
				getCheckboxProps={disableDefaultPermission}
			/>
		</>
	);
};
