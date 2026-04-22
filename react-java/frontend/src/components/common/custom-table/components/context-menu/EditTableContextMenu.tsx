/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dropdown, Form, type FormInstance } from 'antd';
import { useAppTranslate, useAppMessage, useShowMessage } from '@/hooks';
import {
	CopyOutlined,
	FileExcelOutlined,
	FullscreenOutlined,
	InsertRowAboveOutlined,
	InsertRowBelowOutlined,
	ReloadOutlined,
	DiffOutlined,
} from '@ant-design/icons';
import { useTableExportExcel, useClipboardCopy } from '../../hooks';
import type { EditTableHandler, TableColumn, TableData } from '@/types';
import { getRecordIndex } from '../../utils';

type EditTableContextMenuProps<T> = {
	isOpen: boolean;
	position: {
		x: number;
		y: number;
	};
	record: { [key: string]: any } | null;
	selectedRows?: TableData<T>[];
	dataSource: TableData<T>[];
	columns: TableColumn<TableData<T>>[];
	tableRef: React.RefObject<EditTableHandler<T>>;
	exportFileName: string;
	formTableName: string;
	contextMenu?: {
		onRefresh?: (formValue?: FormInstance) => void;
		onExport?: (
			dataSource: readonly TableData<T>[],
			columns: TableColumn<TableData<T>>[],
			summary: (data: readonly TableData<T>[]) => React.ReactNode | boolean,
		) => void;
		onFullScreen?: (toggleFullScreen: () => void) => void;
	};
	summary: (data: readonly TableData<T>[]) => React.ReactNode | boolean;
	hasUnsavedChanges: () => boolean;
	hideMenu: () => void;
	toggleFullScreen: () => void;
	editableActions?: boolean;
};

export const EditTableContextMenu = <T,>({
	isOpen,
	position,
	record,
	selectedRows,
	dataSource,
	columns,
	exportFileName,
	contextMenu,
	tableRef,
	formTableName,
	summary,
	hideMenu,
	hasUnsavedChanges,
	toggleFullScreen,
	editableActions = true,
}: EditTableContextMenuProps<T>) => {
	const { t } = useAppTranslate();
	const { message } = useAppMessage();
	const tableForm = Form.useFormInstance();
	const hasSelectedRows = selectedRows && selectedRows.length > 0;
	const { showUnsaveChangeMessage } = useShowMessage();
	const { exportToExcel } = useTableExportExcel(exportFileName);
	const { copyRowsToClipboard } = useClipboardCopy();

	function handleRefresh() {
		if (contextMenu?.onRefresh) {
			contextMenu.onRefresh(tableForm);
		} else {
			tableForm?.resetFields();
		}
	}

	const menuItems = [
		...(editableActions
			? [
					{ key: 'INSERT_ABOVE', label: t('Insert Above'), icon: <InsertRowAboveOutlined /> },
					{ key: 'INSERT_BELOW', label: t('Insert Below'), icon: <InsertRowBelowOutlined /> },
					{ type: 'divider' as const },
			  ]
			: []),
		{ key: 'COPY_ROW', label: t('Copy Row'), icon: <CopyOutlined /> },
		{
			key: 'COPY_SELECTED',
			label: t('Copy Selected Rows'),
			icon: <CopyOutlined />,
			disabled: !hasSelectedRows,
		},
		...(editableActions
			? [
					{ type: 'divider' as const },
					{
						key: 'DUPLICATE_ROW',
						label: hasSelectedRows ? t('Duplicate Selected Rows') : t('Duplicate Row'),
						icon: <DiffOutlined />,
					},
			  ]
			: []),
		{ type: 'divider' as const },
		{ key: 'RELOAD', label: t('Refresh'), icon: <ReloadOutlined /> },
		{ key: 'FULL_SCREEN', label: t('Full Screen'), icon: <FullscreenOutlined /> },
		{ key: 'EXPORT_EXCEL', label: t('Export Excel'), icon: <FileExcelOutlined /> },
	];

	return (
		<Dropdown
			open={isOpen}
			onOpenChange={(isOpen) => {
				// user clicked away, or dropdown closed by AntD
				if (!isOpen) {
					hideMenu();
				}
			}}
			menu={{
				items: menuItems,
				onClick: async ({ key }) => {
					switch (key) {
						case 'INSERT_ABOVE':
							tableRef.current?.insertAbove({}, getRecordIndex((record as any).key, tableForm, formTableName));
							break;
						case 'INSERT_BELOW':
							tableRef.current?.insertBelow({}, getRecordIndex((record as any).key, tableForm, formTableName));
							break;
						case 'COPY_ROW':
							if (record) {
								const currentRecord = dataSource.find((item) => item.key === record.key);
								await copyRowsToClipboard([currentRecord] as any[], columns as any[]);
								message.success(t('Row copied to clipboard'));
							}
							break;
						case 'COPY_SELECTED':
							if (hasSelectedRows) {
								const currentSelectedRecords = dataSource.filter((item) => selectedRows.some((selectedItem) => selectedItem.key === item.key));
								await copyRowsToClipboard(currentSelectedRecords as any[], columns as any[]);
								message.success(
									t('{{count}} row(s) copied to clipboard', { count: selectedRows.length }),
								);
							}
							break;
						case 'DUPLICATE_ROW':
							if (hasSelectedRows) {
								const rowsToDuplicate = dataSource.filter((item) =>
									selectedRows.some((selectedItem) => selectedItem.key === item.key)
								);
								tableRef.current?.duplicateRow(rowsToDuplicate as any[]);
								message.success(
									t('{{count}} row(s) duplicated', { count: rowsToDuplicate.length }),
								);
							} else if (record) {
								const currentRecord = dataSource.find((item) => item.key === record.key);
								if (currentRecord) {
									tableRef.current?.duplicateRow([currentRecord] as any[]);
									message.success(t('Row duplicated'));
								}
							}
							break;
						case 'RELOAD':
							
							if (hasUnsavedChanges()) {
								showUnsaveChangeMessage(handleRefresh);
							} else {
								handleRefresh();
							}
							break;
						case 'FULL_SCREEN':
							if (contextMenu?.onFullScreen) {
								contextMenu.onFullScreen(toggleFullScreen);
							} else {
								toggleFullScreen();
							}
							break;
						case 'EXPORT_EXCEL':
							if (contextMenu?.onExport) {
								contextMenu.onExport(dataSource, columns, summary);
							} else {
								exportToExcel(dataSource, columns, summary);
							}
							break;
						default:
							break;
					}
					hideMenu();
				},
			}}
			trigger={['contextMenu']}
			placement="bottomLeft"
		>
			<div
				style={{
					position: 'fixed',
					top: position.y,
					left: position.x,
					width: 1,
					height: 1,
					zIndex: 9999,
				}}
			/>
		</Dropdown>
	);
};
