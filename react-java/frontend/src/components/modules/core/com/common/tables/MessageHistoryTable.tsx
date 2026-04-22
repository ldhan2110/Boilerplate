import type { ExceptionLogDto, SORT, TableColumn } from '@/types';
import CustomTable from '@/components/common/custom-table/CustomTable';
import { useGetMessageHistoryList } from '@/hooks/modules';
import { useAppTranslate } from '@/hooks';
import { authStore, useMessageHistoryStore } from '@/stores';
import { convertToDBColumn, formatDate } from '@/utils/helper';

export const MessageHistoryTable = () => {
	const { t } = useAppTranslate();
	// Zustands
	const searchCondition = useMessageHistoryStore((state) => state.search);
	const setSort = useMessageHistoryStore((state) => state.setSort);

	// Hooks
	const { data: messageList, fetchNextPage } = useGetMessageHistoryList({
		...searchCondition.filter,
		coId: authStore.user?.userInfo.coId,
		sort: searchCondition.sort,
		pagination: searchCondition.pagination,
	});

	const columns: TableColumn<ExceptionLogDto>[] = [
		{
			key: 'errMsg',
			title: t('Message'),
			dataIndex: 'errMsg',
			width: 200,
			sorter: true,
		},
		{
			key: 'endpoint',
			title: t('Endpoint'),
			dataIndex: 'endpoint',
			width: 150,
			sorter: true,
		},
		{
			key: 'mdlNm',
			title: t('Module'),
			dataIndex: 'mdlNm',
			width: 100,
			sorter: true,
		},
		{
			key: 'rqstPara',
			title: t('Parameters'),
			dataIndex: 'rqstPara',
			width: 250,
			sorter: true,
			render: (value) => <>{JSON.stringify(value)}</>,
		},
		{
			key: 'creUsrId',
			title: t('Created User'),
			dataIndex: 'creUsrId',
			width: 100,
			sorter: true,
		},
		{
			key: 'creDt',
			title: t('Created Date'),
			dataIndex: 'creDt',
			width: 150,
			sorter: true,
			render: (value) => formatDate(value, true),
		},
	];

	function handleScrollChange() {
		fetchNextPage();
	}

	function handleSortChange(sortField: string | undefined, sortType: SORT | undefined) {
		setSort({
			sortField: convertToDBColumn(sortField as string),
			sortType,
		});
	}

	return (
		<CustomTable<ExceptionLogDto>
			columns={columns}
			data={(messageList?.pages.flatMap((page) => page.messageList) ?? [])?.map((item, index) => ({
				...item,
				key: index,
				procFlag: 'S',
			}))}
			virtual
			headerOffset={450}
			tableState={{}}
			onScrollChange={handleScrollChange}
			onSortChange={handleSortChange}
			noFooter
		/>
	);
};
