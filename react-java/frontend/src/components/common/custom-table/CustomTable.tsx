/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
	ConfigProvider,
	Empty,
	Form,
	Table,
	type CheckboxProps,
	type FormInstance,
	type TableProps,
} from 'antd';
import styled from 'styled-components';
import { isEmpty, some } from 'lodash';

import {
	AGGERATE_TYPE,
	SORT,
	TABLE_ACTIONS,
	type CrossPageSelectionConfig,
	type DynamicFilterDto,
	type MultiSort,
	type Pagination,
	type TableColumn,
	type TableData,
	type TableExtra,
	type TableFilter,
	type TableSort,
	type TableState,
} from '@/types';
import { useAppTranslate } from '@/hooks';
import { DEFAULT_PAGE_OPTIONS, DEFAULT_TABLE_STATE } from '@/constants/table';
import { formatNumberAmount } from '@/utils/helper';
import { useTableHooks, useTableNavigation, useCrossPageSelection } from './hooks';
import { CellTooltipWrapper, ContextHeaderMenu, DragDropTableContextProvider, TableContextMenu, SelectionBanner } from './components';
import { TableHeader } from './components/TableHeader';
import { aggregate } from './utils/aggerate';
import styles from './CustomTable.module.scss';
import { adjustColumnWidths, sumLeafWidths } from './utils';

export type CustomTableProps<T> = {
	columns: TableColumn<T>[];
	data: TableData<T>[];
	tableFilterForm?: FormInstance;
	tableState: TableState<T>;
	headerOffset?: number;
	loading?: boolean;
	autoPagination?: boolean;
	noFooter?: boolean;
	scroll?: { x?: number | true | 'max-content' | 'min-content'; y?: number } | false;
	isTree?: boolean;
	isSelectStrict?: boolean;
	virtual?: boolean;
	rowSelectionType?: 'radio' | 'checkbox';
	exportFileName?: string;
	sortMode?: 'local' | 'remote';
	contextMenu?: {
		onRefresh?: (filterForm?: FormInstance) => void;
		onExport?: (
			dataSource: readonly TableData<T>[],
			columns: TableColumn<TableData<T>>[],
			summary: (data: readonly TableData<T>[]) => React.ReactNode | boolean,
		) => void;
		onFullScreen?: (toggleFullScreen: () => void) => void;
	};
	onScrollChange?: (event: React.UIEvent<HTMLDivElement, UIEvent>) => void;
	onSelectChange?: (selectedRowKeys: React.Key[], selectedRows: TableData<T>[]) => void;
	onPaginationChange?: (current: number, pageSize: number) => void;
	onSortChange?: (sortField: string | undefined, sortType: SORT | undefined) => void;
	onRowClick?: (record: TableData<T>, rowIndex: number) => void;
	onRowDoubleClick?: (record: TableData<T>, rowIndex: number) => void;
	onFilterTableChange?: (filterValue: DynamicFilterDto[]) => void;
	getCheckboxProps?: (record: T) => Partial<Omit<CheckboxProps, 'checked' | 'defaultChecked'>>;
	/** Optional custom row props (style, className, etc.) merged with default row handlers */
	onRow?: (record: T, rowIndex?: number) => Record<string, unknown>;
	getRowStyle?: (record: TableData<T>, rowIndex: number) => React.CSSProperties;
	expandable?: TableProps<TableData<T>>['expandable'];
	/** Optional cross-page selection config. When enabled, selection persists across pagination. */
	crossPageSelection?: CrossPageSelectionConfig;
	/** When provided, enables multi-column sort. Receives ordered array of sorts. */
	onMultiSortChange?: (sorts: MultiSort) => void;
};

const CustomTable = <T,>({
	columns,
	data,
	tableFilterForm,
	tableState = DEFAULT_TABLE_STATE,
	loading = false,
	autoPagination = false,
	headerOffset = 290,
	noFooter = false,
	scroll,
	isTree,
	isSelectStrict,
	virtual,
	rowSelectionType = 'checkbox',
	exportFileName,
	sortMode = 'remote',
	contextMenu,
	onSelectChange,
	onPaginationChange,
	onSortChange,
	onRowClick,
	onFilterTableChange,
	onScrollChange,
	onRowDoubleClick,
	getRowStyle,
	getCheckboxProps,
	onRow: customOnRow,
	expandable,
	crossPageSelection,
	onMultiSortChange,
}: CustomTableProps<T>) => {
	const { pagination, rowSelection, sort: tableStateSort } = tableState;
	const currentPage = pagination?.current ?? 1;
	const currentPageSize = pagination?.pageSize ?? 15;
	const pageStartIndex = (currentPage - 1) * currentPageSize;

	const {
		t,
		tableHeight,
		mappedColumns,
		columnsWithSort,
		expandedKeys,
		menuPosition,
		isOpenMenu,
		selectedMenuRecord,
		isOpenHeaderMenu,
		headerMenuPosition,
		selectedHeaderColumn,
		containerRef,
		isFullscreen,
		sort,
		multiSorts,
		sortedData,
		showAdvanceFilter,
		hasFilterableColumns,
		setTableColumn,
		setExpandedKeys,
		handleFilterFormChange,
		handleAdvanceFilterToggle,
		showMenu,
		hideMenu,
		hideHeaderMenu,
		toggleFullscreen,
		handleSortChange,
		handleTableSort,
		handleRemoveSort,
		handleClearAllSorts,
		handleColumnReorder,
		handleResetToDefault,
		handleColumnVisibilityChange,
		handleFreezeChange,
	} = useTableHooks<T>(
		columns,
		data,
		headerOffset,
		isTree,
		tableStateSort,
		onFilterTableChange,
		onSortChange,
		sortMode,
		onMultiSortChange,
	);

	const { lang } = useAppTranslate();

	const SELECTION_COLUMN_WIDTH = 50;

	const { columnsWithAdjustedWidth, adjustedTableWidth } = React.useMemo(() => {
		const adjusted = adjustColumnWidths(columnsWithSort, t);
		const leafWidth = sumLeafWidths(adjusted);
		return {
			columnsWithAdjustedWidth: adjusted,
			adjustedTableWidth: rowSelection ? leafWidth + SELECTION_COLUMN_WIDTH : leafWidth,
		};
	}, [columnsWithSort, t, lang, rowSelection]);

	// Data source used for display (sorted or raw)
	const displayData = React.useMemo(
		() => (sortMode === 'local' ? sortedData : data),
		[sortMode, sortedData, data],
	);
	const normalizedDisplayData = React.useMemo(
		() =>
			displayData.map((item, index) => ({
				...item,
				key: item.key ?? index,
			})),
		[displayData],
	);

	// Cross-page selection hook
	const crossPage = useCrossPageSelection(
		crossPageSelection,
		normalizedDisplayData,
		pagination?.total,
	);

	// --- Tree numbering: inject _treeNo and _isTreeParent for isTree mode ---
	const parentCountByPageRef = React.useRef<Map<number, number>>(new Map());

	React.useEffect(() => {
		if (!isTree) return;
		if (currentPage === 1) {
			parentCountByPageRef.current.clear();
		}
		parentCountByPageRef.current.set(currentPage, normalizedDisplayData.length);
	}, [isTree, currentPage, normalizedDisplayData.length]);

	const treeNumberedData = React.useMemo(() => {
		if (!isTree) return normalizedDisplayData;

		let parentOffset = 0;
		if (pagination && !autoPagination) {
			for (let p = 1; p < currentPage; p++) {
				const count = parentCountByPageRef.current.get(p);
				parentOffset += count ?? currentPageSize;
			}
		}

		return normalizedDisplayData.map((item, index) => {
			const parentNo = parentOffset + index + 1;
			const children = (item as any)?.children as TableData<T>[] | undefined;
			const numbered: TableData<T> = { ...item, _treeNo: parentNo, _isTreeParent: true };

			if (Array.isArray(children) && children.length > 0) {
				(numbered as any).children = children.map((child: TableData<T>, childIdx: number) => ({
					...child,
					_treeNo: childIdx + 1,
					_isTreeParent: false,
				}));
			}

			return numbered;
		});
	}, [isTree, normalizedDisplayData, currentPage, currentPageSize, pagination, autoPagination]);

	// When `isTree` is enabled, AntD's `rowIndex` provided to column `render(...)` is not stable
	// across parent/child rows. We build a map from `record.key` -> visible order index instead.
	const treeFlatIndexMap = React.useMemo(() => {
		if (!isTree) return undefined;

		const expandedKeySet = new Set(expandedKeys.map((k) => String(k)));
		const map = new Map<string, number>();
		let idx = 0;

		const walk = (nodes: TableData<T>[]) => {
			nodes.forEach((node) => {
				const key = (node as any)?.key != null ? String((node as any).key) : '';
				if (key) {
					map.set(key, idx);
				}
				idx += 1;

				const children = (node as any)?.children as TableData<T>[] | undefined;
				const hasChildren = Array.isArray(children) && children.length > 0;
				if (hasChildren && key && expandedKeySet.has(key)) {
					walk(children);
				}
			});
		};

		walk((isTree ? treeNumberedData : displayData) as TableData<T>[]);
		return map;
	}, [isTree, expandedKeys, treeNumberedData, displayData]);

	// Keyboard navigation for read-only cells
	const { setFocusedCell, handleCellKeyDown } = useTableNavigation(mappedColumns, displayData);

	// Wrap column renders with navigation-aware divs
	const columnsWithNavigation = React.useMemo(() => {
		const wrapColumns = (cols: TableColumn<TableData<T>>[]): TableColumn<TableData<T>>[] =>
			cols.map((col) => {
				if (col.children?.length) {
					return { ...col, children: wrapColumns(col.children as TableColumn<TableData<T>>[]) };
				}
				if (col.dataIndex === undefined) return col;

				const originalRender = col.render;
				const dataIndex = String(col.dataIndex);
				const colTooltip = col.tooltip;

				return {
					...col,
					render: (text: any, record: TableData<T>, rowIndex: number) => {
						const recordKey = record?.key != null ? String(record.key) : '';
						const treeIndex = recordKey ? treeFlatIndexMap?.get(recordKey) : undefined;
						// For tree tables, pass 0-based flat index (no page offset) so consumers
						// can apply their own numbering logic per parent/child.
						const globalRowIndex = isTree
							? (treeIndex ?? Number(rowIndex))
							: pageStartIndex + Number(rowIndex);
						const cellKey = `${globalRowIndex}-${dataIndex}`;
						const content = originalRender
							? originalRender(text, record, globalRowIndex)
							: text;
						const hasTooltip = !!colTooltip;
						const cellSpan = (
							<span
								style={{
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
									width: '100%',
								}}
								title={hasTooltip ? undefined : (text != null ? String(text) : '')}
							>
								{content}
							</span>
						);
						const wrappedCell = hasTooltip ? (
							<CellTooltipWrapper tooltip={colTooltip} value={text} record={record}>
								{cellSpan}
							</CellTooltipWrapper>
						) : cellSpan;

						return isTree ? (
							<>{wrappedCell}</>
						) : (
							<div
								data-cell-key={cellKey}
								tabIndex={0}
								onKeyDown={(e) => handleCellKeyDown(cellKey, e)}
								onClick={(e) => {
									e.stopPropagation();
									setFocusedCell(cellKey);
								}}
								onMouseDown={(e) => e.stopPropagation()}
								style={{
									display: 'flex',
									alignItems: 'center',
									minHeight: '24px',
									padding: '2px 8px',
									width: '100%',
									cursor: 'default',
									outline: 'none',
								}}
							>
								{wrappedCell}
							</div>
						);
					},
				};
			});
		return wrapColumns(columnsWithAdjustedWidth as TableColumn<TableData<T>>[]);
	}, [columnsWithAdjustedWidth, handleCellKeyDown, pageStartIndex, setFocusedCell]);

	// Pagination Options
	const paginationOptions = React.useMemo(() => {
		if (pagination) {
			return {
				...DEFAULT_PAGE_OPTIONS,
				...pagination,
			};
		} else if (autoPagination) {
			return {
				...DEFAULT_PAGE_OPTIONS,
			};
		}
		return false;
	}, [pagination, autoPagination]);

	// Compute cross-page selected keys for current page directly (avoids stale callback)
	const crossPageSelectedKeys = React.useMemo(() => {
		if (!crossPage.hasSelection) return [];
		return normalizedDisplayData
			.filter((row) => crossPage.isRowSelected(row.key))
			.map((row) => row.key);
	}, [crossPage.hasSelection, crossPage.version, normalizedDisplayData]);

	// Row Selection Options
	const rowSelectionOptions = React.useMemo(() => {
		if (rowSelection) {
			const isCrossPageEnabled = crossPageSelection?.enabled ?? false;
			const selectedRowKeys = crossPage.hasSelection
				? crossPageSelectedKeys
				: rowSelection.map((item) => String(item.key));

			return {
				selectedRowKeys,
				onChange: (selectedKeys: React.Key[], selectedRows: TableData<T>[]) => {
					if (crossPage.isAllSelected) {
						// antd fires onChange with empty keys during pagination (dataSource reconciliation).
						// When cross-page is active, ignore these spurious clears — selection is managed by us.
						const isSpuriousClear = selectedKeys.length === 0 && crossPageSelectedKeys.length > 0;
						if (isSpuriousClear) return;

						// Diff against previous state to find toggled keys
						const prevSelectedSet = new Set(crossPageSelectedKeys);
						const newSelectedSet = new Set(selectedKeys);

						for (const row of normalizedDisplayData) {
							const wasSelected = prevSelectedSet.has(row.key);
							const isNowSelected = newSelectedSet.has(row.key);
							if (wasSelected !== isNowSelected) {
								crossPage.toggleRow(row.key);
							}
						}
						// Forward the cross-page aware selection to consumer
						onSelectChange?.(selectedKeys, selectedRows);
						return;
					}
					// When cross-page is enabled but not in select-all mode,
					// track individual selections so they persist across pages
					if (isCrossPageEnabled) {
						crossPage.syncSelection(selectedKeys, normalizedDisplayData);
					}
					onSelectChange?.(selectedKeys, selectedRows);
				},
				// When cross-page is enabled, add dropdown options next to the header checkbox
				// for "Select All Data" (cross-page) and "Clear All".
				// Also handle header checkbox uncheck to clear cross-page select-all state,
				// since the onChange spurious-clear guard would otherwise block it.
				...(isCrossPageEnabled && {
					selections: [
						{
							key: 'select-all-data',
							text: t('Select All Data'),
							onSelect: () => crossPage.handleSelectAll(),
						},
						{
							key: 'clear-all',
							text: t('Clear All'),
							onSelect: () => {
								crossPage.handleClear();
								onSelectChange?.([], []);
							},
						},
					],
					onSelectAll: (checked: boolean) => {
						if (!checked && crossPage.isAllSelected) {
							crossPage.handleClear();
							onSelectChange?.([], []);
						}
					},
				}),
				getCheckboxProps: getCheckboxProps,
				checkStrictly: isSelectStrict,
				type: rowSelectionType,
			};
		}
		return undefined;
	}, [
		rowSelection,
		onSelectChange,
		isSelectStrict,
		getCheckboxProps,
		crossPage.isAllSelected,
		crossPage.hasSelection,
		crossPage.version,
		crossPageSelectedKeys,
		normalizedDisplayData,
		crossPageSelection?.enabled,
	]);

	// Render Summary Footer
	const renderSummary = React.useCallback(
		(data: readonly TableData<T>[]): React.ReactNode | boolean => {
			// Flatten columns (accounting for children)
			const flatCols = mappedColumns.flatMap((col) =>
				col.children && col.children.length > 0 ? col.children : [col],
			);

			if (rowSelection) {
				flatCols.unshift({ dataIndex: 'checkbox' });
			}

			if (!some(flatCols, 'summary')) return false;

			return (
				<Table.Summary fixed>
					<Table.Summary.Row>
						{flatCols.map(({ valueType, summary, align, dataIndex }, i) => {
							let content;
							if (typeof summary === 'function') content = summary();
							else if (isEmpty(summary)) content = <></>;
							else if (Object.values(AGGERATE_TYPE).includes(summary!)) {
								content = aggregate(data as T[], dataIndex as any, summary as AGGERATE_TYPE);
								if (valueType === 'amount' && typeof content === 'number') {
									content = formatNumberAmount(content);
								}
							}
							return (
								<Table.Summary.Cell key={i} index={i} align={align}>
									{content}
								</Table.Summary.Cell>
							);
						})}
					</Table.Summary.Row>
				</Table.Summary>
			);
		},
		[mappedColumns, rowSelection],
	);

	// On-Change Handler
	const onTableChange = (
		pagination: Pagination,
		_filter: TableFilter,
		sorter: TableSort | TableSort[],
		extra: TableExtra<T>,
	) => {
		switch (extra.action) {
			case TABLE_ACTIONS.PAGINATE:
				if (!autoPagination) {
					onPaginationChange?.(pagination.current, pagination.pageSize);
				}
				// Only clear per-page selection if cross-page is NOT active
				if (!crossPage.hasSelection) {
					onSelectChange?.([], []);
				}
				break;
			case TABLE_ACTIONS.SORT:
				handleTableSort(sorter);
				if (!crossPage.hasSelection) {
					onSelectChange?.([], []);
				}
				break;
			case TABLE_ACTIONS.FILTER:
				break;
		}
	};

	// Handle scroll to load more
	const handleScroll = React.useCallback(
		(e: React.UIEvent<HTMLDivElement>) => {
			const threshold = 10; // pixels from bottom
			const target = e.currentTarget;
			const bottom = target.scrollHeight - target.scrollTop - target.clientHeight < threshold;
			if (bottom) {
				onScrollChange?.(e);
			}
		},
		[loading],
	);

	// Render Table
	return (
		<ConfigProvider
			renderEmpty={() => <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No Data')} />}
		>
			<WrapperTable ref={containerRef} style={{ padding: isFullscreen ? 32 : 0 }}>
				<Form form={tableFilterForm} onValuesChange={handleFilterFormChange}>
					<DragDropTableContextProvider columns={mappedColumns} setColumns={setTableColumn}>
						{crossPageSelection?.enabled && rowSelection && (
							<SelectionBanner
								isAllSelected={crossPage.isAllSelected}
								totalCount={crossPage.isAllSelected ? crossPage.totalCount : (pagination?.total ?? 0)}
								effectiveCount={crossPage.effectiveCount}
								hasSelection={crossPage.hasSelection}
								onClear={() => {
									crossPage.handleClear();
									onSelectChange?.([], []);
								}}
							/>
						)}
						<Table<TableData<T>>
							bordered
							size="small"
							loading={loading}
							virtual={virtual}
							className={styles.tableCustom}
							columns={columnsWithNavigation as any}
							dataSource={isTree ? treeNumberedData : normalizedDisplayData}
							rowKey={(record, index) => String(record.key ?? index)}
							rowSelection={rowSelectionOptions}
							scroll={
								scroll === false
									? undefined
									: {
											...(typeof scroll === 'object' && scroll ? scroll : {}),
											x: adjustedTableWidth,
											y: tableHeight,
										}
							}
							style={{
								paddingBottom: noFooter ? 0 : !paginationOptions || data.length == 0 ? 45 : 0,
								whiteSpace: 'pre',
							}}
							pagination={paginationOptions}
							components={{
								header: {
									cell: TableHeader,
								},
							}}
							onChange={onTableChange as any}
							summary={renderSummary}
							expandable={{
								expandedRowKeys: expandedKeys,
								onExpandedRowsChange: setExpandedKeys as any,
								...expandable,
							}}
							onRow={(record, rowIndex) => {
								const defaultRow = {
									style: getRowStyle?.(record, rowIndex!),
									onClick: () => {
										onRowClick?.(record, rowIndex!);
									},
									onDoubleClick: () => {
										onRowDoubleClick?.(record, rowIndex!);
									},
									onContextMenu: (e: React.MouseEvent) => {
										showMenu(e, record);
									},
								};
								const customRow = customOnRow?.(record, rowIndex ?? 0);
								return customRow ? { ...defaultRow, ...customRow } : defaultRow;
							}}
							onScroll={handleScroll}
						/>
						{noFooter ? (
							<></>
						) : (
							<CountItems
								style={{
									position: isFullscreen ? 'relative' : 'absolute',
									float: isFullscreen ? 'right' : 'none',
									bottom: isFullscreen ? 40 : data.length == 0 ? 12 : paginationOptions ? 18 : 12,
								}}
							>
								{t('Total')}: {pagination?.total || data.length || 0} {t('item(s)')}
							</CountItems>
						)}
					</DragDropTableContextProvider>

					<TableContextMenu
						isOpen={isOpenMenu}
						toggleFullScreen={toggleFullscreen}
						position={menuPosition}
						hideMenu={hideMenu}
						record={selectedMenuRecord}
						selectedRows={rowSelection}
						dataSource={isTree ? treeNumberedData : normalizedDisplayData}
						columns={mappedColumns}
						summary={renderSummary}
						exportFileName={exportFileName || 'data'}
						isTree={isTree}
						contextMenu={contextMenu}
					/>

					<ContextHeaderMenu
						isOpen={isOpenHeaderMenu}
						position={headerMenuPosition}
						column={selectedHeaderColumn}
						columns={mappedColumns}
						allColumns={columns}
						onColumnVisibilityChange={handleColumnVisibilityChange}
						onSortChange={handleSortChange}
						onFreezeChange={handleFreezeChange}
						onColumnReorder={handleColumnReorder}
						onResetToDefault={handleResetToDefault}
						currentSort={sort}
						currentSorts={multiSorts}
						onRemoveSort={handleRemoveSort}
						onClearAllSorts={handleClearAllSorts}
						showAdvanceFilter={showAdvanceFilter}
						onAdvanceFilterToggle={handleAdvanceFilterToggle}
						hasFilterableColumns={hasFilterableColumns}
						hideMenu={hideHeaderMenu}
					/>
				</Form>
			</WrapperTable>
		</ConfigProvider>
	);
};

const WrapperTable = styled.div`
	position: relative;
	background: var(--ant-table-header-bg);
`;

const CountItems = styled.p`
	position: absolute;
	right: 20px;
	font-weight: 500;
	font-size: 12px;
	line-height: 22px;
	color: var(--ant-color-text-secondary); /* softer text */
`;

export default CustomTable;
