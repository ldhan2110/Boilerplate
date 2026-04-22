/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useAppTranslate, useDebounce, useIsMount } from '@/hooks';
import { type DynamicFilterDto, type TableColumn, type Sort, type MultiSort, SORT } from '@/types';
import { useResizeHandler } from './useResizeHandler';
import { STABLE_TABLE_SCROLL_DEPS, useTableScroll } from './useTableScroll';
import { toDynamicFilterList, sortDataLocally, multiSortDataLocally } from '../utils';
import { useContextMenu } from './useContextMenu';
import { useHeaderMenu } from './useHeaderMenu';
import { useFullscreen } from './useFullScreen';
import { ToggleWithLabel } from '@/components';

export function useTableHooks<T>(
	columns: TableColumn<T>[],
	data: T[],
	headerOffset?: number,
	isTree?: boolean,
	tableStateSort?: Sort | undefined,
	onFilterTableChange?: (filterList: DynamicFilterDto[]) => void,
	onSortChange?: (sortField: string | undefined, sortType: SORT | undefined) => void,
	sortMode?: 'local' | 'remote',
	onMultiSortChange?: (sorts: MultiSort) => void,
) {
	// ===================== 🚀 Hooks & State Setup =====================
	const [expandedKeys, setExpandedKeys] = React.useState<React.Key[]>([]);
	const { t } = useAppTranslate();
	const isMount = useIsMount();
	const [tableColumn, setTableColumn] = React.useState<TableColumn<T>[]>([]);
	const infiniteLoadingRef = React.useRef(false);
	const [sort, setSort] = React.useState<Sort | undefined>(tableStateSort);
	const [multiSorts, setMultiSorts] = React.useState<MultiSort>([]);
	const isMultiSortMode = !!onMultiSortChange;

	// Sync sort state with tableState.sort when it changes
	React.useEffect(() => {
		if (tableStateSort !== undefined) {
			setSort(tableStateSort);
		}
	}, [tableStateSort]);

	// ===================== 📊 Full Screen Hooks Setup =====================
	const { containerRef, isFullscreen, toggleFullscreen } = useFullscreen();

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

	// ===================== 📏 Table Size Setup =====================
	const tableHeight = useTableScroll(STABLE_TABLE_SCROLL_DEPS, headerOffset ?? 290, isFullscreen);
	const tableWidth = React.useMemo(() => {
		return columns?.reduce(
			(accumulator, currentValue) => accumulator + (currentValue.width as number),
			0,
		);
	}, [columns]);

	// ===================== 📋 Filter Table Events Setup =====================
	const handleFilterFormChange = useDebounce((_changedValues, allValues) => {
		const filterValue = toDynamicFilterList(allValues);
		onFilterTableChange?.(filterValue);
	});

	// ===================== 🔄 Sort State Setup =====================
	// Handle sort change (from context menu or table header)
	const handleSortChange = React.useCallback(
		(sortField: string | undefined, sortType: SORT | undefined) => {
			if (isMultiSortMode) {
				// Multi-sort: manage the sorts array
				setMultiSorts((prev) => {
					let next: MultiSort;

					if (!sortField) {
						// No field specified — clear all sorts
						next = [];
					} else if (!sortType) {
						// Field specified but no direction — Ant Design cycled to "cleared".
						// Only remove THIS column, not all sorts.
						next = prev.filter((s) => s.sortField !== sortField);
					} else {
						const existingIdx = prev.findIndex((s) => s.sortField === sortField);
						if (existingIdx >= 0) {
							const existing = prev[existingIdx];
							if (existing.sortType === sortType) {
								// Same direction clicked — cycle to next: ASC→DESC, DESC→removed
								if (sortType === SORT.ASC) {
									next = prev.map((s, i) =>
										i === existingIdx ? { sortField, sortType: SORT.DESC } : s,
									);
								} else {
									// Remove from list
									next = prev.filter((_, i) => i !== existingIdx);
								}
							} else {
								// Different direction — update in-place
								next = prev.map((s, i) =>
									i === existingIdx ? { sortField, sortType } : s,
								);
							}
						} else {
							// New column — append to sort list
							next = [...prev, { sortField, sortType }];
						}
					}

					// Also update legacy sort for backwards compat
					setSort(next.length > 0 ? next[0] : undefined);

					if (sortMode !== 'local') {
						onMultiSortChange?.(next);
					}
					return next;
				});
			} else {
				// Single-sort: existing behavior
				const newSort: Sort | undefined = sortField && sortType
					? { sortField, sortType }
					: undefined;
				setSort(newSort);
				if (sortMode !== 'local') {
					onSortChange?.(sortField, sortType);
				}
			}
		},
		[onSortChange, onMultiSortChange, sortMode, isMultiSortMode],
	);

	// Handle removing a single column from multi-sort
	const handleRemoveSort = React.useCallback(
		(sortField: string) => {
			setMultiSorts((prev) => {
				const next = prev.filter((s) => s.sortField !== sortField);
				setSort(next.length > 0 ? next[0] : undefined);
				if (sortMode !== 'local') {
					onMultiSortChange?.(next);
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

	// Apply local sorting if sortMode is 'local'
	const sortedData = React.useMemo(() => {
		if (sortMode === 'local') {
			if (isMultiSortMode && multiSorts.length > 0) {
				return multiSortDataLocally(data as any[], multiSorts);
			}
			if (sort) {
				return sortDataLocally(data as any[], sort);
			}
		}
		return data;
	}, [data, sort, multiSorts, sortMode, isMultiSortMode]);

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

	// ===================== 🔄 Reset to Default Setup =====================
	// Handle reset to default configuration
	const handleResetToDefault = React.useCallback(() => {
		// Reset columns back to original configuration
		setTableColumn(columns);
		// Reset sort to undefined
		handleSortChange(undefined, undefined);
	}, [columns, setTableColumn, handleSortChange]);

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

	// ===================== 🔍 Advance Filter Toggle =====================
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
				}
			} else {
				const s = Array.isArray(sorter) ? sorter[0] : sorter;
				handleSortChange(
					s?.field as string,
					s?.order === 'ascend' ? SORT.ASC : s?.order === 'descend' ? SORT.DESC : undefined,
				);
			}
		},
		[isMultiSortMode, handleSortChange, onMultiSortChange, sortMode],
	);

	// Apply sort state to columns for sort indicators and translate titles
	const columnsWithSort = React.useMemo(() => {
		// Build a map from sortField -> { sortType, priority } for multi-sort
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

				// Translate title if it's a string
				const translatedTitle = typeof col.title === 'string' ? t(col.title) : col.title;

				const dataIndex = col.dataIndex as string;
				const sortInfo = dataIndex ? sortMap.get(dataIndex) : undefined;

				// In multi-sort mode, ALL sortable columns need sorter: { multiple: N }
				// so Ant Design enters multi-sort mode and renders icons on all sorted columns.
				const sorterProp = isMultiSortMode && col.sorter
					? toMultipleSorter(col.sorter, sortInfo ? sortInfo.priority : unsortedPriority++)
					: col.sorter;

				// If this column has valueType 'toggle' and no explicit render provided, provide a default render
				if (col.valueType === 'toggle' && !col.render) {
					return {
						...col,
						sorter: sorterProp,
						title: translatedTitle,
						sortOrder: sortInfo
							? sortInfo.sortType === SORT.ASC ? 'ascend' : 'descend'
							: undefined,
						render: (_value: any, record: any, rowIndex?: number) => {
							const val = record[dataIndex];
							const busy = false;
							const onChange = (checked: boolean) => {
								if (col.editProps?.onChange) {
									const payload = checked ? 'Y' : 'N';
									try {
										(col.editProps.onChange as any)?.(payload, record, rowIndex, dataIndex as any);
									} catch (e) {
										// swallow
									}
								}
							};
							return React.createElement(ToggleWithLabel, { value: val, onChange: onChange, busy: busy, ariaLabel: `${dataIndex} toggle` });
						},
					};
				}

				if (sortInfo && col.sorter) {
					// Build title with optional priority badge for multi-sort
					const sortedTitle = showPriority
						? React.createElement('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 2 } },
							translatedTitle as React.ReactNode,
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
						: translatedTitle;

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
					return { ...col, sorter: sorterProp, title: translatedTitle, sortOrder: undefined };
				}
				if ('sortOrder' in col && col.sortOrder !== undefined) {
					const { sortOrder, ...rest } = col;
					return { ...rest, title: translatedTitle };
				}

				return { ...col, title: translatedTitle };
			});
		};

		return applySortToColumns(mappedColumns);
	}, [mappedColumns, sort, multiSorts, isMultiSortMode, t]);

	const flattenKeys = React.useCallback((nodes: any[]) => {
		let keys: React.Key[] = [];
		nodes.forEach((node, index) => {
			keys.push(node.key ?? index);
			if (node.children) {
				keys = keys.concat(flattenKeys(node.children));
			}
		});
		return keys;
	}, []);

	React.useEffect(() => {
		if (isTree && data) {
			setExpandedKeys(flattenKeys(data));
		}
	}, [data, flattenKeys, isTree]);

	// Seed column definitions on first mount only. Do not depend on `data`: refetch/pagination would
	// re-run this effect and reset column state (width/order/visibility), causing visible "jumping".
	React.useEffect(() => {
		if (isMount) {
			setTableColumn(columns);
		}
	}, [columns, isMount]);

	return {
		t,
		tableHeight: isNaN(tableHeight!) ? 120 : tableHeight,
		tableWidth: isNaN(tableWidth!) ? 120 : tableWidth,
		mappedColumns,
		columnsWithSort,
		tableColumn,
		expandedKeys,
		isOpenMenu,
		menuPosition,
		selectedMenuRecord,
		isOpenHeaderMenu,
		headerMenuPosition,
		selectedHeaderColumn,
		containerRef,
		isFullscreen,
		infiniteLoadingRef,
		sort,
		multiSorts,
		sortedData: sortMode === 'local' ? sortedData : data,
		showAdvanceFilter,
		hasFilterableColumns,
		setExpandedKeys,
		setTableColumn,
		handleFilterFormChange,
		handleAdvanceFilterToggle,
		showMenu,
		hideMenu,
		showHeaderMenu,
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
	};
}
