import { Button, Flex, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useState } from 'react';
import CustomTable from '@/components/common/custom-table/CustomTable';
import { useAppTranslate, useToggle } from '@/hooks';
import { useGetEmailList } from '@/hooks/modules';
import { authStore } from '@/stores';
import { convertToDBColumn, formatDate } from '@/utils/helper';
import type { EmailListDto, SearchEmailParams } from '@/services/api/core/sys/email/getEmailList.service';
import type { SORT, TableColumn } from '@/types';
import { EmailDetailModal } from '../modals';
import { ResendEmailButton } from '../buttons';

interface EmailTableProps {
	filterValues: {
		fromDate?: string;
		toDate?: string;
		emlSndStsCd?: string;
		emlTo?: string;
		emlSubjVal?: string;
	};
	selectedRows: EmailListDto[];
	onSelectChange: (selectedRowKeys: React.Key[], selectedRows: EmailListDto[]) => void;
}

export const EmailTable: React.FC<EmailTableProps> = ({ filterValues, selectedRows, onSelectChange }) => {
	const { t } = useAppTranslate();
	const { isToggle: isModalOpen, toggle: toggleModal } = useToggle(false);
	const [selectedEmlId, setSelectedEmlId] = useState<string | null>(null);
	const [sort, setSort] = useState<{ sortField?: string; sortType?: string }>({});
	const [pagination, setPagination] = useState({ pageSize: 20, current: 1 });

	const searchParams: SearchEmailParams = {
		...filterValues,
		coId: authStore.user?.userInfo.coId,
		sort,
		pagination,
	};

	const { data: emailListResult, isLoading } = useGetEmailList(searchParams);

	const columns: TableColumn<EmailListDto>[] = [
		{
			key: 'emlId',
			title: t('Email ID'),
			dataIndex: 'emlId',
			width: 120,
		},
		{
			key: 'emlTo',
			title: t('To'),
			dataIndex: 'emlTo',
			width: 200,
			ellipsis: true,
		},
		{
			key: 'emlCc',
			title: t('CC'),
			dataIndex: 'emlCc',
			width: 150,
			ellipsis: true,
		},
		{
			key: 'emlBcc',
			title: t('BCC'),
			dataIndex: 'emlBcc',
			width: 150,
			ellipsis: true,
		},
		{
			key: 'emlSubjVal',
			title: t('Subject'),
			dataIndex: 'emlSubjVal',
			width: 250,
			ellipsis: true,
			render: (value: string) => value || <i>{t('No Subject')}</i>,
		},
		{
			key: 'emlSndStsCd',
			title: t('Status'),
			dataIndex: 'emlSndStsCd',
			width: 100,
			align: 'center',
			sorter: true,
			render: (value: string) => {
				const colorMap: Record<string, string> = {
					SUCCESS: 'green',
					ERROR: 'red',
					PENDING: 'orange',
				};
				return <Tag color={colorMap[value] || 'default'}>{value}</Tag>;
			},
		},
		{
			key: 'emlSysMsg',
			title: t('Error Message'),
			dataIndex: 'emlSysMsg',
			width: 200,
			ellipsis: true,
		},
		{
			key: 'creUsrId',
			title: t('Created By'),
			dataIndex: 'creUsrId',
			width: 120,
		},
		{
			key: 'creDt',
			title: t('Sent Date'),
			dataIndex: 'creDt',
			width: 160,
			sorter: true,
			render: (value: string) => formatDate(value, true),
		},
		{
			key: 'actions',
			title: t('Actions'),
			width: 80,
			align: 'center',
			render: (_: unknown, record: EmailListDto) => (
				<Flex gap={4} justify="center">
					<Button
						type="link"
						size="small"
						icon={<EyeOutlined />}
						onClick={() => {
							setSelectedEmlId(record.emlId);
							toggleModal();
						}}
					/>
					{record.emlSndStsCd === 'ERROR' && (
						<ResendEmailButton emlId={record.emlId} />
					)}
				</Flex>
			),
		},
	];

	function handleSortChange(sortField: string | undefined, sortType: SORT | undefined) {
		setSort({
			sortField: convertToDBColumn(sortField as string),
			sortType,
		});
	}

	function handlePaginationChange(current: number, pageSize: number) {
		setPagination({ pageSize, current });
	}

	return (
		<Flex vertical>
			<CustomTable<EmailListDto>
				columns={columns}
				loading={isLoading}
				headerOffset={360}
				data={
					emailListResult?.emails?.map((item, index) => ({
						...item,
						key: index,
						procFlag: 'S',
					})) ?? []
				}
				tableState={{
					pagination: {
						...pagination,
						total: emailListResult?.total ?? 0,
					},
					rowSelection: selectedRows.map((item, index) => ({
						...item,
						key: index,
					})),
				}}
				onSelectChange={onSelectChange}
				onSortChange={handleSortChange}
				onPaginationChange={handlePaginationChange}
			/>

			{selectedEmlId && (
				<EmailDetailModal
					open={isModalOpen}
					emlId={selectedEmlId}
					onClose={() => {
						toggleModal();
						setSelectedEmlId(null);
					}}
				/>
			)}
		</Flex>
	);
};
