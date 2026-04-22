import React from 'react';
import { App, Flex } from 'antd';
import { isEqual } from 'lodash';

import {
	EDIT_TYPE,
	SORT,
	type EditTableHandler,
	type MasterCodeDto,
	type TableColumn,
	type TableData,
} from '@/types';
import { AddButton, DeleteButton, SaveButton } from '@/components/common/buttons';
import EditCustomTable from '@/components/common/custom-table/EditCustomTable';
import { useAppForm, useAppTranslate } from '@/hooks';
import { useGetListMasterCode, useSaveMasterCode, useShowMessage } from '@/hooks/modules';
import { authStore, useCommonCodeManagementStore } from '@/stores';
import { ROUTE_KEYS } from '@/utils/routes';
import { ABILITY_ACTION, ABILITY_SUBJECT, MESSAGE_CODES } from '@/constants';
import { convertToDBColumn, formatDate } from '@/utils/helper';
import { PermissionGate } from '@/components';

export type MasterCodeTableRef = {
	formTableName: string;
	form: ReturnType<typeof useAppForm<{ masterCodes: MasterCodeDto[] }>>;
	tableRef: EditTableHandler<MasterCodeDto> | null;
};

export type MasterCodeTableProps = object;

export const MasterCodeTable = React.forwardRef<MasterCodeTableRef, MasterCodeTableProps>(
	(_props, ref) => {
		const { t, m } = useAppTranslate();
		const { message } = App.useApp();
		const { showConfirmMessage } = useShowMessage();
		const formTableName = React.useMemo(() => 'masterCodes', []);
		const form = useAppForm<{ masterCodes: MasterCodeDto[] }>({
			formName: formTableName,
			tabKey: ROUTE_KEYS.COM.COMMON_CODE_MANAGEMENT,
			isWatching: true,
		});

		// =========================ZUSTAND STORES=============================
		const masterCodeSearch = useCommonCodeManagementStore((state) => state.masterCodeSearch);
		const selectionMasterCodeRows = useCommonCodeManagementStore((state) => state.selectionMasterCodeRows);
		const selectedMasterCode = useCommonCodeManagementStore((state) => state.selectedMasterCode);
		const subCodeTableForm = useCommonCodeManagementStore((state) => state.subCodeTableForm);
		const setMasterCodePagination = useCommonCodeManagementStore((state) => state.setMasterCodePagination);
		const setSelectionMasterCodeRows = useCommonCodeManagementStore((state) => state.setSelectionMasterCodeRows);
		const setSelectedMasterCode = useCommonCodeManagementStore((state) => state.setSelectedMasterCode);
		const setSelectedMasterCodeId = useCommonCodeManagementStore((state) => state.setSelectedMasterCodeId);
		const setMasterCodeSort = useCommonCodeManagementStore((state) => state.setMasterCodeSort);
		const setMasterCodeTableForm = useCommonCodeManagementStore((state) => state.setMasterCodeTableForm);

		// Edit Table Refs
		const tableRef = React.useRef<EditTableHandler<MasterCodeDto> | null>(null);

		// Expose ref to parent
		React.useImperativeHandle(ref, () => ({
			form,
			formTableName,
			tableRef: tableRef.current,
		}));

		// =========================MASTER CODE TABLE HOOKS===========================
		const { data: masterCodeListData, isLoading: isLoadingMasterCode } = useGetListMasterCode({
			...masterCodeSearch.filter,
			sort: masterCodeSearch.sort,
			pagination: masterCodeSearch.pagination,
		});

		const saveMasterCodeMutation = useSaveMasterCode({
			onSuccess: () => {
				message.success(m(MESSAGE_CODES.COM000004));
				tableRef.current?.resetDeletedRows?.();
			},
			onError: (error) => {
				message.error(m(error.errorCode || MESSAGE_CODES.COM000001));
			},
		});

		// =========================USE EFFECTS===========================
		React.useEffect(() => {
			setMasterCodeTableForm(form);
			const masterCodes = masterCodeListData?.masterCodes || [];
			form.setInitialFieldsValue({
				[formTableName]: masterCodes.map((item, index) => ({
					...item,
					key: index,
					procFlag: item.procFlag || 'S',
				})),
			});
		}, [form, formTableName, masterCodeListData]);
		

		const masterCodeColumns: TableColumn<MasterCodeDto>[] = [
			{
				key: 'mstCd',
				title: t('Master Code'),
				dataIndex: 'mstCd',
				width: 120,
				draggable: false,
				sorter: true,
				editType: EDIT_TYPE.INPUT,
				editProps: {
					required: true,
					maxLength: 20,
					placeholder: t('Enter Master Code'),
					rules: [
						{
							validator: (_, value) => {
								const masterCodeList = form.getFieldValue(formTableName) || [];
								const masterCodes = masterCodeList
									.map((masterCode: MasterCodeDto) => masterCode?.mstCd)
									.filter(Boolean);

								const duplicateCount = masterCodes.filter((m: string) => m === value).length;

								if (duplicateCount > 1) {
									return Promise.reject(new Error(t('Duplicate Master Code')));
								}
								return Promise.resolve();
							},
						},
					],
					shouldUpdate: (prev, curr, rowIndex) => {
						if (curr[formTableName] == undefined || prev[formTableName] == undefined)
							return false;
						return !isEqual(prev[formTableName][rowIndex], curr[formTableName][rowIndex]);
					},
                    overrideEditProps: (curVal, rowIdx) => {
                        const dataTable = (curVal[formTableName] || []) as TableData<MasterCodeDto>[];
                        return {
                            disabled: dataTable[rowIdx].procFlag != 'I',
                        };
                    },
				},
			},
			{
				key: 'mstNm',
				title: t('Master Name'),
				dataIndex: 'mstNm',
				width: 170,
				draggable: false,
				sorter: true,
				editType: EDIT_TYPE.INPUT,
				editProps: {
					required: true,
					maxLength: 200,
					placeholder: t('Enter Master Name'),
				},
			},
			{
				key: 'mstMdlNm',
				title: t('Module Name'),
				dataIndex: 'mstMdlNm',
				width: 120,
				draggable: false,
				sorter: true,
				editType: EDIT_TYPE.INPUT,
				editProps: {
					maxLength: 20,
					placeholder: t('Enter Module Name'),
				},
			},
			{
				key: 'mstDesc',
				title: t('Description'),
				dataIndex: 'mstDesc',
				width: 250,
				draggable: false,
				sorter: true,
				editType: EDIT_TYPE.INPUT,
				editProps: {
					maxLength: 500,
					placeholder: t('Enter Description'),
				},
			},
			{
				key: 'useFlg',
				title: t('Active'),
				dataIndex: 'useFlg',
				width: 80,
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
				key: 'updDt',
				title: t('Updated Date'),
				dataIndex: 'updDt',
				width: 120,
				draggable: false,
				sorter: true,
				render: (value) => formatDate(value, true),
			},
			{
				key: 'updUsrId',
				title: t('Updated By'),
				dataIndex: 'updUsrId',
				width: 120,
				draggable: false,
				sorter: true,
			},
		];

		function handleSelectChange(
			_selectedKey: React.Key[],
			selectedRows: TableData<MasterCodeDto>[],
		) {
			setSelectionMasterCodeRows(selectedRows);
		}

		function handleAddMasterCodeRow() {
			tableRef.current?.insertAbove?.({ useFlg: 'Y', procFlag: 'I' }, 0);
		}

		function handleSortChange(sortField: string | undefined, sortType: SORT | undefined) {
			subCodeTableForm?.checkUnsavedFormChange(() => {
				setMasterCodeSort({
					sortField: convertToDBColumn(sortField as string),
					sortType,
				});
				setSelectedMasterCode(null);
				setSelectedMasterCodeId(null);
			});
		}

		function handlePaginationChange(current: number, pageSize: number) {
			subCodeTableForm?.checkUnsavedFormChange(() => {
				setMasterCodePagination(current, pageSize);
				setSelectedMasterCode(null);
				setSelectedMasterCodeId(null);
			});
		}

		function handleDeleteSubCodeRows() {
			if (selectionMasterCodeRows.length === 0) {
				message.warning(m(MESSAGE_CODES.COM000005));
				return;
			}
			showConfirmMessage(m(MESSAGE_CODES.COM000006), () => {
                if (selectionMasterCodeRows.findIndex((row) => row.mstCd == selectedMasterCode?.mstCd) !== -1) {
					setSelectedMasterCode(null);
					setSelectedMasterCodeId(null);
				}
				const keys = selectionMasterCodeRows.map((row) => row.key) as number[];
				tableRef.current?.onRemoveRow?.(keys);
				setSelectionMasterCodeRows([]);
			});
		}

		function handleRowMasterCodeClick(record: TableData<MasterCodeDto>) {
			if (record?.procFlag == 'I') {
				return;
			}
			subCodeTableForm?.checkUnsavedFormChange(() => {
				if (selectedMasterCode?.mstCd !== record?.mstCd && record?.procFlag != 'I') {
					setSelectedMasterCode(record as MasterCodeDto);
					setSelectedMasterCodeId(record?.mstCd || null);
				}
			});
		}

		async function handleSaveMasterCode() {
			try {
				// Validate master code form
				await tableRef.current?.validateAllFields();
				const masterCodes = form.getFieldValue(formTableName) as TableData<MasterCodeDto>[];

				if (!masterCodes || masterCodes.length === 0) {
					message.warning(t('Please add at least one master code'));
					return;
				}

				// Get deleted rows
				const deletedRows = tableRef.current?.getDeletedRows?.() || [];

				// Combine form values with deleted rows
				const allRows = [...masterCodes, ...deletedRows];

				// Filter out rows with procFlag 'S' (unchanged rows) and remove 'key' property
				const rowsToSave: MasterCodeDto[] = allRows
					.filter((row) => row.procFlag !== 'S')
					.map((row) => {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const { key, ...rowWithoutKey } = row;
						return {
							...rowWithoutKey,
							coId: authStore.user?.userInfo.coId,
						} as MasterCodeDto;
					});

				if (rowsToSave.length === 0) {
					message.info(t('No changes to save'));
					return;
				}

				// Call the save mutation
				await saveMasterCodeMutation.mutateAsync(rowsToSave);
			} catch (error) {
				// Validation errors are handled by form validation
				if (error && typeof error === 'object' && 'errorFields' in error) {
					// Form validation error - show user-friendly message
					message.error(m(MESSAGE_CODES.COM000017));
					return;
				}
				// Only log unexpected errors
				console.error('Error saving master code:', error);
			}
		}

		// Prepare master code data for table
		const masterCodeData = React.useMemo(() => {
			const masterCodes = masterCodeListData?.masterCodes || [];
			return masterCodes.map((item, index) => ({
				...item,
				key: index,
				procFlag: (item.procFlag || 'S') as 'S' | 'I' | 'U' | 'D',
			}));
		}, [masterCodeListData]);

		return (
			<Flex vertical gap={8}>
				<Flex justify="end" gap={8}>
				    <PermissionGate permissions={[
							{
								ability: ABILITY_ACTION.SAVE_MST,
								entity: ABILITY_SUBJECT.COMMON_CODE_MANAGEMENT,
							},
						]} variant='hidden'>
						<SaveButton onClick={handleSaveMasterCode} />
					</PermissionGate>
					<PermissionGate permissions={[
							{
								ability: ABILITY_ACTION.DELETE_MST,
								entity: ABILITY_SUBJECT.COMMON_CODE_MANAGEMENT,
							},
						]} variant='hidden'>
							<DeleteButton hidden={selectionMasterCodeRows.length == 0} onClick={handleDeleteSubCodeRows}>{t('Delete Master Code')}</DeleteButton>
						</PermissionGate>
					<PermissionGate permissions={[
							{
								ability: ABILITY_ACTION.ADD_MST,
								entity: ABILITY_SUBJECT.COMMON_CODE_MANAGEMENT,
							},
						]} variant='hidden'>
							<AddButton type="default" onClick={handleAddMasterCodeRow}>
								{t('Add Master Code')}
							</AddButton>
						</PermissionGate>
				</Flex>

				<EditCustomTable<MasterCodeDto>
					formTableName={formTableName}
					columns={masterCodeColumns}
					headerOffset={650}
					data={masterCodeData}
					tableState={{
						rowSelection: selectionMasterCodeRows,
						pagination: {
							...masterCodeSearch.pagination,
							total: masterCodeListData?.total || 0,
						},
					}}
					loading={isLoadingMasterCode}
					form={form}
					ref={tableRef}
					onRowClick={handleRowMasterCodeClick}
					onSelectChange={handleSelectChange}
					onSortChange={handleSortChange}
					onPaginationChange={handlePaginationChange}
				/>
			</Flex>
		);
	},
);
