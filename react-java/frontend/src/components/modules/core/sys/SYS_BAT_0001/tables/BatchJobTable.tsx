import { App, Button, Flex, Tag } from 'antd';

import type { BatchJobConfigDto, SORT, TableColumn, TableData } from '@/types';
import CustomTable from '@/components/common/custom-table/CustomTable';
import { ABILITY_ACTION, ABILITY_SUBJECT, MESSAGE_CODES } from '@/constants';
import { useAppTranslate, usePermission, useToggle } from '@/hooks';
import { useGetBatchJobList } from '@/hooks/modules';
import { authStore, useBatchJobStore } from '@/stores';
import { convertToDBColumn, formatDate } from '@/utils/helper';
import { AddBatchJobButton, PauseBatchJobButton, ResumeBatchJobButton, RunBatchJobButton } from '../buttons';
import { ViewBatchJobModal } from '../modals';

export const BatchJobTable = () => {
    const { t, m } = useAppTranslate();
    const { hasAbility } = usePermission();
    const { message } = App.useApp();
    const { isToggle, toggle } = useToggle(false);

    // Zustands
    const searchConditions = useBatchJobStore((state) => state.search);
    const rowSelection = useBatchJobStore((state) => state.rowSelection);
    const setSort = useBatchJobStore((state) => state.setSort);
    const setSelectedRowId = useBatchJobStore(state => state.setSelectedRowId);
    const setRowSelection = useBatchJobStore((state) => state.setRowSelection);

    // Hooks
    const { data: batchJobList, isLoading } = useGetBatchJobList({
        ...searchConditions.filter,
        coId: authStore.user?.userInfo.coId,
        sort: searchConditions.sort,
    });

    //=========================COLUMNS DEFINITIONS===============================
    const columns: TableColumn<BatchJobConfigDto>[] = [
        {
            key: 'batJbId',
            title: t('Batch Job ID'),
            dataIndex: 'batJbId',
            width: 150,
            sorter: true,
            render: (value) => (
                <Button
                    type="link"
                    onClick={() => {
                        const isPermit = hasAbility(
                            ABILITY_ACTION.VIEW_DETAIL,
                            ABILITY_SUBJECT.BATCH_JOB_MANAGEMENT,
                        );
                        if (isPermit) {
                            setSelectedRowId(value);
                            toggle();
                        } else message.warning(m(MESSAGE_CODES.COM000010));
                    }}
                >
                    {value}
                </Button>
            ),
        },
        {
            key: 'batJbNm',
            title: t('Batch Job Name'),
            dataIndex: 'batJbNm',
            width: 150,
            ellipsis: true,
            sorter: true,
        },
        {
            key: 'cronXprVal',
            title: t('Cron Expression'),
            dataIndex: 'cronXprVal',
            width: 150,
            ellipsis: true,
            sorter: true,
        },
        {
            key: 'cronDesc',
            title: t('Cron Description'),
            dataIndex: 'cronDesc',
            width: 150,
            ellipsis: true,
            sorter: true,
        },
        {
            key: 'batJbDesc',
            title: t('Description'),
            dataIndex: 'batJbDesc',
            width: 150,
            ellipsis: true,
            sorter: true,
        },
        {
            key: 'batJbStsCd',
            title: t('Running Status'),
            dataIndex: 'batJbStsCd',
            align: 'center',
            width: 120,
            sorter: true,
            render: (value: string) => {
                switch (value) {
                    case 'PLANNED':
                        return <Tag color="default">{t('PLANNED')}</Tag>
                    case 'PAUSED':
                        return <Tag color="warning">{t('PAUSED')}</Tag>
                    case 'RUNNING':
                        return <Tag color="processing">{t('RUNNING')}</Tag>
                    case 'STOPPED':
                        return <Tag color="error">{t('STOPPED')}</Tag>
                }
            }

        },
        {
            key: 'batJbLstRunDt',
            title: t('Last Run Date'),
            dataIndex: 'batJbLstRunDt',
            sorter: true,
            width: 130,
            render: (value) => formatDate(value, true),
        },
        {
            key: 'batJbNxtRunDt',
            title: t('Next Run Date'),
            dataIndex: 'batJbNxtRunDt',
            sorter: true,
            width: 130,
            render: (value) => formatDate(value, true),
        },
        {
            key: 'useFlg',
            title: t('Status'),
            dataIndex: 'useFlg',
            align: 'center',
            width: 100,
            sorter: true,
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

    function handleSelectChange(_seletedKey: React.Key[], selectedRows: TableData<BatchJobConfigDto>[]) {
        setRowSelection(selectedRows);
    }

    function handleSortChange(sortField: string | undefined, sortType: SORT | undefined) {
        setSort({
            sortField: convertToDBColumn(sortField as string),
            sortType,
        });
    }

    function handleRowClick(record: BatchJobConfigDto) {
        setSelectedRowId(record.batJbId!);
        setRowSelection([record as TableData<BatchJobConfigDto>]);
    }

    return (
        <>
            <Flex justify="end" gap={8}>
                <PauseBatchJobButton />
                <ResumeBatchJobButton />
                <RunBatchJobButton />
                <AddBatchJobButton />
            </Flex>
            <CustomTable<BatchJobConfigDto>
                columns={columns}
                headerOffset={390}
                data={
                    batchJobList?.map((item, index) => ({
                        ...item,
                        key: item.batJbId ?? String(index),
                        procFlag: 'S',
                    })) || []
                }
                loading={isLoading}
                rowSelectionType="radio"
                onSortChange={handleSortChange}
                onSelectChange={handleSelectChange}
                onRowClick={handleRowClick}
                tableState={{
                    rowSelection: rowSelection
                }}
            />

            <ViewBatchJobModal open={isToggle} onCancel={() => {
                toggle();
                setSelectedRowId('');
            }} />
        </>
    );
}