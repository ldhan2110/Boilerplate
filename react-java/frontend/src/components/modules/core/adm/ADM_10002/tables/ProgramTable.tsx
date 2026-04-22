import React from 'react';
import { App, Button, Flex, Tag } from 'antd';
import { FileOutlined, FolderFilled } from '@ant-design/icons';

import type { ProgramTree, TableColumn, TableData } from '@/types';
import { AddButton, DeleteButton } from '@/components/common/buttons';
import CustomTable from '@/components/common/custom-table/CustomTable';
import { PermissionGate } from '@/components/common';
import { ABILITY_ACTION, ABILITY_SUBJECT, MESSAGE_CODES } from '@/constants';
import { useAppTranslate, usePermission, useShowMessage } from '@/hooks';
import { useDeletePrograms, useGetProgramList } from '@/hooks/modules';
import { authStore, useRoleManagementStore } from '@/stores';
import { formatDate, getAllChildNodes } from '@/utils/helper';
import { AddProgramModal, ViewProgramModal } from '../modals';

export const ProgramTable = () => {
	const { t, m } = useAppTranslate();
	const { message } = App.useApp();
	const { hasAbility } = usePermission();
	const { showWarningMessage } = useShowMessage();
	const [openAddProgram, setOpenAddProgram] = React.useState<boolean>(false);
	const [openViewProgram, setOpenViewProgram] = React.useState<boolean>(false);

	//=========================ZUSTAND STORES===============================
	const search = useRoleManagementStore((state) => state.search);
	const selectionRows = useRoleManagementStore((state) => state.selectionProgramRows);
	const permissionTableForm = useRoleManagementStore((state) => state.permissionTableForm);

	const setSelectedProgramId = useRoleManagementStore((state) => state.setSelectedProgramId);
	const setSelectionPrograms = useRoleManagementStore((state) => state.setSelectionPrograms);
	const setSelectedProgram = useRoleManagementStore((state) => state.setSelectedProgram);

	//=========================PROGRAM TABLE HOOKS=============================
	const { data: programList, isPending: isLoadingProgram } = useGetProgramList({
		...search.programFilter.filter,
		coId: authStore.user?.userInfo.coId,
	});

	const { mutate: deletePrograms, isPending: isDeleting } = useDeletePrograms({
		onSuccess: () => {
			message.success(m(MESSAGE_CODES.COM000004));
			setSelectionPrograms([]);
		},
		onError: (err) => {
			console.log(err);
			message.error(m(err.errorCode || MESSAGE_CODES.SYSMESSAGE));
		},
	});

	const programColumns: TableColumn<ProgramTree>[] = [
		{
			key: 'pgmNm',
			title: t('Program Name'),
			dataIndex: 'pgmNm',
			width: 200,
			ellipsis: true,
			draggable: false,
			render: (value, record) => {
				const isMenu = record?.pgmTpCd == 'MENU';
				return (
					<Button type="link" onClick={() => handleSelectProgram(record.pgmId!)}>
						<span>
							{isMenu ? (
								<FolderFilled style={{ marginRight: 6 }} />
							) : (
								<FileOutlined style={{ marginRight: 6 }} />
							)}
							{value}
						</span>
					</Button>
				);
			},
		},
		{
			key: 'pgmCd',
			title: t('Program Code'),
			dataIndex: 'pgmCd',
			width: 100,
			ellipsis: true,
			draggable: false,
		},
		{
			key: 'pgmTpCd',
			title: t('Type'),
			dataIndex: 'pgmTpCd',
			width: 70,
			align: 'center',
			ellipsis: true,
			draggable: false,
		},
		{
			key: 'pgmRmk',
			title: t('Remark'),
			dataIndex: 'pgmRmk',
			width: 150,
			ellipsis: true,
			draggable: false,
		},
		{
			key: 'useFlg',
			title: t('Status'),
			align: 'center',
			dataIndex: 'useFlg',
			width: 75,
			draggable: false,
			render: (value: string) =>
				value === 'Y' ? (
					<Tag color="success">{t('Active')}</Tag>
				) : (
					<Tag color="default">{t('Inactive')}</Tag>
				),
		},
		{
			key: 'updDt',
			title: t('Updated Date'),
			dataIndex: 'updDt',
			width: 120,
			draggable: false,
			render: (value) => formatDate(value, true),
		},
		{
			key: 'updUsrId',
			title: t('Updated By'),
			dataIndex: 'updUsrId',
			width: 80,
			draggable: false,
		},
	];

	const buildProgramTree = React.useCallback((nodes: ProgramTree[]): ProgramTree[] => {
		const map = new Map<string, ProgramTree>();
		const tree: ProgramTree[] = [];

		// 1. Map all nodes
		nodes.forEach((node) => map.set(node.pgmId!, { ...node }));

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

	//=========================PROGRAM TABLE EVENTS=========================
	function handleSelectChange(_selectedKey: React.Key[], selectedRows: TableData<ProgramTree>[]) {
		if (selectedRows.length == 0) {
			setSelectionPrograms(selectedRows);
			return;
		}

		let selectedPgm: ProgramTree[] = [];

		for (const pgm of selectedRows) {
			const listNodes = getAllChildNodes(pgm);
			selectedPgm = [...selectedPgm, ...listNodes];
		}
		setSelectionPrograms(
			Array.from(
				new Map((selectedPgm as TableData<ProgramTree>[]).map((item) => [item.key, item])).values(),
			),
		);
	}

	function handleSelectProgram(id: string) {
		const isPermit = hasAbility(
			ABILITY_ACTION.VIEW_PROGRAM_DETAIL,
			ABILITY_SUBJECT.ROLE_MANAGEMENT,
		);
		if (isPermit) {
			setSelectedProgramId(id);
			setOpenViewProgram(true);
		} else message.warning(m(MESSAGE_CODES.COM000010));
	}

	function handleRowProgramClick(record: TableData<ProgramTree>) {
		setSelectedProgram(record);
	}

	function onRowClick(record: TableData<ProgramTree>) {
		permissionTableForm?.checkUnsavedFormChange(() => handleRowProgramClick(record));
	}

	async function handleDeleteProgramRows() {
		await deletePrograms(selectionRows);
	}

	function onClickDeleteProgram() {
		if (selectionRows.length === 0) {
			message.warning(m(MESSAGE_CODES.COM000005));
		} else {
			showWarningMessage(m(MESSAGE_CODES.ADM000009), handleDeleteProgramRows);
		}
	}

	const treeData = React.useMemo(() => {
		return buildProgramTree(
			programList?.programList?.map((item) => ({
				...item,
				key: item.treeKey!,
			})) || [],
		) as TableData<ProgramTree>[];
	}, [programList?.programList, buildProgramTree]);

	return (
		<>
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
							ability: ABILITY_ACTION.DELETE_PROGRAM,
							entity: ABILITY_SUBJECT.ROLE_MANAGEMENT,
						},
					]}
					variant="hidden"
				>
					<DeleteButton
						loading={isDeleting}
						hidden={selectionRows.length == 0}
						onClick={onClickDeleteProgram}
					>
						{t('Delete Program')}
					</DeleteButton>
				</PermissionGate>
				<PermissionGate
					permissions={[
						{
							ability: ABILITY_ACTION.ADD_PROGRAM,
							entity: ABILITY_SUBJECT.ROLE_MANAGEMENT,
						},
					]}
					variant="hidden"
				>
					<AddButton type="default" onClick={() => setOpenAddProgram(true)}>
						{t('Add Program')}
					</AddButton>
				</PermissionGate>
			</Flex>
			<CustomTable<ProgramTree>
				columns={programColumns}
				headerOffset={375}
				loading={isLoadingProgram}
				isTree={true}
				data={treeData}
				isSelectStrict={true}
				tableState={{
					rowSelection: selectionRows,
				}}
				onSelectChange={handleSelectChange}
				onRowClick={onRowClick}
			/>

			<AddProgramModal
				open={openAddProgram}
				onCancel={() => {
					setOpenAddProgram(false);
				}}
			/>
			{openViewProgram && (
				<ViewProgramModal open={openViewProgram} onCancel={() => setOpenViewProgram(false)} />
			)}
		</>
	);
};
