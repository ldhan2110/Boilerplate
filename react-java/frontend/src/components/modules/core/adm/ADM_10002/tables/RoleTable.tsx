import { App, Button, Tag } from 'antd';

import type { RoleDto, RoleListDto, SORT, TableColumn, TableData } from '@/types';
import CustomTable from '@/components/common/custom-table/CustomTable';
import { ABILITY_ACTION, ABILITY_SUBJECT, MESSAGE_CODES } from '@/constants';
import { useAppTranslate, usePermission } from '@/hooks';
import { useRoleManagementStore } from '@/stores';
import { convertToDBColumn, formatDate } from '@/utils/helper';

type RoleTableProps = {
	data: RoleListDto;
	isLoading: boolean;
	onSelectRole: (roleId: string) => void;
};

export const RoleTable = ({ data, isLoading, onSelectRole }: RoleTableProps) => {
	const { t, m } = useAppTranslate();
	const { hasAbility } = usePermission();
	const { message } = App.useApp();

	//=========================ZUSTAND STORES===============================
	const searchConditions = useRoleManagementStore((state) => state.search.roleFilter);
	const selectionRoleRows = useRoleManagementStore((state) => state.selectionRoleRows);
	const setSelectionRoles = useRoleManagementStore((state) => state.setSelectionRoles);
	const setRoleSort = useRoleManagementStore((state) => state.setRoleSort);
	const setRolePagination = useRoleManagementStore((state) => state.setRolePagination);

	//=========================COLUMNS DEFINITIONS===============================
	const columns: TableColumn<RoleDto>[] = [
		{
			key: 'roleCd',
			title: t('Role Code'),
			dataIndex: 'roleCd',
			width: 100,
			sorter: true,
			render: (value, record) => (
				<Button
					type="link"
					onClick={() => {
						const isPermit = hasAbility(
							ABILITY_ACTION.VIEW_DETAIL,
							ABILITY_SUBJECT.ROLE_MANAGEMENT,
						);
						if (isPermit) {
							onSelectRole(record.roleId!);
						} else message.warning(m(MESSAGE_CODES.COM000010));
					}}
				>
					{value}
				</Button>
			),
		},
		{
			key: 'roleNm',
			title: t('Role Name'),
			dataIndex: 'roleNm',
			width: 150,
			ellipsis: true,
			sorter: true,
		},
		{
			key: 'roleDesc',
			title: t('Description'),
			dataIndex: 'roleDesc',
			width: 200,
			ellipsis: true,
			sorter: true,
		},
		{
			key: 'useFlg',
			title: t('Status'),
			dataIndex: 'useFlg',
			align: 'center',
			width: 70,
			sorter: true,
			render: (value: string) =>
				value === 'Y' ? (
					<Tag color="success">{t('Active')}</Tag>
				) : (
					<Tag color="default">{t('Inactive')}</Tag>
				),
		},
		{
			key: 'creDt',
			title: t('Created Date'),
			dataIndex: 'creDt',
			sorter: true,
			width: 130,
			render: (value) => formatDate(value, true),
		},
		{
			key: 'creUsrId',
			title: t('Created By'),
			dataIndex: 'creUsrId',
			width: 120,
			sorter: true,
		},
		{
			key: 'updDt',
			title: t('Updated Date'),
			dataIndex: 'updDt',
			sorter: true,
			width: 130,
			render: (value) => formatDate(value, true),
		},
		{
			key: 'updUsrId',
			title: t('Updated By'),
			dataIndex: 'updUsrId',
			width: 120,
			sorter: true,
		},
	];

	function handleSelectChange(_seletedKey: React.Key[], selectedRows: TableData<RoleDto>[]) {
		setSelectionRoles(selectedRows);
	}

	function handleSortChange(sortField: string | undefined, sortType: SORT | undefined) {
		setRoleSort({
			sortField: convertToDBColumn(sortField as string),
			sortType,
		});
	}

	return (
		<>
			<CustomTable<RoleDto>
				columns={columns}
				headerOffset={390}
				data={
					data?.roleList?.map((item, index) => ({
						...item,
						key: index,
						procFlag: 'S',
					})) || []
				}
				loading={isLoading}
				tableState={{
					pagination: {
						...searchConditions.pagination,
						total: data?.total || 0,
					},
					rowSelection: selectionRoleRows,
				}}
				onPaginationChange={setRolePagination}
				onSelectChange={handleSelectChange}
				onSortChange={handleSortChange}
			/>
		</>
	);
};
