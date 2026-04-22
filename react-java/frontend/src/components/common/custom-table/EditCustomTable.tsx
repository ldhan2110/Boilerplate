/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
	ConfigProvider,
	Empty,
	Form,
	Table,
	type CheckboxProps,
	type FormListFieldData,
} from 'antd';
import type { FormInstance } from 'antd/lib';
import { isEmpty, some } from 'lodash';

import {
	SORT,
	TABLE_ACTIONS,
	type DynamicFilterDto,
	type EditTableHandler,
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
import { DEFAULT_PAGE_OPTIONS, DEFAULT_PAGE_SIZE, DEFAULT_TABLE_STATE } from '@/constants/table';
import {
	DragDropTableContextProvider,
	EditableCell,
	EditTableContextMenu,
	TableHeader,
	ContextHeaderMenu,
} from './components';
import { useEditTableHooks } from './hooks';
import styled from 'styled-components';
import styles from './CustomTable.module.scss';
import ColumnHeader from './components/ColumnHeader';
import { useShowMessage } from '@/hooks';
import { adjustColumnWidths, getRecordIndex, getTableNestedValue, sumLeafWidths } from './utils';

// ─── Filter Form Context ──────────────────────────────────────────────────────
// Defined at module level so FilterFormHeaderWrapper is a stable reference.
// Ant Design Table compares components.header.wrapper by reference; an inline
// component (even from useCallback) can change each render and force React to
// unmount/remount the entire <thead>, which resets filter inputs and tears down
// the Form context mid-flight. Using a module-level component with a context
// avoids this entirely.
type FilterFormContextValue = {
	form: FormInstance | null;
	onValuesChange?: (changedValues: any, allValues: any) => void;
};
const FilterFormContext = React.createContext<FilterFormContextValue>({ form: null });

const FilterFormHeaderWrapper = ({
	children,
	...rest
}: React.HTMLAttributes<HTMLTableSectionElement>) => {
	const { form, onValuesChange } = React.useContext(FilterFormContext);
	if (!form) return <thead {...rest}>{children}</thead>;
	return (
		<Form form={form} component={false} onValuesChange={onValuesChange}>
			<thead {...rest}>{children}</thead>
		</Form>
	);
};

export type EditCustomTableProps<T> = {
	form: FormInstance;
	formTableName: string;
	columns: TableColumn<T>[];
	data: TableData<T>[];
	tableState: TableState<T>;
	scrollY?: number;
	headerOffset?: number;
	loading?: boolean;
	autoPagination?: boolean;
	noFooter?: boolean;
	exportFileName?: string;
	sortMode?: 'local' | 'remote';
	virtual?: boolean;
	contextMenu?: {
		onRefresh?: (filterForm?: FormInstance) => void;
		onExport?: (
			dataSource: readonly TableData<T>[],
			columns: TableColumn<TableData<T>>[],
			summary: (data: readonly TableData<T>[]) => React.ReactNode | boolean,
		) => void;
		onFullScreen?: (toggleFullScreen: () => void) => void;
		editableActions?: boolean;
	};
	onSelectChange?: (selectedRowKeys: React.Key[], selectedRows: TableData<T>[]) => void;
	onPaginationChange?: (current: number, pageSize: number) => void;
	onSortChange?: (sortField: string | undefined, sortType: SORT | undefined) => void;
	onTableDataChange?: (changedRow: TableData<T>) => void;
	onFilterTableChange?: (filterValue: DynamicFilterDto[]) => void;
	tableFilterForm?: FormInstance;
	onRow?: (record: TableData<T>, rowIndex: number) => Record<string, unknown>;
	onRowClick?: (record: TableData<T>, rowIndex: number) => void;
	onRowDoubleClick?: (record: TableData<T>, rowIndex: number) => void;
	getCheckboxProps?: (record: {
		key: number;
		index: number;
	}) => Partial<Omit<CheckboxProps, 'checked' | 'defaultChecked'>>;
	/** When provided, enables multi-column sort. Receives ordered array of sorts. */
	onMultiSortChange?: (sorts: MultiSort) => void;
};

const EditCustomTable = <T,>(
	{
		form,
		formTableName,
		columns,
		data,
		tableState = DEFAULT_TABLE_STATE,
		loading = false,
		autoPagination = false,
		scrollY,
		headerOffset = 290,
		noFooter = false,
		exportFileName,
		sortMode = 'remote',
		contextMenu,
		virtual = false,
		onSelectChange,
		onPaginationChange,
		onSortChange,
		onTableDataChange,
		onFilterTableChange,
		tableFilterForm,
		onRow: customOnRow,
		onRowClick,
		onRowDoubleClick,
		getCheckboxProps,
		onMultiSortChange,
	}: EditCustomTableProps<T>,
	ref: React.ForwardedRef<EditTableHandler<T>>,
) => {
	// ========== ⚙️ Table Options ==========
	const {
		t,
		mappedColumns,
		columnsWithSort,
		tableHeight,
		addRowRef,
		removeRowRef,
		fieldsRef,
		tableRef,
		deletedRows,
		isOpenMenu,
		menuPosition,
		selectedMenuRecord,
		isOpenHeaderMenu,
		headerMenuPosition,
		selectedHeaderColumn,
		activeEditingCell,
		pasteVersion,
		containerRef,
		isFullscreen,
		sort,
		multiSorts,
		rowsWithErrors,
		errorRowsVersion,
		showMenu,
		hideMenu,
		hideHeaderMenu,
		setTableColumn,
		generateKey,
		scrollToRow,
		renderSummary,
		setActiveEditingCell,
		handleCellKeyDown,
		setFocusedCell,
		dataFieldSourceRef,
		hasUnsavedChanges,
		handleSortChangeWithCheck,
		handleTableSort,
		handleRemoveSort,
		handleClearAllSorts,
		handleColumnReorder,
		handleResetToDefault,
		handleColumnVisibilityChange,
		handleFreezeChange,
		toggleFullscreen,
		validateAllFields,
		showAdvanceFilter,
		handleAdvanceFilterToggle,
		hasFilterableColumns,
		handleFilterFormChange,
		filterFormInstance,
	} = useEditTableHooks<T>(
		columns,
		data,
		form,
		formTableName,
		headerOffset,
		tableState,
		tableState.sort,
		onSortChange,
		sortMode,
		onFilterTableChange,
		tableFilterForm,
		onMultiSortChange,
	);
	const { pagination, rowSelection } = tableState;
	const { showUnsaveChangeMessage } = useShowMessage();
	const { lang } = useAppTranslate();

	// ========== 🔍 Filter Form Context Value ==========
	// Memoised so the context only updates when the instances actually change,
	// not on every parent render.
	const filterFormContextValue = React.useMemo<FilterFormContextValue>(
		() => ({ form: filterFormInstance, onValuesChange: handleFilterFormChange }),
		[filterFormInstance, handleFilterFormChange],
	);

	const { columnsWithAdjustedWidth, adjustedTableWidth } = React.useMemo(() => {
		const adjusted = adjustColumnWidths(columnsWithSort, t);
		return {
			columnsWithAdjustedWidth: adjusted,
			adjustedTableWidth: sumLeafWidths(adjusted),
		};
	}, [columnsWithSort, t, lang]);

	const finalTableHeight = scrollY ?? tableHeight;

	// ========== 🧩 Table Exposed Methods ==========
	React.useImperativeHandle(ref, () => ({
		insertAbove: (row?: Partial<TableData<T>>, index?: number) => {
			const newRow = {
				...row,
				key: generateKey(),
				procFlag: 'I',
			} as TableData<T>;
			if (index !== null && index !== undefined) {
				addRowRef.current?.(newRow, index);
				scrollToRow(index);
			} else {
				addRowRef.current?.(newRow, 0);
				scrollToRow();
			}
		},
		insertBelow: (row?: Partial<TableData<T>>, index?: number) => {
			const newRow = {
				...row,
				key: generateKey(),
				procFlag: 'I',
			} as TableData<T>;
			if (index !== null && index !== undefined) {
				addRowRef.current?.(newRow, index + 1);
				scrollToRow(index + 1);
			} else {
				addRowRef.current?.(newRow);
				scrollToRow();
			}
		},

		onAddRow: (row?: Partial<TableData<T>>, index?: number) => {
			const newRow = {
				...row,
				key: generateKey(),
				procFlag: 'I',
			} as TableData<T>;
			if (index) {
				addRowRef.current?.(newRow, index);
				scrollToRow(index);
			} else {
				addRowRef.current?.(newRow);
				scrollToRow();
			}
		},
		onRemoveRow: (key: number | number[]) => {
			if (isEmpty(key)) return;
			if (key instanceof Array) {
				const listRowIndex = key
					.map((k) => fieldsRef.current.findIndex((item) => String(item.key) === String(k)))
					.filter((index) => index !== -1);

				// Filter the rows that is deleted.
				const deletedRowsForm = (form.getFieldValue(formTableName) as Array<TableData<T>>)
					.filter((item, index) => item.procFlag != 'I' && listRowIndex.includes(index))
					.map((item) => ({ ...item, procFlag: 'D' }));
				deletedRows.current = deletedRows.current.concat(deletedRowsForm as TableData<T>[]);

				// Remove the rows
				removeRowRef.current?.(listRowIndex);
			} else {
				const rowIndex = fieldsRef.current.findIndex((item) => String(item.key) === String(key));

				// Filter the rows that is deleted.
				const deletedRowsForm = (form.getFieldValue(formTableName) as Array<TableData<T>>)
					.filter((item, index) => item.procFlag != 'I' && rowIndex == index)
					.map((item) => ({ ...item, procFlag: 'D' }));
				deletedRows.current = deletedRows.current.concat(deletedRowsForm as TableData<T>[]);

				// Remove the rows
				removeRowRef.current?.(rowIndex);
			}
		},
		getDeletedRows: () => {
			return deletedRows.current;
		},
		resetDeletedRows: () => {
			deletedRows.current = [];
		},
		duplicateRow: (rows: TableData<T>[]) => {
			if (isEmpty(rows)) return;
			rows.forEach((row) => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { key: oldKey, procFlag, ...rowData } = row;
				const newRow = {
					...rowData,
					key: generateKey(),
					procFlag: 'I',
				} as TableData<T>;
				addRowRef.current?.(newRow, getRecordIndex(Number(oldKey), form, formTableName));
			});
		},
		validateAllFields: async () => {
			await validateAllFields();
		},
	}));

	// ========== 🔧 Table Utility Functions ==========
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

	// Row Selection Options
	const rowSelectionOptions = React.useMemo(() => {
		if (rowSelection) {
			return {
				columnWidth: 30,
				selectedRowKeys: rowSelection.map((item) => item.key),
				getCheckboxProps: (record: { key: number; index: number }) => {
					const props = getCheckboxProps?.(record) || {};
					return {
						...props,
						'data-row-index': record.index,
						onKeyDown: (e: React.KeyboardEvent) => {
							const cellKey = `${record.index}-__rowSelection__`;
							if (
								[
									'Tab',
									'ArrowLeft',
									'ArrowRight',
									'ArrowUp',
									'ArrowDown',
									'Enter',
									'Escape',
									' ',
								].includes(e.key)
							) {
								// Space on checkbox: let the native checkbox handle it (toggle), then update focus
								if (e.key === ' ') {
									setFocusedCell(cellKey);
									return;
								}
								e.preventDefault();
								handleCellKeyDown(cellKey, e, false, getCheckboxProps);
							}
						},
						onClick: () => {
							const cellKey = `${record.index}-__rowSelection__`;
							setFocusedCell(cellKey);
						},
					};
				},
				onChange: onSelectChange,
			};
		}
		return undefined;
	}, [rowSelection, getCheckboxProps, onSelectChange, handleCellKeyDown, setFocusedCell]);

	// Table Changes Event
	const onTableChange = (
		newPagination: Pagination,
		_filter: TableFilter,
		sorter: TableSort | TableSort[],
		extra: TableExtra<T>,
	) => {
		switch (extra.action) {
			case TABLE_ACTIONS.PAGINATE:
				if (onPaginationChange) {
					// Store previous pagination state
					const prevPagination = {
						current: pagination?.current || 1,
						pageSize: pagination?.pageSize || DEFAULT_PAGE_SIZE,
					};

					// Check for unsaved changes (client-side pagination only; server-side always proceeds)
					if (!autoPagination && hasUnsavedChanges()) {
						showUnsaveChangeMessage(
							() => {
								onPaginationChange(newPagination.current, newPagination.pageSize);
								onSelectChange?.([], []);
							},
							() => {
								onPaginationChange(prevPagination.current, prevPagination.pageSize);
							},
						);
					} else {
						onPaginationChange(newPagination.current, newPagination.pageSize);
						onSelectChange?.([], []);
					}
				}
				break;
			case TABLE_ACTIONS.SORT: {
				// For local sorting, use handleTableSort directly (no unsaved changes check needed)
				if (sortMode === 'local') {
					handleTableSort(sorter);
				} else {
					// For remote sorting, extract the clicked column and use the wrapped handler
					// which includes unsaved changes check
					const singleSorter = Array.isArray(sorter) ? sorter[sorter.length - 1] : sorter;
					const newSortField = singleSorter?.field as string | undefined;
					const newSortType =
						singleSorter?.order === 'ascend' ? SORT.ASC : singleSorter?.order === 'descend' ? SORT.DESC : undefined;
					handleSortChangeWithCheck(newSortField, newSortType);
				}
				onSelectChange?.([], []);
				break;
			}
			case TABLE_ACTIONS.FILTER:
				break;
		}
	};

	// Render Cells
	const renderCell = React.useCallback(
		(mappedColumns: TableColumn<T>[], fields: FormListFieldData[]) => {
			const processColumns = (columns: TableColumn<T>[]): TableColumn<T>[] =>
				columns.map((col) => {
					// Recursively handle children
					if (col.children) {
						return {
							...col,
							children: processColumns(col.children),
						};
					}

					// Extract the original render prop from the column if it exists
					const originalRender = col.render;
					// Type cast to match our customRender signature (ColumnType.render can return RenderedCell, but we use it as ReactNode)
					const customRenderFn = originalRender
						? (text: any, record: T, rowIndex: number) => {
								const result = originalRender(text, record, rowIndex);
								// Extract ReactNode from RenderedCell if needed (RenderedCell is an object with props, but we just want the node)
								return result as React.ReactNode;
							}
						: undefined;

					const disabledCellStyle = col.editProps?.disabled
						? { backgroundColor: '#fafafa' }
						: undefined;
					const existingOnCell = col.onCell;
					return {
						...col,
						title: <ColumnHeader<T> title={col.title} required={col.editProps?.required} />,
						onCell: (record: T, rowIndex?: number) => {
							const existing = existingOnCell?.(record, rowIndex) ?? {};
							return {
								...existing,
								style: disabledCellStyle
									? { ...(existing.style as React.CSSProperties), ...disabledCellStyle }
									: existing.style,
							};
						},
						render: (text: any, record: T, rowIndex: number) => (
							<EditableCell
								editType={col.editType}
								field={fields[rowIndex]}
								cellKey={`${rowIndex}-${col.dataIndex}`}
								name={[fields[rowIndex].name, col.dataIndex as string]}
								tableFormName={formTableName}
								editProps={col.editProps}
								tooltip={col.tooltip}
								text={text}
								record={record}
								activeEditingCell={activeEditingCell}
								setActiveEditingCell={setActiveEditingCell}
								align={col.align as 'left' | 'right' | 'center' | undefined}
								onCellKeyDown={(cellKey, e, isEditing) =>
									handleCellKeyDown(cellKey, e, isEditing, getCheckboxProps)
								}
								setFocusedCell={setFocusedCell}
								customRender={customRenderFn}
								pasteVersion={pasteVersion}
							/>
						),
					};
				});

			return processColumns(mappedColumns);
		},
		[
			formTableName,
			activeEditingCell,
			pasteVersion,
			handleCellKeyDown,
			setFocusedCell,
			getCheckboxProps,
			t,
		],
	);

	const onFinish = (values: any) => {
		console.log('Received values of form:', values);
	};

	const onFieldsChange = (changedFields: any[]) => {
		if (some(changedFields, (field) => field.validating)) return;

		const changedField = changedFields.find(
			(field) => Array.isArray(field?.name) && field.name.length >= 2,
		);
		if (!changedField) return;

		const [formName, rowIndex, columnName] = changedField.name;
		if (columnName === 'procFlag') return;

		// Only mark row as updated when user really edits a cell.
		// Programmatic updates (setFieldsValue on initial load/paging) should not turn rows yellow.
		if (!changedField.touched) return;
		if (typeof rowIndex !== 'number') return;

		const curProcFlg = form.getFieldValue([formName, rowIndex, 'procFlag']);
		form.setFieldValue([formName, rowIndex, 'procFlag'], curProcFlg === 'S' ? 'U' : curProcFlg);
		onTableDataChange?.(form.getFieldValue([formName, rowIndex]));

		// Remove row from error set when field changes (user is fixing the error)
		// Use ref for fast lookup - no re-render needed on every input
		// The row color will update when validation runs next time
		rowsWithErrors.current.delete(rowIndex);
	};

	// Memoize onRow callback to prevent unnecessary re-renders
	const handleRow = React.useCallback(
		(record: TableData<T>, rowIndex?: number) => {
			// Use the record's index property if available (for local sorting), otherwise use rowIndex
			const actualRowIndex =
				(record as any)?.index !== undefined ? (record as any).index : rowIndex;
			const rowData = form.getFieldValue([formTableName, actualRowIndex]);
			const procFlag = rowData?.procFlag;

			// Determine className based on procFlag and validation errors
			let rowClassName = '';
			if (procFlag === 'U') {
				rowClassName = 'row-updated';
			} else if (procFlag === 'I') {
				rowClassName = 'row-inserted';
			}

			// Add error class if row has validation errors (priority over procFlag)
			// Use ref for fast lookup - errorRowsVersion ensures re-render when needed
			if (rowsWithErrors.current.has(actualRowIndex!)) {
				rowClassName = 'row-error';
			}

			const customRowProps = customOnRow?.(record, actualRowIndex ?? 0) ?? {};
			const customClassName =
				typeof customRowProps.className === 'string' ? customRowProps.className : '';
			const mergedClassName = [rowClassName, customClassName].filter(Boolean).join(' ');
			const customOnClick =
				typeof customRowProps.onClick === 'function'
					? (customRowProps.onClick as (event: React.MouseEvent) => void)
					: undefined;
			const customOnDoubleClick =
				typeof customRowProps.onDoubleClick === 'function'
					? (customRowProps.onDoubleClick as (event: React.MouseEvent) => void)
					: undefined;
			const customOnContextMenu =
				typeof customRowProps.onContextMenu === 'function'
					? (customRowProps.onContextMenu as (event: React.MouseEvent) => void)
					: undefined;

			return {
				...customRowProps,
				className: mergedClassName,
				onClick: (e: React.MouseEvent) => {
					customOnClick?.(e);
					onRowClick?.(rowData, actualRowIndex!);
				},
				onDoubleClick: (e: React.MouseEvent) => {
					customOnDoubleClick?.(e);
					onRowDoubleClick?.(rowData, actualRowIndex!);
				},
				onContextMenu: (e: React.MouseEvent) => {
					customOnContextMenu?.(e);
					showMenu(e, rowData);
				},
			};
		},
		[
			form,
			formTableName,
			rowsWithErrors,
			errorRowsVersion,
			showMenu,
			onRowClick,
			onRowDoubleClick,
			customOnRow,
		],
	);

	// Render Table
	return (
		<ConfigProvider
			renderEmpty={() => <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No Data')} />}
		>
			<Form
				form={form}
				onFinish={onFinish}
				onFieldsChange={onFieldsChange}
				initialValues={{
					[formTableName]: data.map((item, index) => ({ ...item, key: index, procFlag: 'S' })),
				}}
			>
				<Form.List name={formTableName}>
					{(fields, { add, remove }) => {
						// Assign "add, remove" to ref for external use
						fieldsRef.current = fields;
						addRowRef.current = add;
						removeRowRef.current = remove;

						// For local sorting, we need to sort the form's current values and reorder fields
						// For remote sorting, use fields as-is
						let dataFieldSource: Array<TableData<T> & { index: number }>;

						if (sortMode === 'local' && sort && sort.sortField && sort.sortType) {
							// Get current form values
							const formValues = (form.getFieldValue(formTableName) as TableData<T>[]) || [];

							// Create array with field info and form values
							const fieldsWithData = fields.map((field, index) => ({
								field,
								data: formValues[index] || data[index],
								originalIndex: index,
							}));

							// Sort by the sort field
							const sortedFieldsWithData = [...fieldsWithData].sort((a, b) => {
								const aValue = getTableNestedValue(a.data, sort.sortField!);
								const bValue = getTableNestedValue(b.data, sort.sortField!);

								if (aValue == null && bValue == null) return 0;
								if (aValue == null) return 1;
								if (bValue == null) return -1;

								let comparison = 0;
								if (typeof aValue === 'number' && typeof bValue === 'number') {
									comparison = aValue - bValue;
								} else if (aValue instanceof Date && bValue instanceof Date) {
									comparison = aValue.getTime() - bValue.getTime();
								} else if (
									aValue != null &&
									bValue != null &&
									typeof (aValue as { valueOf?: () => unknown }).valueOf === 'function' &&
									typeof (bValue as { valueOf?: () => unknown }).valueOf === 'function'
								) {
									const aNum = (aValue as { valueOf: () => number }).valueOf();
									const bNum = (bValue as { valueOf: () => number }).valueOf();
									comparison =
										typeof aNum === 'number' && typeof bNum === 'number' ? aNum - bNum : 0;
								} else {
									const aStr = String(aValue).toLowerCase();
									const bStr = String(bValue).toLowerCase();
									comparison = aStr.localeCompare(bStr);
								}

								return sort.sortType === SORT.ASC ? comparison : -comparison;
							});

							// Map to dataSource
							dataFieldSource = sortedFieldsWithData.map((item) => ({
								...item.data,
								key: item.field.key,
								index: item.originalIndex, // Keep original index for form operations
							}));
						} else {
							// For remote sorting or no sort, use fields as-is
							const formValues = (form.getFieldValue(formTableName) as TableData<T>[]) || [];
							dataFieldSource = fields.map((field, index) => ({
								...(formValues[index] || data[index]),
								key: field.key,
								index,
							}));
						}

						// Update visual row order ref for vertical keyboard navigation
						dataFieldSourceRef.current = dataFieldSource;

						return (
							<WrapperTable
								ref={containerRef}
								className="edit-table"
								style={{ padding: isFullscreen ? 32 : 0 }}
							>
								<FilterFormContext.Provider value={filterFormContextValue}>
									<DragDropTableContextProvider columns={mappedColumns} setColumns={setTableColumn}>
										<Table<TableData<T>>
											bordered
											ref={tableRef}
											size="small"
											virtual={virtual}
											loading={loading}
											className={styles.tableCustom}
											columns={renderCell(columnsWithAdjustedWidth, fields) as any[]}
											dataSource={dataFieldSource as any[]}
											rowSelection={rowSelectionOptions as any}
											scroll={{ x: adjustedTableWidth, y: finalTableHeight }}
											style={{
												paddingBottom: noFooter
													? 0
													: !paginationOptions || data.length == 0
														? 45
														: 0,
												whiteSpace: 'pre',
											}}
											pagination={paginationOptions}
											components={{
												header: {
													wrapper: FilterFormHeaderWrapper,
													cell: TableHeader,
												},
											}}
											onRow={handleRow}
											summary={renderSummary}
											onChange={onTableChange as any}
										/>
										{noFooter ? (
											<></>
										) : (
											<CountItems
												style={{
													position: isFullscreen ? 'relative' : 'absolute',
													float: isFullscreen ? 'right' : 'none',
													bottom: isFullscreen
														? 40
														: fieldsRef.current.length == 0
															? 12
															: paginationOptions
																? 18
																: 13,
												}}
											>
												{t('Total')}: {pagination?.total || fieldsRef.current.length || 0}{' '}
												{t('item(s)')}
											</CountItems>
										)}
									</DragDropTableContextProvider>
								</FilterFormContext.Provider>
							</WrapperTable>
						);
					}}
				</Form.List>

				<EditTableContextMenu
					tableRef={ref as React.RefObject<EditTableHandler<T>>}
					isOpen={isOpenMenu}
					position={menuPosition}
					record={selectedMenuRecord}
					selectedRows={rowSelection}
					hideMenu={hideMenu}
					dataSource={form.getFieldValue(formTableName)}
					columns={mappedColumns}
					summary={renderSummary}
					exportFileName={exportFileName || 'data'}
					contextMenu={contextMenu}
					editableActions={contextMenu?.editableActions ?? true}
					formTableName={formTableName}
					hasUnsavedChanges={hasUnsavedChanges}
					toggleFullScreen={toggleFullscreen}
				/>

				<ContextHeaderMenu
					isOpen={isOpenHeaderMenu}
					position={headerMenuPosition}
					column={selectedHeaderColumn}
					columns={mappedColumns}
					allColumns={columns}
					onColumnVisibilityChange={handleColumnVisibilityChange}
					onSortChange={handleSortChangeWithCheck}
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
	color: var(--ant-color-text-secondary);
`;

export default React.forwardRef(EditCustomTable) as <T>(
	props: EditCustomTableProps<T> & { ref?: React.ForwardedRef<EditTableHandler<T>> },
) => ReturnType<typeof EditCustomTable>;
