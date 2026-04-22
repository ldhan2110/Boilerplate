import React from 'react';
import { App, Flex, Tag, Typography } from 'antd';
import { isEqual } from 'lodash';

import {
	EDIT_TYPE,
	type EditTableHandler,
	type SubCodeDto,
	type SubTblCfg,
	type TableColumn,
	type TableData,
} from '@/types';
import { AddButton, DeleteButton, SaveButton } from '@/components/common/buttons';
import EditCustomTable from '@/components/common/custom-table/EditCustomTable';
import { useAppForm, useAppTranslate, useGetMasterCode, useShowMessage } from '@/hooks';
import { useGetCommonCode } from '@/hooks/modules/com/code';
import { useSaveSubCode } from '@/hooks/modules';
import { authStore, useCommonCodeManagementStore } from '@/stores';
import { ABILITY_ACTION, ABILITY_SUBJECT, MESSAGE_CODES } from '@/constants';
import { ROUTE_KEYS } from '@/utils/routes';
import { PermissionGate } from '@/components/common';
import { buildAttributeColumns } from '../utils';

export type SubCodeTableRef = {
    formTableName: string;
	form: ReturnType<typeof useAppForm<{ subCodes: SubCodeDto[] }>>;
	tableRef: EditTableHandler<SubCodeDto> | null;
};

export type SubCodeTableProps = object;

export const SubCodeTable = React.forwardRef<SubCodeTableRef, SubCodeTableProps>(
	(_props, ref) => {
		const { t, m } = useAppTranslate();
		const { message } = App.useApp();
		const { showConfirmMessage } = useShowMessage();
		const formTableName = React.useMemo(() => 'subCodes', []);
		const form = useAppForm<{ subCodes: SubCodeDto[] }>({
			formName: 'subCodeTable',
			tabKey: ROUTE_KEYS.COM.COMMON_CODE_MANAGEMENT,
			isWatching: true,
		});

		// =========================ZUSTAND STORES=============================
		const selectedMasterCode = useCommonCodeManagementStore((state) => state.selectedMasterCode);
		const selectionSubCodeRows = useCommonCodeManagementStore((state) => state.selectionDetailCodeRows)
		const selectedMasterCodeId = useCommonCodeManagementStore((state) => state.selectedMasterCodeId);
		const setSelectionSubCodeRows = useCommonCodeManagementStore((state) => state.setSelectionDetailCodeRows);
		const setSubCodeTableForm = useCommonCodeManagementStore((state) => state.setSubCodeTableForm);

		// Edit Table Refs
		const tableRef = React.useRef<EditTableHandler<SubCodeDto> | null>(null);

		// Parse subTblCfg from the selected master code
		const subTblCfg = (selectedMasterCode?.subTblCfg as SubTblCfg) ?? null;

		// Collect master code IDs from string-typed SELECT optionConfigs to fetch via API
		const commonCodeCdList = React.useMemo<string[]>(() => {
			if (!subTblCfg) return [];
			return Object.values(subTblCfg)
				.filter((cfg) => cfg.inputType === 'SELECT' && typeof cfg.optionConfig === 'string')
				.map((cfg) => cfg.optionConfig as string);
		}, [subTblCfg]);

		const { data: commonCodeData } = useGetCommonCode(
			{
				coId: authStore.user?.userInfo.coId ?? '',
				cdList: commonCodeCdList,
			},
			commonCodeCdList.length > 0,
		);

		// Build Record<masterCodeId, options[]> from API response
		const commonCodeOptions = React.useMemo<Record<string, { label: string; value: string }[]>>(
			() => {
				if (!commonCodeData || !commonCodeCdList.length) return {};
				return commonCodeData.reduce<Record<string, { label: string; value: string }[]>>(
					(acc, group, index) => {
						const key = group[0]?.mstCd ?? commonCodeCdList[index];
						if (key) {
							acc[key] = group.map((item) => ({
								label: item.subNm ?? '',
								value: item.subCd ?? '',
							}));
						}
						return acc;
					},
					{},
				);
			},
			[commonCodeData, commonCodeCdList],
		);

		// Hooks
		const { data: masterCodeWithSubCodes, isLoading: isLoadingMasterCode } = useGetMasterCode(
			{
				coId: authStore.user?.userInfo.coId,
				mstCd: selectedMasterCodeId || undefined,
			},
			!!selectedMasterCodeId,
		);

		const saveSubCodeMutation = useSaveSubCode({
			onSuccess: () => {
				message.success(m(MESSAGE_CODES.COM000004));
				tableRef.current?.resetDeletedRows?.();
			},
			onError: (error) => {
				message.error(m(error.errorCode || MESSAGE_CODES.COM000001));
			},
		});

		// Expose ref to parent
		React.useImperativeHandle(ref, () => ({
			form,
			formTableName,
			tableRef: tableRef.current,
		}));

		// =========================USE EFFECTS===========================
		React.useEffect(() => {
			const subCodes = masterCodeWithSubCodes?.subCodes || [];
			setSubCodeTableForm(form);
			form.setInitialFieldsValue({
				[formTableName]: subCodes.map((item, index) => ({
					...item,
					key: index,
					procFlag: item.procFlag || 'S',
				})),
			});
		}, [form, formTableName, masterCodeWithSubCodes, selectedMasterCodeId]);

		const subCodeColumns = React.useMemo<TableColumn<SubCodeDto>[]>(
			() => [
				// ===================== FIXED COLUMNS =====================
				{
					key: 'subCd',
					title: t('Sub Code'),
					dataIndex: 'subCd',
					width: 130,
					draggable: false,
					sorter: true,
					editType: EDIT_TYPE.INPUT,
					editProps: {
						required: true,
						placeholder: t('Enter Sub Code'),
						shouldUpdate: (prev, curr, rowIndex) => {
							if (curr[formTableName] == undefined || prev[formTableName] == undefined)
								return false;
							return !isEqual(prev[formTableName][rowIndex], curr[formTableName][rowIndex]);
						},
						overrideEditProps: (curVal, rowIdx) => {
							const dataTable = (curVal[formTableName] || []) as TableData<SubCodeDto>[];
							return {
								disabled: dataTable[rowIdx].procFlag != 'I',
							};
						},
					},
				},
				{
					key: 'subNm',
					title: t('Sub Name'),
					dataIndex: 'subNm',
					width: 150,
					draggable: false,
					sorter: true,
					editType: EDIT_TYPE.INPUT,
					editProps: {
						required: true,
						placeholder: t('Enter Sub Name'),
					},
				},
				{
					key: 'subDesc',
					title: t('Description'),
					dataIndex: 'subDesc',
					width: 200,
					draggable: false,
					sorter: true,
					editType: EDIT_TYPE.INPUT,
					editProps: {
						placeholder: t('Enter Description'),
					},
				},
				{
					key: 'subOrdNo',
					title: t('Order'),
					dataIndex: 'subOrdNo',
					width: 105,
					align: 'right',
					draggable: false,
					sorter: true,
					editType: EDIT_TYPE.INPUT_NUMBER,
					editProps: {
						maxLength: 2,
						placeholder: t('Enter Order'),
						numberType: 'number',
					},
				},
				{
					key: 'dfltFlg',
					title: t('Default'),
					dataIndex: 'dfltFlg',
					width: 105,
					align: 'center',
					draggable: false,
					sorter: true,
					editType: EDIT_TYPE.CHECKBOX,
					editProps: {
						checkboxMapping: {
							checked: 'Y',
							unchecked: 'N',
						},
					},
				},
				{
					key: 'useFlg',
					title: t('Active'),
					dataIndex: 'useFlg',
					width: 105,
					align: 'center',
					draggable: false,
					sorter: true,
					editType: EDIT_TYPE.CHECKBOX,
					editProps: {
						checkboxMapping: {
							checked: 'Y',
							unchecked: 'N',
						},
					},
					render: (value: string) =>
						value === 'Y' ? (
							<Tag color="success">{t('Active')}</Tag>
						) : (
							<Tag color="default">{t('Inactive')}</Tag>
						),
				},
				// ===================== DYNAMIC ATTRIBUTE COLUMNS =====================
				...buildAttributeColumns(subTblCfg, t, commonCodeOptions),
			],
			[subTblCfg, commonCodeOptions, t, formTableName],
		);

		function handleSelectChange(
			_selectedKey: React.Key[],
			selectedRows: TableData<SubCodeDto>[],
		) {
			setSelectionSubCodeRows(selectedRows);
		}

	function handleAddSubCodeRow() {
		if (!selectedMasterCode) {
			return;
		}
		tableRef.current?.insertAbove?.({ useFlg: 'Y', procFlag: 'I' }, 0);
	}

	function handleDeleteSubCodeRows() {
		if (selectionSubCodeRows.length === 0) {
			message.warning(m(MESSAGE_CODES.COM000005));
			return;
		}
		showConfirmMessage(m(MESSAGE_CODES.COM000006), () => {
			const keys = selectionSubCodeRows.map((row) => row.key) as number[];
			tableRef.current?.onRemoveRow?.(keys);
			setSelectionSubCodeRows([]);
		});
	}

	async function handleSaveSubCode() {
		try {
			// Check if a master code is selected
			if (!selectedMasterCode || !selectedMasterCodeId) {
				message.warning(t('Please select a master code first'));
				return;
			}

			// Validate sub code form
			await tableRef.current?.validateAllFields();
			const subCodes = form.getFieldValue(formTableName) as TableData<SubCodeDto>[];

			if (!subCodes || subCodes.length === 0) {
				message.warning(t('Please add at least one sub code'));
				return;
			}

			// Get deleted rows
			const deletedRows = tableRef.current?.getDeletedRows?.() || [];

			// Combine form values with deleted rows
			const allRows = [...subCodes, ...deletedRows];

			// Filter out rows with procFlag 'S' (unchanged rows) and remove 'key' property
			const rowsToSave: SubCodeDto[] = allRows
				.filter((row) => row.procFlag !== 'S')
				.map((row) => {
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { key, ...rowWithoutKey } = row;
					return {
						...rowWithoutKey,
						coId: authStore.user?.userInfo.coId,
						mstCd: selectedMasterCodeId,
					} as SubCodeDto;
				});

			if (rowsToSave.length === 0) {
				message.info(t('No changes to save'));
				return;
			}

			// Call the save mutation
			await saveSubCodeMutation.mutateAsync(rowsToSave);
		} catch (error) {
			// Validation errors are handled by form validation
			// Only log unexpected errors
			if (error && typeof error === 'object' && 'errorFields' in error) {
				// Form validation error, already shown by form
				return;
			}
			console.error('Error saving sub code:', error);
		}
	}

		// Prepare sub code data for table
		const subCodeData = React.useMemo(() => {
			const subCodes = masterCodeWithSubCodes?.subCodes || [];
			return subCodes.map((item, index) => ({
				...item,
				key: index,
				procFlag: (item.procFlag || 'S') as 'S' | 'I' | 'U' | 'D',
			}));
		}, [masterCodeWithSubCodes]);

		return (
			<Flex vertical gap={8}>
				<Flex justify="space-between" align="center" gap={8}>
					<Flex align="center" gap={16}>
						<div>
							<Typography.Text type="secondary">
								{t('Selected Master Code: ')}
								<Typography.Text strong>{selectedMasterCode?.mstCd ?? ''}</Typography.Text>
							</Typography.Text>
						</div>
					</Flex>
					<Flex gap={8}>
						<PermissionGate permissions={[
							{
								ability: ABILITY_ACTION.SAVE_SUB,
								entity: ABILITY_SUBJECT.COMMON_CODE_MANAGEMENT,
							},
						]} variant='hidden'>
							<SaveButton onClick={handleSaveSubCode} />
						</PermissionGate>
						<PermissionGate permissions={[
							{
								ability: ABILITY_ACTION.DELETE_SUB,
								entity: ABILITY_SUBJECT.COMMON_CODE_MANAGEMENT,
							},
						]} variant='hidden'>
							<DeleteButton hidden={selectionSubCodeRows.length == 0} onClick={handleDeleteSubCodeRows}>{t('Delete Sub Code')}</DeleteButton>
						</PermissionGate>

						<PermissionGate permissions={[
							{
								ability: ABILITY_ACTION.ADD_SUB,
								entity: ABILITY_SUBJECT.COMMON_CODE_MANAGEMENT,
							},
						]} variant='hidden'>
							<AddButton type="default" onClick={handleAddSubCodeRow} disabled={!selectedMasterCode}>
								{t('Add Sub Code')}
							</AddButton>
						</PermissionGate>
					</Flex>
				</Flex>

				<EditCustomTable<SubCodeDto>
					formTableName={formTableName}
					columns={subCodeColumns}
					headerOffset={375}
					data={subCodeData}
					tableState={{
						rowSelection: selectionSubCodeRows,
					}}
					loading={isLoadingMasterCode}
					form={form}
					ref={tableRef}
					onSelectChange={handleSelectChange}
					virtual
					sortMode='local'
				/>
			</Flex>
		);
	},
);

SubCodeTable.displayName = 'SubCodeTable';

