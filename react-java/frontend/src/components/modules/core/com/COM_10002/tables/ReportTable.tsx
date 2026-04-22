import { App, Button, Flex, Tag } from 'antd';
import type { ReportDto, SORT, TableColumn, TableData } from '@/types';
import CustomTable from '@/components/common/custom-table/CustomTable';
import { useAppTranslate, usePermission, useToggle } from '@/hooks';
import { useGetReportList } from '@/hooks/modules/com/report';
import { authStore } from '@/stores';
import { useReportManagementStore } from '@/stores/modules';
import { convertToDBColumn, formatDate } from '@/utils/helper';
import { ViewReportModal } from '../modals';
import { ABILITY_ACTION, ABILITY_SUBJECT, MESSAGE_CODES } from '@/constants';
import { downloadFileAndSave } from '@/services/api';

export const ReportTable = () => {
	const { t, m } = useAppTranslate();
	const { hasAbility } = usePermission();
	const { message } = App.useApp();
	const { isToggle: isOpenViewReportModal, toggle: toggleViewReportModal } = useToggle(false);

	// Zustand store
	const searchConditions = useReportManagementStore((state) => state.search);
	const selectedRows = useReportManagementStore((state) => state.selectedRows);
	const setSelectedReportCd = useReportManagementStore((state) => state.setSelectedReportCd);
	const setSelectedRows = useReportManagementStore((state) => state.setSelectedRows);
	const setSort = useReportManagementStore((state) => state.setSort);
	const setPagination = useReportManagementStore((state) => state.setPagination);

	// Hooks
	const { data: reportList, isLoading } = useGetReportList({
		...searchConditions.filter,
		coId: authStore.user?.userInfo.coId,
		pagination: searchConditions.pagination,
		sort: searchConditions.sort,
	});
	

	const columns: TableColumn<ReportDto>[] = [
		{
			key: 'rptCd',
			title: t('Report Code'),
			dataIndex: 'rptCd',
			width: 150,
			sorter: true,
			render: (value: string) => (
				<Button type="link" onClick={() => handleSelectReport(value)}>
					{value}
				</Button>
			),
		},
		{
			key: 'rptNm',
			title: t('Report Name'),
			dataIndex: 'rptNm',
			width: 180,
			ellipsis: true,
			sorter: true,
			render: (value: string) => t(value),
		},
		{
			key: 'rptFileName',
			title: t('File'),
			dataIndex: 'rptFileName',
			width: 180,
			ellipsis: true,
			render: (value: string, record: ReportDto) => (
				<Button type="link" onClick={() => handleDownloadReport(record.rptFileId!)}>
					{value}
				</Button>
			),
		},
		{
			key: 'rptUrl',
			title: t('URL'),
			dataIndex: 'rptUrl',
			width: 180,
			ellipsis: true,
		},
		{
			key: 'pgmNm',
			title: t('Program Name'),
			dataIndex: 'pgmNm',
			width: 180,
			ellipsis: true,
			render: (value: string) => t(value),
		},
		{
			key: 'useFlg',
			title: t('Status'),
			dataIndex: 'useFlg',
			width: 100,
			align: 'center',
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
			width: 150,
			render: (value) => formatDate(value, true),
		},
		{
			key: 'creUsrId',
			title: t('Created By'),
			dataIndex: 'creUsrId',
			width: 140,
			sorter: true,
		},
		{
			key: 'updDt',
			title: t('Updated Date'),
			dataIndex: 'updDt',
			sorter: true,
			width: 150,
			render: (value) => formatDate(value, true),
		},
		{
			key: 'updUsrId',
			title: t('Updated By'),
			dataIndex: 'updUsrId',
			width: 140,
			sorter: true,
		},
	];

	async function handleDownloadReport(rptFileId: string) {
		try {
			await downloadFileAndSave(rptFileId)
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (_err: unknown) {
			message.error(t('Failed to download report'));
		}
	}

	function handleSelectReport(rptCd: string) {
		const isPermit = hasAbility(ABILITY_ACTION.VIEW_DETAIL, ABILITY_SUBJECT.REPORT_MANAGEMENT);
		if (isPermit) {
			setSelectedReportCd(rptCd);
			toggleViewReportModal();
		} else {
			message.warning(m(MESSAGE_CODES.COM000010));
		}
	}

	function handleSortChange(sortField: string | undefined, sortType: SORT | undefined) {
		setSort({
			sortField: convertToDBColumn(sortField as string),
			sortType,
		});
	}

	function handleSelectChange(_selectedKey: React.Key[], selectedRows: TableData<ReportDto>[]) {
		setSelectedRows(selectedRows);
	}

	return (
		<Flex vertical>
			<CustomTable<ReportDto>
				columns={columns}
				loading={isLoading}
				headerOffset={360}
				data={
					reportList?.reportList?.map((item, index) => ({
						...item,
						key: index,
						procFlag: 'S',
					})) ?? []
				}
				tableState={{
					rowSelection: selectedRows,
					pagination: {
						...searchConditions.pagination,
						total: reportList?.total ?? 0,
					},
				}}
				onSortChange={handleSortChange}
				onPaginationChange={setPagination}
				onSelectChange={handleSelectChange}
			/>


			<ViewReportModal open={isOpenViewReportModal} onCancel={()=> {
				setSelectedReportCd(null);
				toggleViewReportModal()
			}} />
		</Flex>
	);
};

