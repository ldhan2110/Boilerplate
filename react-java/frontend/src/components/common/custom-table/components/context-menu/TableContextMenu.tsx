/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dropdown, Form } from 'antd';
import { useAppTranslate, useAppMessage } from '@/hooks';
import {
	CopyOutlined,
	FileExcelOutlined,
	FullscreenOutlined,
	ReloadOutlined,
} from '@ant-design/icons';
import { useTableExportExcel, useClipboardCopy } from '../../hooks';
import type { TableColumn, TableData } from '@/types';
import type { FormInstance } from 'antd/lib';

type TableContextMenuProps<T> = {
	isOpen: boolean;
	position: {
		x: number;
		y: number;
	};
	record: { [key: string]: any } | null;
	selectedRows?: TableData<T>[];
	dataSource: TableData<T>[];
	columns: TableColumn<TableData<T>>[];
	exportFileName: string;
	isTree?: boolean;
	contextMenu?: {
		onRefresh?: (filterForm?: FormInstance) => void;
		onExport?: (dataSource: readonly TableData<T>[], columns: TableColumn<TableData<T>>[], summary: (data: readonly TableData<T>[]) => React.ReactNode | boolean) => void;
		onFullScreen?: (toggleFullScreen: () => void) => void;
	};
	summary: (data: readonly TableData<T>[]) => React.ReactNode | boolean;
	hideMenu: () => void;
	toggleFullScreen: () => void;
};

export const TableContextMenu = <T,>({
	isOpen,
	position,
	record,
	selectedRows,
	dataSource,
	columns,
	exportFileName,
	isTree,
	contextMenu,
	summary,
	hideMenu,
	toggleFullScreen,
}: TableContextMenuProps<T>) => {
	const { t } = useAppTranslate();
	const { message } = useAppMessage();
	const tableFilterForm = Form.useFormInstance();
	const hasSelectedRows = selectedRows && selectedRows.length > 0;
	const { exportToExcel } = useTableExportExcel(exportFileName);
	const { copyRowsToClipboard } = useClipboardCopy();

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
				items: [
					{ key: 'COPY_ROW', label: t('Copy Row'), icon: <CopyOutlined /> },
					{
						key: 'COPY_SELECTED',
						label: t('Copy Selected Rows'),
						icon: <CopyOutlined />,
						disabled: !hasSelectedRows,
					},
					{ type: 'divider' },
					{ key: 'RELOAD', label: t('Refresh'), icon: <ReloadOutlined /> },
					{ key: 'FULL_SCREEN', label: t('Full Screen'), icon: <FullscreenOutlined /> },
					{ key: 'EXPORT_EXCEL', label: t('Export Excel'), icon: <FileExcelOutlined /> },
				],
				onClick: async ({ key }) => {
					switch (key) {
						case 'COPY_ROW':
							if (record) {
								const currentRecord = dataSource.find((item) => item.key === record.key);
								await copyRowsToClipboard([currentRecord] as any[], columns as any[], { isTree });
								message.success(t('Row copied to clipboard'));
							}
							break;
						case 'COPY_SELECTED':
							if (hasSelectedRows) {
								const currentSelectedRecords = dataSource.filter((item) =>
									selectedRows.some((selectedItem) => selectedItem.key === item.key),
								);
								await copyRowsToClipboard(currentSelectedRecords as any[], columns as any[], { isTree });
								message.success(
									t('{{count}} row(s) copied to clipboard', { count: selectedRows.length }),
								);
							}
							break;
						case 'RELOAD':
							if (contextMenu?.onRefresh) {
								contextMenu.onRefresh(tableFilterForm);
							} else {
								tableFilterForm?.resetFields();
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
