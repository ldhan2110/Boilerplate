/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useAppTranslate, useDebounce } from '@/hooks';
import {
	type TableColumn,
	type TableData,
	type TableState,
	type Sort,
	type MultiSort,
	type DynamicFilterDto,
	SORT,
	EDIT_TYPE,
} from '@/types';
import { Table, Form, type FormInstance, type FormListFieldData } from 'antd';
import { useResizeHandler } from './useResizeHandler';
import { STABLE_TABLE_SCROLL_DEPS, useTableScroll } from './useTableScroll';
import { maxBy, some } from 'lodash';
import TableSummaryCell from '../components/TableSummaryCell';
import { useContextMenu } from './useContextMenu';
import { useHeaderMenu } from './useHeaderMenu';
import { useFullscreen } from './useFullScreen';
import { useShowMessage } from '@/hooks';
import { mergeResizedWidthsIntoColumns, sortDataLocally, multiSortDataLocally, toDynamicFilterList } from '../utils';
import { formatCellDisplayValue } from '../utils/cellDisplayFormatters';
import { MESSAGE_CODES } from '@/constants';
import type { Rule, RuleObject } from 'antd/es/form';

export function useEditTableHooks<T>(
	columns: TableColumn<T>[],
	data: T[],
	form: FormInstance,
	formTableName: string,
	headerOffset?: number,
	tableState?: TableState<T>,
	tableStateSort?: Sort | undefined,
	onSortChange?: (sortField: string | undefined, sortType: SORT | undefined) => void,
	sortMode?: 'local' | 'remote',
	onFilterTableChange?: (filterList: DynamicFilterDto[]) => void,
	tableFilterForm?: FormInstance,
	onMultiSortChange?: (sorts: MultiSort) => void,
) {
	// ===================== 🚀 Hooks & State Setup =====================
	const { t, m } = useAppTranslate();
	const { showUnsaveChangeMessage } = useShowMessage();
	const [tableColumn, setTableColumn] = React.useState<TableColumn<T>[]>([]);
	const [sort, setSort] = React.useState<Sort | undefined>(tableState?.sort);
	const [multiSorts, setMultiSorts] = React.useState<MultiSort>([]);
	const isMultiSortMode = !!onMultiSortChange;
	const deletedRows = React.useRef<TableData<T>[]>([]);
	const rowsWithErrors = React.useRef<Set<number>>(new Set());
	const [errorRowsVersion, setErrorRowsVersion] = React.useState(0); // Version counter to trigger re-render when needed

	// ===================== 🔍 Filter Form Setup =====================
	// Separate form instance for filter fields (mirrors CustomTable's tableFilterForm pattern)
	const [internalFilterForm] = Form.useForm();
	const filterFormInstance = tableFilterForm ?? internalFilterForm;

	// ===================== 🔍 Check for Unsaved Changes =====================
	// Defined early so handleFilterFormChange (below) can close over it
	const hasUnsavedChanges = React.useCallback((): boolean => {
		const formData = form.getFieldValue(formTableName) as TableData<T>[];
		const hasModifiedRows = formData?.some((row) => row.procFlag === 'I' || row.procFlag === 'U');
		const hasDeletedRows = deletedRows.current.length > 0;
		return hasModifiedRows || hasDeletedRows;
	}, [form, formTableName, deletedRows]);

	// ===================== 🔄 Reset Deleted Rows =====================
	// Defined early so handleFilterFormChange can close over it
	const resetDeletedRows = React.useCallback(() => {
		deletedRows.current = [];
	}, []);

	// Sync sort state with tableState.sort when it changes
	React.useEffect(() => {
		if (tableStateSort !== undefined) {
			setSort(tableStateSort);
		}
	}, [tableStateSort]);

	// ===================== 📊 Table Context Menu Setup =====================
	const {
		isOpen: isOpenMenu,
		position: menuPosition,
		record: selectedMenuRecord,
		showMenu,
		hideMenu,
	} = useContextMenu();

	// ===================== 📊 Header Context Menu Setup =====================
	const {
		isOpen: isOpenHeaderMenu,
		position: headerMenuPosition,
		column: selectedHeaderColumn,
		showMenu: showHeaderMenu,
		hideMenu: hideHeaderMenu,
	} = useHeaderMenu<T>();

	// ===================== 📊 Full Screen Hooks Setup =====================
	const { containerRef, isFullscreen, toggleFullscreen } = useFullscreen();

	// ===================== 📏 Table Size Setup =====================
	const tableHeight = useTableScroll(STABLE_TABLE_SCROLL_DEPS, headerOffset ?? 290, isFullscreen);
	const tableWidth = React.useMemo(() => {
		return columns?.reduce(
			(accumulator, currentValue) => accumulator + (currentValue.width as number),
			0,
		);
	}, [columns]);

	// ===================== 🔍 Advance Filter Setup =====================
	// Must be declared before mappedColumns so showAdvanceFilter is in scope for the deps array
	const [showAdvanceFilter, setShowAdvanceFilter] = React.useState(false);

	const handleAdvanceFilterToggle = React.useCallback(() => {
		setShowAdvanceFilter((prev) => !prev);
	}, []);

	const hasFilterableColumns = React.useMemo(() => {
		const checkColumns = (cols: TableColumn<T>[]): boolean => {
			return cols.some((col) => {
				if (col.children) return checkColumns(col.children);
				return col.filterProps?.showFilter === true;
			});
		};
		return checkColumns(columns);
	}, [columns]);

	// Stores last successfully applied filter values so we can revert on cancel
	const lastCommittedFilterValues = React.useRef<Record<string, any>>({});
	// Guard flag to prevent the programmatic setFieldsValue (revert) from re-triggering this handler
	const isRevertingFilter = React.useRef(false);

	const handleFilterFormChangeCallback = React.useCallback(
		(_changedValues: any, allValues: any) => {
			if (isRevertingFilter.current) {
				isRevertingFilter.current = false;
				return;
			}

			const prevFilterValues = { ...lastCommittedFilterValues.current };

			const applyFilter = () => {
				const filterValue = toDynamicFilterList(allValues);
				onFilterTableChange?.(filterValue);
				lastCommittedFilterValues.current = { ...allValues };
			};

			if (hasUnsavedChanges()) {
				showUnsaveChangeMessage(
					() => {
						applyFilter();
						resetDeletedRows();
					},
					() => {
						isRevertingFilter.current = true;
						filterFormInstance.setFieldsValue(prevFilterValues);
					},
				);
			} else {
				applyFilter();
			}
		},
		[
			hasUnsavedChanges,
			showUnsaveChangeMessage,
			onFilterTableChange,
			form,
			formTableName,
			resetDeletedRows,
			filterFormInstance,
		],
	);

	const handleFilterFormChange = useDebounce(handleFilterFormChangeCallback);

	// ===================== 📋 Table Columns Setup =====================
	const { makeResizable } = useResizeHandler(tableColumn, setTableColumn, showHeaderMenu);
	const mappedColumns = React.useMemo(() => {
		const resizableColumns = makeResizable(
			tableColumn.map((col) => ({
				...col,
				filterProps: {
					...col.filterProps,
					showFilter: (col.filterProps?.showFilter ?? false) && showAdvanceFilter,
					onFilterTableChange: handleFilterFormChange,
				},
			})),
		);
		return resizableColumns;
	}, [makeResizable, tableColumn, showAdvanceFilter]);

	// ===================== 🔹 External Refs Setup =====================
	const tableRef = React.useRef<any>(null);
	const fieldsRef = React.useRef<FormListFieldData[]>([]);
	const addRowRef = React.useRef<
		((defaultValue?: Partial<TableData<T>>, index?: number) => void) | null
	>(null);
	const removeRowRef = React.useRef<((index: number | number[]) => void) | null>(null);

	// Tracks the visual row order for vertical navigation (handles local sorting)
	// Updated by EditCustomTable whenever dataFieldSource is computed
	const dataFieldSourceRef = React.useRef<Array<{ index: number }>>([]);

	// Update table columns when columns or data change; keep user-resized widths when only defs change (e.g. new select options).
	React.useEffect(() => {
		setTableColumn((prev) => mergeResizedWidthsIntoColumns(prev, columns));
	}, [columns, data, form, formTableName]);

	// ===================== 🛠️ Tables Utility Setup =====================
	const generateKey = () => {
		const nextKey = (maxBy(fieldsRef.current, 'key')?.key ?? 0) + 1;
		return nextKey;
	};

	const scrollToRow = React.useCallback((rowIndex?: number) => {
		setTimeout(() => {
			if (!tableRef.current || !fieldsRef.current) return;

			if (typeof rowIndex === 'number') {
				// Scroll directly to inserted row
				tableRef.current.scrollTo({ rowIndex });
			} else {
				// Scroll to bottom
				tableRef.current.scrollTo({ index: fieldsRef.current.length - 1 });
			}
		}, 100);
	}, []);

	const renderSummary = React.useCallback((): React.ReactNode | boolean => {
		// Flatten columns (accounting for children)
		const flatCols = mappedColumns.flatMap((col) =>
			col.children && col.children.length > 0 ? col.children : [col],
		);

		if (tableState?.rowSelection) {
			flatCols.unshift({ dataIndex: 'checkbox' });
		}

		if (!some(flatCols, 'summary')) return false;

		return (
			<Table.Summary fixed>
				<Table.Summary.Row>
					{flatCols.map((col, i) => (
						<TableSummaryCell
							key={i}
							cellKey={i}
							formTableName={formTableName}
							dataIndex={col.dataIndex as string}
							summary={col.summary}
							valueType={col.valueType}
							align={col.align}
							form={form}
						/>
					))}
				</Table.Summary.Row>
			</Table.Summary>
		);
	}, [form, formTableName, mappedColumns, tableState]);

	// ===================== 📝 Edit Mode State Management =====================
	const [activeEditingCell, setActiveEditingCell] = React.useState<string | null>(null);

	// Focused cell (ref-based to avoid re-renders on every arrow key press)
	const focusedCellRef = React.useRef<string | null>(null);

	// Internal clipboard for Ctrl+C / Ctrl+V between cells
	const cellClipboardRef = React.useRef<{ value: any; editType?: string } | null>(null);

	// Counter to force re-render of EditableCell after paste (React.memo bypass)
	const [pasteVersion, setPasteVersion] = React.useState(0);

	const setFocusedCell = React.useCallback((cellKey: string | null) => {
		const prev = focusedCellRef.current;
		focusedCellRef.current = cellKey;

		// Toggle CSS class via DOM for zero-rerender focus visual
		if (prev) {
			const prevEl = document.querySelector(`[data-cell-key="${prev}"]`) as HTMLElement;
			prevEl?.classList.remove('cell-focused');
		}
		if (cellKey) {
			const nextEl = document.querySelector(`[data-cell-key="${cellKey}"]`) as HTMLElement;
			nextEl?.classList.add('cell-focused');
			// Scroll into view if off-screen
			nextEl?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
		}
	}, []);

	// Sync: when entering edit mode, update focusedCellRef to match (no DOM toggle needed since edit mode replaces display)
	// When clearing edit mode, keep focusedCell as-is (Escape keeps focus)
	React.useEffect(() => {
		if (activeEditingCell) {
			// Always remove focus visual when entering edit mode (edit mode has its own visual via the input)
			const prev = focusedCellRef.current;
			if (prev) {
				const prevEl = document.querySelector(`[data-cell-key="${prev}"]`) as HTMLElement;
				prevEl?.classList.remove('cell-focused');
			}
			focusedCellRef.current = activeEditingCell;
		}
	}, [activeEditingCell]);

	// Special key for rowSelection checkbox
	const ROW_SELECTION_KEY = '__rowSelection__';

	// Helper to check if a column is disabled
	const isColumnDisabled = React.useCallback(
		(col: TableColumn<T>, rowIndex?: number): boolean => {
			if (col.editProps?.disabled === true) return true;
			// Dynamic disabled (e.g. read-only PK for saved rows) — do not require `shouldUpdate` on the column
			if (rowIndex !== undefined && col.editProps?.overrideEditProps) {
				const formData = form.getFieldsValue();
				const overrideProps = col.editProps.overrideEditProps(formData, rowIndex, form, []);
				return overrideProps?.disabled === true;
			}
			return false;
		},
		[form],
	);

	// Ordered list of all navigable column dataIndex (includes read-only and disabled columns)
	// Includes rowSelection and checkbox cells if present
	const navigableColumnKeys = React.useMemo(() => {
		const collect = (cols: TableColumn<T>[]): string[] =>
			cols.flatMap((col) => {
				if (col.children?.length) return collect(col.children);
				// Include all columns with a dataIndex (editable, read-only, disabled)
				return col.dataIndex !== undefined ? [String(col.dataIndex)] : [];
			});
		const columnKeys = collect(mappedColumns);
		// Add rowSelection as first column if it exists
		if (tableState?.rowSelection) {
			return [ROW_SELECTION_KEY, ...columnKeys];
		}
		return columnKeys;
	}, [mappedColumns, tableState?.rowSelection]);

	// Click outside handler to deactivate edit mode AND clear focus
	// Must be always-on because focusedCellRef is a ref (no re-render on change)
	React.useEffect(() => {
		const handleClickOutside = async (event: MouseEvent) => {
			// Don't deactivate if clicking on modals, popups, or dropdown panels
			const target = event.target as HTMLElement;
			if (
				target.closest('.ant-modal') ||
				target.closest('.ant-picker-dropdown') ||
				target.closest('.ant-select-dropdown') ||
				target.closest('.ant-popover') ||
				target.closest('.ant-picker') ||
				target.closest('.ant-select-selector') ||
				target.closest('.ant-select-selection-search')
			) {
				return;
			}

			// Check if click is inside an editable cell
			if (target.closest('[data-cell-key]')) {
				return;
			}

			// Check if click is on a rowSelection checkbox
			if (target.closest('.ant-table-selection-column')) {
				return;
			}

			// Handle active editing cell: validate and close
			if (activeEditingCell) {
				const [rowIndexStr, ...dataIndexParts] = activeEditingCell.split('-');
				const rowIndex = parseInt(rowIndexStr, 10);
				const dataIndex = dataIndexParts.join('-');

				if (!Number.isNaN(rowIndex) && dataIndex && dataIndex !== ROW_SELECTION_KEY) {
					try {
						await form.validateFields([[formTableName, rowIndex, dataIndex]]);
						setActiveEditingCell(null);
					} catch (error) {
						setActiveEditingCell(null);
					}
				} else {
					setActiveEditingCell(null);
				}
			}

			// Always clear focus when clicking outside
			setFocusedCell(null);
		};

		// Small delay to avoid interfering with component mounting/click events
		const timeoutId = setTimeout(() => {
			document.addEventListener('mousedown', handleClickOutside);
		}, 100);

		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [activeEditingCell, form, formTableName, setFocusedCell]);

	const getNextCellKey = React.useCallback(
		(currentKey: string, direction: 1 | -1, _getCheckboxProps?: (record: { key: number; index: number }) => any, wrap: boolean = true) => {
			const [rowIndexStr, ...dataIndexParts] = currentKey.split('-');
			const rowIndex = parseInt(rowIndexStr, 10);
			const dataIndex = dataIndexParts.join('-');

			if (
				Number.isNaN(rowIndex) ||
				!dataIndex ||
				!navigableColumnKeys.length ||
				rowIndex < 0 ||
				rowIndex >= fieldsRef.current.length
			) {
				return null;
			}

			const colIdx = navigableColumnKeys.indexOf(dataIndex);
			if (colIdx === -1) return null;

			// Navigate to the immediate next/previous cell (no skipping)
			let nextRow = rowIndex;
			let nextColIdx = colIdx + direction;

			// Handle column wrapping
			if (nextColIdx >= navigableColumnKeys.length) {
				nextColIdx = 0;
				nextRow += 1;
			} else if (nextColIdx < 0) {
				nextColIdx = navigableColumnKeys.length - 1;
				nextRow -= 1;
			}

			// Handle row bounds
			if (nextRow >= fieldsRef.current.length) {
				if (!wrap) return null;
				nextRow = 0;
			} else if (nextRow < 0) {
				if (!wrap) return null;
				nextRow = fieldsRef.current.length - 1;
			}

			const nextDataIndex = navigableColumnKeys[nextColIdx];
			return `${nextRow}-${nextDataIndex}`;
		},
		[navigableColumnKeys],
	);

	const getVerticalCellKey = React.useCallback(
		(currentKey: string, direction: 'up' | 'down', _getCheckboxProps?: (record: { key: number; index: number }) => any) => {
			const [rowIndexStr, ...dataIndexParts] = currentKey.split('-');
			const formRowIndex = parseInt(rowIndexStr, 10);
			const dataIndex = dataIndexParts.join('-');

			if (Number.isNaN(formRowIndex) || !dataIndex || formRowIndex < 0 || formRowIndex >= fieldsRef.current.length) {
				return null;
			}

			// Build visual order: array of form indices in display order
			const visualOrder = dataFieldSourceRef.current.length > 0
				? dataFieldSourceRef.current.map((item) => item.index)
				: fieldsRef.current.map((_, i) => i); // fallback: no sorting, visual = form order

			// Find current position in visual order
			const visualPos = visualOrder.indexOf(formRowIndex);
			if (visualPos === -1) return null;

			const step = direction === 'down' ? 1 : -1;
			const nextVisualPos = visualPos + step;

			// Stop at boundaries (no wrap), navigate to immediate next row
			if (nextVisualPos < 0 || nextVisualPos >= visualOrder.length) {
				return null;
			}

			const nextFormIndex = visualOrder[nextVisualPos];
			return `${nextFormIndex}-${dataIndex}`;
		},
		[],
	);

	const handleCellKeyDown = React.useCallback(
		async (
			cellKey: string,
			e: React.KeyboardEvent,
			isEditing: boolean = false,
			getCheckboxProps?: (record: { key: number; index: number }) => any,
		) => {
			const [rowIndexStr, ...dataIndexParts] = cellKey.split('-');
			const rowIndex = parseInt(rowIndexStr, 10);
			const dataIndex = dataIndexParts.join('-');

			if (Number.isNaN(rowIndex) || !dataIndex) return false;

			// Helper to find a column by dataIndex
			const findColumn = (checkDataIndex: string): TableColumn<T> | null => {
				const findColumnRecursive = (cols: TableColumn<T>[]): TableColumn<T> | null => {
					for (const col of cols) {
						if (col.children?.length) {
							const found = findColumnRecursive(col.children);
							if (found) return found;
						}
						if (String(col.dataIndex) === checkDataIndex) return col;
					}
					return null;
				};
				return findColumnRecursive(mappedColumns);
			};

			const isCheckboxColumn = (checkDataIndex: string): boolean => {
				if (checkDataIndex === ROW_SELECTION_KEY) return true;
				const col = findColumn(checkDataIndex);
				return col?.editType === EDIT_TYPE.CHECKBOX;
			};

			const isEditableColumn = (checkDataIndex: string): boolean => {
				if (checkDataIndex === ROW_SELECTION_KEY) return false;
				const col = findColumn(checkDataIndex);
				return col?.editType !== undefined;
			};

			// Validate current cell (returns true if valid or not applicable)
			const validateCurrentCell = async (): Promise<boolean> => {
				if (dataIndex === ROW_SELECTION_KEY || isCheckboxColumn(dataIndex)) return true;
				try {
					await form.validateFields([[formTableName, rowIndex, dataIndex]]);
					return true;
				} catch {
					return false;
				}
			};

			// Helper to check if a specific cell is disabled
			const isCellDisabled = (checkRowIndex: number, checkDataIndex: string): boolean => {
				if (checkDataIndex === ROW_SELECTION_KEY) return false;
				const col = findColumn(checkDataIndex);
				if (!col) return false;
				return isColumnDisabled(col, checkRowIndex);
			};

			// Focus a target cell (set focusedCellRef + DOM focus)
			const focusCell = (targetKey: string, enterEditMode: boolean) => {
				const [targetRowStr, ...targetDataParts] = targetKey.split('-');
				const targetRowIndex = parseInt(targetRowStr, 10);
				const targetDataIndex = targetDataParts.join('-');

				if (enterEditMode && targetDataIndex !== ROW_SELECTION_KEY && !isCheckboxColumn(targetDataIndex) && isEditableColumn(targetDataIndex) && !isCellDisabled(targetRowIndex, targetDataIndex)) {
					setActiveEditingCell(targetKey);
				} else {
					setActiveEditingCell(null);
				}
				setFocusedCell(targetKey);

				// DOM focus
				setTimeout(() => {
					if (targetDataIndex === ROW_SELECTION_KEY) {
						const checkbox =
							(document.querySelector(
								`input[type="checkbox"][data-row-index="${targetRowIndex}"]`,
							) as HTMLInputElement) ||
							(document.querySelector(
								`.ant-table-tbody tr:nth-child(${targetRowIndex + 1}) input[type="checkbox"]`,
							) as HTMLInputElement);
						checkbox?.focus();
					} else {
						const cellElement = document.querySelector(`[data-cell-key="${targetKey}"]`);
						if (cellElement) {
							const input = cellElement.querySelector('input, textarea, select') as HTMLElement;
							if (input && typeof input.focus === 'function') {
								input.focus();
							} else if (cellElement instanceof HTMLElement && cellElement.tabIndex >= 0) {
								cellElement.focus();
							}
						}
					}
				}, 50);
			};

			const key = e.key;

			// ─── Ctrl+C (Copy cell value) ───
			if (key === 'c' && (e.ctrlKey || e.metaKey) && !isEditing) {
				// If user has selected text (e.g. via mouse drag), let browser handle native copy
				const selection = window.getSelection();
				if (selection && selection.toString().trim().length > 0) {
					return false;
				}
				e.preventDefault();
				const col = findColumn(dataIndex);
				const fullPath = [formTableName, rowIndex, dataIndex];
				const cellValue = form.getFieldValue(fullPath);
				cellClipboardRef.current = { value: cellValue, editType: col?.editType };
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const displayText = formatCellDisplayValue(cellValue, col?.editType, col?.editProps as any);
				const textToCopy = typeof displayText === 'string' ? displayText : String(displayText ?? '');
				void navigator.clipboard.writeText(textToCopy).catch(() => {});
				return true;
			}

			// ─── Ctrl+V (Paste into editable cell) ───
			if (key === 'v' && (e.ctrlKey || e.metaKey) && !isEditing) {
				e.preventDefault();
				if (!isEditableColumn(dataIndex)) return true;
				const col = findColumn(dataIndex);
				if (col && isColumnDisabled(col, rowIndex)) return true;
				if (isCheckboxColumn(dataIndex)) return true;

				if (cellClipboardRef.current) {
					const fullPath = [formTableName, rowIndex, dataIndex];
					form.setFieldValue(fullPath, cellClipboardRef.current.value);
					const rowData = form.getFieldValue([formTableName, rowIndex]);
					if (rowData && rowData.procFlag && rowData.procFlag !== 'I') {
						form.setFieldValue([formTableName, rowIndex, 'procFlag'], 'U');
					}
					// Force re-render of memoized EditableCell components
					setPasteVersion((v) => v + 1);
				}
				return true;
			}

			// ─── Tab / Shift+Tab ───
			if (key === 'Tab') {
				e.preventDefault();
				const isShift = e.shiftKey;

				// If editing, validate before navigating
				if (isEditing) {
					const valid = await validateCurrentCell();
					if (!valid) return true; // Stay on current cell
				}

				const nextKey = getNextCellKey(cellKey, isShift ? -1 : 1, getCheckboxProps, true);
				if (!nextKey) return false;

				focusCell(nextKey, true); // Tab always enters edit mode on target
				return true;
			}

			// ─── Arrow Left / Right ───
			if (key === 'ArrowLeft' || key === 'ArrowRight') {
				// In editing mode: let input handle cursor movement
				if (isEditing) return false;

				e.preventDefault();
				const direction = key === 'ArrowRight' ? 1 : -1;
				const nextKey = getNextCellKey(cellKey, direction as 1 | -1, getCheckboxProps, false);
				if (!nextKey) return false;

				focusCell(nextKey, false); // Arrows don't enter edit mode
				return true;
			}

			// ─── Arrow Up / Down ───
			if (key === 'ArrowUp' || key === 'ArrowDown') {
				e.preventDefault();

				// If editing, validate and exit edit mode first
				if (isEditing) {
					const valid = await validateCurrentCell();
					if (!valid) return true; // Stay in editing mode
				}

				const direction = key === 'ArrowDown' ? 'down' : 'up';
				const nextKey = getVerticalCellKey(cellKey, direction, getCheckboxProps);
				if (!nextKey) return false;

				focusCell(nextKey, false); // Arrows don't enter edit mode
				return true;
			}

			// ─── Enter ───
			if (key === 'Enter') {
				e.preventDefault();

				if (isEditing) {
					// Validate and exit edit mode, stay focused
					const valid = await validateCurrentCell();
					if (!valid) return true;
					setActiveEditingCell(null);
					setFocusedCell(cellKey);
					// Focus the display div
					setTimeout(() => {
						const cellElement = document.querySelector(`[data-cell-key="${cellKey}"]`) as HTMLElement;
						if (cellElement && cellElement.tabIndex >= 0) {
							cellElement.focus();
						}
					}, 50);
				} else {
					// Enter edit mode (or toggle checkbox)
					if (isCheckboxColumn(dataIndex)) {
						if (dataIndex === ROW_SELECTION_KEY) {
							const checkbox = document.querySelector(
								`input[type="checkbox"][data-row-index="${rowIndex}"]`,
							) as HTMLInputElement;
							checkbox?.click();
						} else {
							const col = findColumn(dataIndex);
							const checkboxMapping = col?.editProps?.checkboxMapping ?? { checked: true, unchecked: false };
							const fullPath = [formTableName, rowIndex, dataIndex];
							const currentValue = form.getFieldValue(fullPath);
							const isChecked = currentValue === checkboxMapping.checked;
							form.setFieldValue(fullPath, isChecked ? checkboxMapping.unchecked : checkboxMapping.checked);
						}
					} else if (isEditableColumn(dataIndex) && !isCellDisabled(rowIndex, dataIndex)) {
						setActiveEditingCell(cellKey);
					}
				}
				return true;
			}

			// ─── Escape ───
			if (key === 'Escape') {
				e.preventDefault();

				if (isEditing) {
					// Exit edit mode, stay focused
					setActiveEditingCell(null);
					setFocusedCell(cellKey);
					setTimeout(() => {
						const cellElement = document.querySelector(`[data-cell-key="${cellKey}"]`) as HTMLElement;
						if (cellElement && cellElement.tabIndex >= 0) {
							cellElement.focus();
						}
					}, 50);
				} else {
					// Clear focus entirely
					setFocusedCell(null);
					(document.activeElement as HTMLElement)?.blur();
				}
				return true;
			}

			// ─── Space (only in focused/non-editing state) ───
			if (key === ' ' && !isEditing) {
				e.preventDefault();

				if (isCheckboxColumn(dataIndex)) {
					if (dataIndex === ROW_SELECTION_KEY) {
						const checkbox = document.querySelector(
							`input[type="checkbox"][data-row-index="${rowIndex}"]`,
						) as HTMLInputElement;
						checkbox?.click();
					} else {
						const col = findColumn(dataIndex);
						const checkboxMapping = col?.editProps?.checkboxMapping ?? { checked: true, unchecked: false };
						const fullPath = [formTableName, rowIndex, dataIndex];
						const currentValue = form.getFieldValue(fullPath);
						const isChecked = currentValue === checkboxMapping.checked;
						form.setFieldValue(fullPath, isChecked ? checkboxMapping.unchecked : checkboxMapping.checked);
					}
				} else if (isEditableColumn(dataIndex) && !isCellDisabled(rowIndex, dataIndex)) {
					// Enter edit mode
					setActiveEditingCell(cellKey);
				}
				return true;
			}

			return false;
		},
		[form, formTableName, getNextCellKey, getVerticalCellKey, setFocusedCell, mappedColumns, isColumnDisabled],
	);

	// Backward-compatible wrapper for rowSelection checkbox (used in EditCustomTable)
	const handleTabNavigate = React.useCallback(
		async (
			cellKey: string,
			isShift: boolean,
			isEditing: boolean = false,
			getCheckboxProps?: (record: { key: number; index: number }) => any,
		) => {
			const syntheticEvent = {
				key: 'Tab',
				shiftKey: isShift,
				preventDefault: () => {},
				stopPropagation: () => {},
			} as React.KeyboardEvent;
			return handleCellKeyDown(cellKey, syntheticEvent, isEditing, getCheckboxProps);
		},
		[handleCellKeyDown],
	);

	const canTabNavigate = React.useCallback(
		(cellKey: string, isShift: boolean, getCheckboxProps?: (record: { key: number; index: number }) => any) =>
			!!getNextCellKey(cellKey, isShift ? -1 : 1, getCheckboxProps),
		[getNextCellKey],
	);

	// ===================== 🔄 Sort State Setup =====================
	// Handle sort change (from context menu or table header)
	const handleSortChange = React.useCallback(
		(sortField: string | undefined, sortType: SORT | undefined) => {
			if (isMultiSortMode) {
				setMultiSorts((prev) => {
					let next: MultiSort;
					if (!sortField) {
						// No field specified — clear all sorts
						next = [];
					} else if (!sortType) {
						// Field specified but no direction — only remove THIS column
						next = prev.filter((s) => s.sortField !== sortField);
					} else {
						const existingIdx = prev.findIndex((s) => s.sortField === sortField);
						if (existingIdx >= 0) {
							const existing = prev[existingIdx];
							if (existing.sortType === sortType) {
								if (sortType === SORT.ASC) {
									next = prev.map((s, i) =>
										i === existingIdx ? { sortField, sortType: SORT.DESC } : s,
									);
								} else {
									next = prev.filter((_, i) => i !== existingIdx);
								}
							} else {
								next = prev.map((s, i) =>
									i === existingIdx ? { sortField, sortType } : s,
								);
							}
						} else {
							next = [...prev, { sortField, sortType }];
						}
					}
					setSort(next.length > 0 ? next[0] : undefined);
					if (sortMode !== 'local') {
						onMultiSortChange?.(next);
					} else {
						form.setFieldValue(formTableName, multiSortDataLocally(form.getFieldValue(formTableName) as TableData<T>[], next));
					}
					return next;
				});
			} else {
				const newSort: Sort | undefined = sortField && sortType
					? { sortField, sortType }
					: undefined;
				setSort(newSort);
				if (sortMode !== 'local') {
					onSortChange?.(sortField, sortType);
				} else {
					form.setFieldValue(formTableName, sortDataLocally(form.getFieldValue(formTableName) as TableData<T>[], newSort));
				}
			}
		},
		[onSortChange, onMultiSortChange, sortMode, isMultiSortMode],
	);

	// Handle sort action from Ant Design's onChange (multi-sort mode).
	// Ant Design already cycled the sort state, so we sync directly without re-cycling.
	const handleTableSort = React.useCallback(
		(sorter: any) => {
			if (isMultiSortMode) {
				const sorters = Array.isArray(sorter) ? sorter : [sorter];
				const next: MultiSort = sorters
					.filter((s: any) => s.order)
					.map((s: any) => ({
						sortField: s.field as string,
						sortType: s.order === 'ascend' ? SORT.ASC : SORT.DESC,
					}));
				setMultiSorts(next);
				setSort(next.length > 0 ? next[0] : undefined);
				if (sortMode !== 'local') {
					onMultiSortChange?.(next);
				} else {
					form.setFieldValue(formTableName, multiSortDataLocally(form.getFieldValue(formTableName) as TableData<T>[], next));
				}
			} else {
				const s = Array.isArray(sorter) ? sorter[0] : sorter;
				handleSortChange(
					s?.field as string,
					s?.order === 'ascend' ? SORT.ASC : s?.order === 'descend' ? SORT.DESC : undefined,
				);
			}
		},
		[isMultiSortMode, handleSortChange, onMultiSortChange, sortMode, form, formTableName],
	);

	// Handle removing a single column from multi-sort
	const handleRemoveSort = React.useCallback(
		(sortField: string) => {
			setMultiSorts((prev) => {
				const next = prev.filter((s) => s.sortField !== sortField);
				setSort(next.length > 0 ? next[0] : undefined);
				if (sortMode !== 'local') {
					onMultiSortChange?.(next);
				} else {
					form.setFieldValue(formTableName, multiSortDataLocally(form.getFieldValue(formTableName) as TableData<T>[], next));
				}
				return next;
			});
		},
		[onMultiSortChange, sortMode],
	);

	// Handle clearing all sorts
	const handleClearAllSorts = React.useCallback(() => {
		setMultiSorts([]);
		setSort(undefined);
		if (sortMode !== 'local') {
			if (isMultiSortMode) {
				onMultiSortChange?.([]);
			} else {
				onSortChange?.(undefined, undefined);
			}
		}
	}, [onSortChange, onMultiSortChange, sortMode, isMultiSortMode]);

	// ===================== 🔄 Column Reorder Setup =====================
	// Handle column reordering
	const handleColumnReorder = React.useCallback(
		(reorderedColumns: TableColumn<T>[]) => {
			// Update the table columns with the new order
			// The reorderedColumns should maintain the nested structure
			setTableColumn(reorderedColumns);
		},
		[setTableColumn],
	);

	// ===================== 🔄 Wrapped Sort Change Handler =====================
	// Wrap handleSortChange to check for unsaved changes when called from context menu
	const handleSortChangeWithCheck = React.useCallback(
		(sortField: string | undefined, sortType: SORT | undefined) => {
			// For local sorting, skip unsaved changes check (no backend call)
			if (sortMode === 'local') {
				handleSortChange(sortField, sortType);
				return;
			}

			// Store previous sort state
			const prevSortField = sort?.sortField;
			const prevSortType = sort?.sortType;

			// Check for unsaved changes
			if (hasUnsavedChanges()) {
				showUnsaveChangeMessage(
					() => {
						// User confirmed - proceed with sort change
						handleSortChange(sortField, sortType);
					},
					() => {
						// User cancelled - revert sort state
						handleSortChange(prevSortField, prevSortType);
					},
				);
			} else {
				// No unsaved changes - proceed normally
				handleSortChange(sortField, sortType);
			}
		},
		[hasUnsavedChanges, showUnsaveChangeMessage, handleSortChange, sort, sortMode],
	);

	// ===================== 🔄 Reset to Default Setup =====================
	// Handle reset to default configuration
	const handleResetToDefault = React.useCallback(() => {
		// Reset columns back to original configuration
		setTableColumn(columns);
		// Reset sort to undefined (using handleSortChangeWithCheck to check for unsaved changes)
		handleSortChangeWithCheck(undefined, undefined);
	}, [columns, setTableColumn, handleSortChangeWithCheck]);

	// ===================== 🔄 Column Visibility Setup =====================
	// Handle column visibility change
	const handleColumnVisibilityChange = React.useCallback(
		(dataIndex: string, visible: boolean) => {
			// Helper to locate the chain of parent groups for a target column in the ORIGINAL columns definition.
			// Returns an array of parent group columns from top-level -> immediate parent.
			const findParentChain = (
				cols: TableColumn<T>[],
				targetDataIndex: string,
				ancestors: TableColumn<T>[] = [],
			): TableColumn<T>[] | null => {
				for (const col of cols) {
					if (col.children) {
						// If the target is directly inside this group
						const directHit = col.children.some((child) => (child as any).dataIndex === targetDataIndex);
						if (directHit) {
							return [...ancestors, col];
						}
						// Otherwise search deeper, adding this group to the ancestor chain
						const found = findParentChain(col.children, targetDataIndex, [...ancestors, col]);
						if (found) return found;
					}
				}
				return null;
			};

			// Helper to ensure a group path exists in the CURRENT columns state.
			// It will recreate missing group columns (with empty children) using the original definition.
			const ensureGroupPathExists = (
				currentCols: TableColumn<T>[],
				originalCols: TableColumn<T>[],
				parentChain: TableColumn<T>[],
			): TableColumn<T>[] => {
				const nextCols = [...currentCols];
				let levelCurrent = nextCols;
				let levelOriginal = originalCols;

				for (const parent of parentChain) {
					// Match group by key/title (consistent with existing logic)
					const matchIndex = levelCurrent.findIndex((c) => {
						if (!c.children) return false;
						return (
							(parent.key && c.key === parent.key) ||
							(parent.title && c.title === parent.title) ||
							(parent.children &&
								parent.children.length > 0 &&
								c.children?.some((ch) =>
									parent.children?.some((pch) => 'dataIndex' in pch && 'dataIndex' in ch && pch.dataIndex === ch.dataIndex),
								))
						);
					});

					// Find the corresponding parent in the original level for insertion order
					const originalParentIndex = levelOriginal.findIndex((c) => {
						if (!c.children) return false;
						return (
							(parent.key && c.key === parent.key) ||
							(parent.title && c.title === parent.title) ||
							(parent.children &&
								parent.children.length > 0 &&
								c.children?.some((ch) =>
									parent.children?.some((pch) => 'dataIndex' in pch && 'dataIndex' in ch && pch.dataIndex === ch.dataIndex),
								))
						);
					});

					if (matchIndex === -1) {
						// Insert the missing group at the correct position based on original order.
						// We insert an empty group shell; children will be populated later.
						const insertIndex = (() => {
							if (originalParentIndex === -1) return levelCurrent.length;
							// Find nearest visible group/column before it in original order
							for (let i = originalParentIndex - 1; i >= 0; i--) {
								const before = levelOriginal[i];
								const beforeKey = before.key ?? before.title;
								const visibleIdx = levelCurrent.findIndex((c) => (beforeKey ? c.key === beforeKey || c.title === beforeKey : false));
								if (visibleIdx !== -1) return visibleIdx + 1;
							}
							return 0;
						})();

						const groupShell: TableColumn<T> = {
							...parent,
							children: [],
						};

						levelCurrent.splice(insertIndex, 0, groupShell);
					}

					// Descend into the matched (or inserted) group
					const ensuredIndex =
						matchIndex === -1
							? levelCurrent.findIndex((c) => c.children && ((parent.key && c.key === parent.key) || (parent.title && c.title === parent.title)))
							: matchIndex;
					const ensuredGroup = levelCurrent[ensuredIndex];
					if (!ensuredGroup.children) {
						ensuredGroup.children = [];
					}

					// Prepare next iteration levels
					levelCurrent = ensuredGroup.children as TableColumn<T>[];
					const origGroup = levelOriginal[originalParentIndex];
					levelOriginal = origGroup?.children ? (origGroup.children as TableColumn<T>[]) : [];
				}

				return nextCols;
			};

			// Helper to find a column and its parent in original columns
			const findColumnAndParent = (
				cols: TableColumn<T>[],
				targetDataIndex: string,
			): { column: TableColumn<T>; parent: TableColumn<T> | null; parentIndex: number } | null => {
				for (let i = 0; i < cols.length; i++) {
					const col = cols[i];
					if (col.children) {
						// Check if target is in this parent's children
						for (let j = 0; j < col.children.length; j++) {
							const child = col.children[j];
							if (child.dataIndex === targetDataIndex) {
								return { column: child, parent: col, parentIndex: j };
							}
						}
						// Recursively search in children
						const found = findColumnAndParent(col.children, targetDataIndex);
						if (found) return found;
					} else if (col.dataIndex === targetDataIndex) {
						return { column: col, parent: null, parentIndex: i };
					}
				}
				return null;
			};

			// Helper to find insertion position in a flat list based on original order
			const findInsertPositionInList = (
				currentList: TableColumn<T>[],
				targetDataIndex: string,
				originalList: TableColumn<T>[],
			): number => {
				// Find the original index of the target column
				const originalIndex = originalList.findIndex((col) => {
					if (col.children) {
						return col.children.some((child) => 'dataIndex' in child && child.dataIndex === targetDataIndex);
					}
					return 'dataIndex' in col && col.dataIndex === targetDataIndex;
				});

				if (originalIndex === -1) return currentList.length;

				// Get all columns before the target in original order
				const beforeColumns = originalList.slice(0, originalIndex);

				// Find the last visible column before the target
				for (let i = beforeColumns.length - 1; i >= 0; i--) {
					const beforeCol = beforeColumns[i];
					const beforeDataIndex = ('dataIndex' in beforeCol ? beforeCol.dataIndex : undefined) || (beforeCol.children?.[0] && 'dataIndex' in beforeCol.children[0] ? beforeCol.children[0].dataIndex : undefined);

					if (beforeDataIndex) {
						const visibleIndex = currentList.findIndex((col) => {
							if (col.children) {
								return col.children.some((ch) => 'dataIndex' in ch && ch.dataIndex === beforeDataIndex);
							}
							return 'dataIndex' in col && col.dataIndex === beforeDataIndex;
						});

						if (visibleIndex !== -1) {
							return visibleIndex + 1;
						}
					}
				}

				return 0;
			};

			// Helper to update column visibility
			const updateColumnVisibility = (
				cols: TableColumn<T>[],
				originalCols: TableColumn<T>[] = columns,
			): TableColumn<T>[] => {
				if (visible) {
					// When showing a column, find it in original columns
					const context = findColumnAndParent(originalCols, dataIndex);
					if (!context) return cols;

					const { column: originalCol, parent } = context;

					// Check if column already exists
					const exists = cols.some((col) => {
						if (col.children) {
							return col.children.some((child) => 'dataIndex' in child && child.dataIndex === dataIndex);
						}
						return 'dataIndex' in col && col.dataIndex === dataIndex;
					});

					if (exists) return cols;

					if (parent) {
						// Ensure the full group path exists before inserting the child back.
						const parentChain = findParentChain(originalCols, dataIndex) || [parent];
						const ensuredCols = ensureGroupPathExists(cols, originalCols, parentChain);

						// Nested column - find the parent group and insert within it
						return ensuredCols.map((col) => {
							// Check if this is the parent group by comparing key or title
							const isParentGroup =
								col.children &&
								((parent.key && col.key === parent.key) ||
									(parent.title && col.title === parent.title) ||
									// Fallback: check if parent's children match
									(parent.children &&
										parent.children.length > 0 &&
										col.children.some((ch) =>
											parent.children?.some((pch) => 'dataIndex' in pch && 'dataIndex' in ch && pch.dataIndex === ch.dataIndex),
										)));

							if (isParentGroup) {
								// Found the parent group
								const insertIndex = findInsertPositionInList(
									col.children || [],
									dataIndex,
									parent.children || [],
								);
								const newChildren = [...(col.children || [])];
								newChildren.splice(insertIndex, 0, originalCol);
								return { ...col, children: newChildren };
							}
							if (col.children) {
								// Recursively update nested groups
								return { ...col, children: updateColumnVisibility(col.children, originalCols) };
							}
							return col;
						});
					} else {
						// Top-level column - insert at correct position
						const insertIndex = findInsertPositionInList(cols, dataIndex, originalCols);
						const newCols = [...cols];
						newCols.splice(insertIndex, 0, originalCol);
						return newCols;
					}
				} else {
					// When hiding, filter out the column
					return cols
						.map((col) => {
							if (col.children) {
								const updatedChildren = updateColumnVisibility(col.children, originalCols);
								if (updatedChildren.length === 0) return null;
								return {
									...col,
									children: updatedChildren,
								};
							}
							if ('dataIndex' in col && col.dataIndex === dataIndex) {
								return null;
							}
							return col;
						})
						.filter((col) => col !== null) as TableColumn<T>[];
				}
			};

			const updatedColumns = updateColumnVisibility(tableColumn);
			setTableColumn(updatedColumns);
		},
		[tableColumn, setTableColumn, columns],
	);

	// ===================== 🔄 Column Freeze Setup =====================
	// Handle freeze/unfreeze column
	const handleFreezeChange = React.useCallback(
		(dataIndex: string, fixed: 'left' | 'right' | false) => {
			// Helper function to flatten columns and get all dataIndexes in order
			const flattenColumns = (cols: TableColumn<T>[]): string[] => {
				const result: string[] = [];
				cols.forEach((col) => {
					if (col.children) {
						result.push(...flattenColumns(col.children));
					} else if (col.dataIndex) {
						result.push(col.dataIndex as string);
					}
				});
				return result;
			};

			// Helper function to find all frozen columns (both left and right)
			const findFrozenColumns = (cols: TableColumn<T>[]): string[] => {
				const result: string[] = [];
				cols.forEach((col) => {
					if (col.children) {
						result.push(...findFrozenColumns(col.children));
					} else if (col.dataIndex && (col.fixed === 'left' || col.fixed === 'right')) {
						result.push(col.dataIndex as string);
					}
				});
				return result;
			};

			// Get all column dataIndexes in order
			const allDataIndexes = flattenColumns(tableColumn);
			const selectedIndex = allDataIndexes.indexOf(dataIndex);

			// Determine which columns to freeze/unfreeze based on the direction
			let columnsToUpdate: string[] = [];
			if (fixed === 'right' && selectedIndex !== -1) {
				// Freeze selected column and all columns to the right (from selectedIndex to end)
				columnsToUpdate = allDataIndexes.slice(selectedIndex);
			} else if (fixed === 'left' && selectedIndex !== -1) {
				// Freeze selected column and all columns to the left (from start to selectedIndex + 1)
				columnsToUpdate = allDataIndexes.slice(0, selectedIndex + 1);
			} else if (fixed === false) {
				// Unfreeze: reset all frozen columns (both left and right) back to normal
				columnsToUpdate = findFrozenColumns(tableColumn);
			}

			const updateColumnFreeze = (cols: TableColumn<T>[]): TableColumn<T>[] => {
				return cols.map((col) => {
					if (col.children) {
						return {
							...col,
							children: updateColumnFreeze(col.children),
						};
					}
					if (col.dataIndex && columnsToUpdate.includes(col.dataIndex as string)) {
						return {
							...col,
							fixed: fixed || undefined,
						};
					}
					return col;
				});
			};

			const updatedColumns = updateColumnFreeze(tableColumn);
			setTableColumn(updatedColumns);
		},
		[tableColumn, setTableColumn],
	);

	// ===================== 📋 Apply Sort State to Columns =====================
	// Apply sort state to columns for sort indicators
	const columnsWithSort = React.useMemo(() => {
		// Build sort map for multi-sort priority indicators
		const sortMap = new Map<string, { sortType: SORT; priority: number }>();
		if (isMultiSortMode && multiSorts.length > 0) {
			multiSorts.forEach((s, idx) => {
				if (s.sortField && s.sortType) {
					sortMap.set(s.sortField, { sortType: s.sortType, priority: idx + 1 });
				}
			});
		} else if (sort?.sortField && sort?.sortType) {
			sortMap.set(sort.sortField, { sortType: sort.sortType, priority: 1 });
		}

		const showPriority = sortMap.size >= 2;

		// Helper: convert a column's sorter prop to { multiple: N } form for Ant Design
		// multi-sort icon rendering. Without this, Ant Design only shows icons on ONE column.
		const toMultipleSorter = (originalSorter: any, priority: number) => {
			const compare = typeof originalSorter === 'function' ? originalSorter : undefined;
			return compare ? { compare, multiple: priority } : { multiple: priority };
		};

		let unsortedPriority = sortMap.size + 1;

		const applySortToColumns = (cols: TableColumn<T>[]): TableColumn<T>[] => {
			return cols.map((col) => {
				if (col.children) {
					return {
						...col,
						children: applySortToColumns(col.children),
					};
				}

				const dataIndex = col.dataIndex as string;
				const sortInfo = dataIndex ? sortMap.get(dataIndex) : undefined;

				// In multi-sort mode, ALL sortable columns need sorter: { multiple: N }
				// so Ant Design enters multi-sort mode and renders icons on all sorted columns.
				const sorterProp = isMultiSortMode && col.sorter
					? toMultipleSorter(col.sorter, sortInfo ? sortInfo.priority : unsortedPriority++)
					: col.sorter;

				if (sortInfo && col.sorter) {
					// Build title with optional priority badge for multi-sort
					const originalTitle = col.title;
					const sortedTitle = showPriority
						? React.createElement('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 2 } },
							originalTitle as React.ReactNode,
							React.createElement('sup', {
								style: {
									fontSize: 9,
									fontWeight: 700,
									color: 'var(--ant-color-primary)',
									lineHeight: 1,
									marginLeft: 2,
								},
							}, sortInfo.priority),
						)
						: originalTitle;

					return {
						...col,
						sorter: sorterProp,
						title: sortedTitle,
						sortOrder: sortInfo.sortType === SORT.ASC ? 'ascend' : 'descend',
						onHeaderCell: col.onHeaderCell,
					};
				}

				// Clear sort order
				if (col.sorter) {
					return { ...col, sorter: sorterProp, sortOrder: undefined };
				}
				if ('sortOrder' in col && col.sortOrder !== undefined) {
					const { sortOrder, ...rest } = col;
					return rest;
				}
				return col;
			});
		};

		return applySortToColumns(mappedColumns);
	}, [mappedColumns, sort, multiSorts, isMultiSortMode]);

	// ===================== ✅ Validate All Fields =====================
	// Flatten columns to get all editable columns (including nested)
	const flattenColumns = React.useCallback((cols: TableColumn<T>[]): TableColumn<T>[] => {
		const result: TableColumn<T>[] = [];
		cols.forEach((col) => {
			if (col.children && col.children.length > 0) {
				result.push(...flattenColumns(col.children));
			} else if (col.editType && col.dataIndex !== undefined) {
				result.push(col);
			}
		});
		return result;
	}, []);

	// Validate a single rule against a value
	const validateRule = React.useCallback(
		async (rule: Rule, value: any): Promise<string | null> => {
		// Check if rule is a RuleObject (not RuleRender)
		if (typeof rule === 'function') {
			// RuleRender - skip for now, these are typically used for conditional rendering
			return null;
		}

		const ruleObj = rule as RuleObject;

		// Required validation
		if (ruleObj.required) {
			// Check for null, undefined, empty string, empty array
			if (
				value === null ||
				value === undefined ||
				value === '' ||
				(Array.isArray(value) && value.length === 0)
			) {
				return (ruleObj.message as string) || '';
			}
		}

		// Skip other validations if value is empty and not required
		if (
				(value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) &&
			!ruleObj.required
		) {
			return null;
		}

		// Pattern validation
		if (ruleObj.pattern && typeof value === 'string') {
				const pattern = ruleObj.pattern instanceof RegExp ? ruleObj.pattern : new RegExp(ruleObj.pattern);
			if (!pattern.test(value)) {
				return (ruleObj.message as string) || '';
			}
		}

		// Min length validation
		if (ruleObj.min !== undefined && typeof value === 'string' && value.length < ruleObj.min) {
			return (ruleObj.message as string) || '';
		}

		// Max length validation
		if (ruleObj.max !== undefined && typeof value === 'string' && value.length > ruleObj.max) {
			return (ruleObj.message as string) || '';
		}

		// Type validation
		if (ruleObj.type) {
			const valueType = typeof value;
			if (ruleObj.type === 'string' && valueType !== 'string') {
				return (ruleObj.message as string) || '';
			}
			if (ruleObj.type === 'number' && valueType !== 'number' && !Number.isFinite(value)) {
				return (ruleObj.message as string) || '';
			}
			if (ruleObj.type === 'email' && typeof value === 'string') {
				const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailPattern.test(value)) {
					return (ruleObj.message as string) || '';
				}
			}
		}

		// Custom validator function
		const validator = ruleObj.validator;
		if (validator) {
			try {
				// Validator signature: (rule, value, callback?) or (rule, value) => Promise
				// For async validators, they return a Promise
				// For sync validators, they use the callback parameter
				return new Promise<string | null>((resolve) => {
					let callbackCalled = false;
					const callback = (error?: Error | string) => {
						callbackCalled = true;
						if (error) {
							resolve(error instanceof Error ? error.message : String(error));
						} else {
							resolve(null);
						}
					};

					try {
						const result = validator(ruleObj, value, callback);
						// If validator returns a Promise, await it
						if (result instanceof Promise) {
							result
								.then(() => {
									if (!callbackCalled) resolve(null);
								})
								.catch((err) => resolve(err instanceof Error ? err.message : String(err)));
						} else if (!callbackCalled) {
							// If validator doesn't use callback and doesn't return Promise, assume valid
							resolve(null);
						}
						// If validator uses callback, it will call callback
					} catch (error) {
						if (!callbackCalled) {
							resolve(error instanceof Error ? error.message : String(error));
						}
					}
				});
			} catch (error) {
				// Validator rejected/threw - return error message
					return error instanceof Error ? error.message : String(error) || ((ruleObj.message as string) || '');
			}
		}

		return null;
		},
		[],
	);

	// Validate all fields in the table
	const validateAllFields = React.useCallback(async (): Promise<void> => {
		// Get all form data
		const formData = (form.getFieldValue(formTableName) as TableData<T>[]) || [];
		const allFields = fieldsRef.current || [];

		if (allFields.length === 0 || formData.length === 0) {
			return;
		}

		// Flatten columns to get all editable columns
		const editableColumns = flattenColumns(mappedColumns);
		const errorFields: Array<{ name: (string | number)[]; errors: string[] }> = [];

		// Iterate through all rows
		for (let rowIndex = 0; rowIndex < allFields.length; rowIndex++) {
			const rowData = formData[rowIndex];
			if (!rowData) continue;

			// Iterate through all editable columns
			for (const col of editableColumns) {
				if (!col.dataIndex) continue;

				const dataIndex = col.dataIndex as string;
				const fieldPath: (string | number)[] = [formTableName, rowIndex, dataIndex];
				const fieldValue = form.getFieldValue(fieldPath);

				// Get validation rules from column definition
				let rules: Rule[] = [];
				let isRequired = false;

				// Check for overrideEditProps (dynamic rules)
				if (col.editProps?.overrideEditProps) {
					const overrideProps = col.editProps.overrideEditProps(
						form.getFieldsValue(),
						rowIndex,
						form,
						[dataIndex],
					);
					isRequired = overrideProps?.required === true || col.editProps?.required === true;
					rules = overrideProps?.rules || col.editProps?.rules || [];
				} else {
					isRequired = col.editProps?.required === true;
					rules = col.editProps?.rules || [];
				}

				// Build rules array (required rule first, then custom rules)
				const allRules: Rule[] = [];
				if (isRequired) {
					allRules.push({ required: true, message: m(MESSAGE_CODES.COM000002) });
				}
				allRules.push(...rules);

				// Validate each rule
				const fieldErrors: string[] = [];
				for (const rule of allRules) {
					const error = await validateRule(rule, fieldValue);
					if (error) {
						fieldErrors.push(error);
					}
				}

				// Collect errors
				if (fieldErrors.length > 0) {
					errorFields.push({
						name: fieldPath,
						errors: fieldErrors,
					});
				}
			}
		}

		// Track rows with errors (use ref for fast lookups, update version to trigger re-render)
		rowsWithErrors.current.clear();
		errorFields.forEach((errorField) => {
			// Extract row index from field path: [formTableName, rowIndex, dataIndex]
			const rowIndex = errorField.name[1] as number;
			if (typeof rowIndex === 'number' && !isNaN(rowIndex)) {
				rowsWithErrors.current.add(rowIndex);
			}
		});

		// Update version to trigger re-render only when validation completes
		setErrorRowsVersion((prev) => prev + 1);

		// Throw error if validation fails
		if (errorFields.length > 0) {
			// Throw error matching Ant Design's error format
			const error = new Error('Validation failed');
			(error as any).errorFields = errorFields;
			throw error;
		} else {
			// Clear error rows if validation passes
			rowsWithErrors.current.clear();
		}
	}, [form, formTableName, mappedColumns, flattenColumns, validateRule, m]);

	return {
		// Params first
		t,
		tableRef,
		fieldsRef,
		addRowRef,
		removeRowRef,
		tableHeight: isNaN(tableHeight!) ? 120 : tableHeight,
		tableWidth: isNaN(tableWidth!) ? 120 : tableWidth,
		mappedColumns,
		columnsWithSort,
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
		// Functions later
		showMenu,
		hideMenu,
		showHeaderMenu,
		hideHeaderMenu,
		setTableColumn,
		scrollToRow,
		generateKey,
		renderSummary,
		setActiveEditingCell,
		handleTabNavigate,
		canTabNavigate,
		handleCellKeyDown,
		setFocusedCell,
		focusedCellRef,
		dataFieldSourceRef,
		handleSortChange,
		handleTableSort,
		handleRemoveSort,
		handleClearAllSorts,
		hasUnsavedChanges,
		handleSortChangeWithCheck,
		handleColumnReorder,
		handleResetToDefault,
		handleColumnVisibilityChange,
		handleFreezeChange,
		toggleFullscreen,
		validateAllFields,
		rowsWithErrors,
		errorRowsVersion,
		showAdvanceFilter,
		handleAdvanceFilterToggle,
		hasFilterableColumns,
		handleFilterFormChange,
		resetDeletedRows,
		filterFormInstance,
	};
}
