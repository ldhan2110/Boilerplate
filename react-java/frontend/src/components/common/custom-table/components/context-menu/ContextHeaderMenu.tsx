/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Dropdown, Checkbox, type MenuProps } from 'antd';
import { useAppTranslate } from '@/hooks';
import {
	EyeOutlined,
	EyeInvisibleOutlined,
	SortAscendingOutlined,
	SortDescendingOutlined,
	ClearOutlined,
	PushpinOutlined,
	PushpinFilled,
	HolderOutlined,
	ReloadOutlined,
	FilterOutlined,
	FilterFilled,
} from '@ant-design/icons';
import type { TableColumn, MultiSort } from '@/types';
import { SORT } from '@/types';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { verticalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { arrayMove } from '@dnd-kit/sortable';

type ContextHeaderMenuProps<T> = {
	isOpen: boolean;
	position: {
		x: number;
		y: number;
	};
	column: TableColumn<T> | null;
	columns: TableColumn<T>[];
	allColumns?: TableColumn<T>[];
	onColumnVisibilityChange?: (dataIndex: string, visible: boolean) => void;
	onSortChange?: (sortField: string | undefined, sortType: SORT | undefined) => void;
	onFreezeChange?: (dataIndex: string, fixed: 'left' | 'right' | false) => void;
	onColumnReorder?: (reorderedColumns: TableColumn<T>[]) => void;
	onResetToDefault?: () => void;
	currentSort?: {
		sortField: string | undefined;
		sortType: SORT | undefined;
	};
	currentSorts?: MultiSort;
	onRemoveSort?: (sortField: string) => void;
	onClearAllSorts?: () => void;
	showAdvanceFilter?: boolean;
	onAdvanceFilterToggle?: () => void;
	hasFilterableColumns?: boolean;
	hideMenu: () => void;
};

// Sortable menu item component
type SortableMenuItemProps<T> = {
	column: TableColumn<T>;
	isVisible: boolean;
	onVisibilityChange: (dataIndex: string, visible: boolean) => void;
};

const SortableMenuItem = <T,>({ column, isVisible, onVisibilityChange }: SortableMenuItemProps<T>) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: column.dataIndex as string,
	});

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		display: 'flex',
		alignItems: 'center',
		gap: 8,
		cursor: 'pointer',
		width: '100%',
	};

	return (
		<div ref={setNodeRef} style={style}>
			<span
				{...attributes}
				{...listeners}
				style={{
					cursor: isDragging ? 'grabbing' : 'grab',
					display: 'inline-flex',
					alignItems: 'center',
					color: '#999',
					padding: '4px 2px',
					touchAction: 'none',
					marginRight: '4px',
					transition: 'color 0.2s',
				}}
				onClick={(e) => e.stopPropagation()}
				onMouseEnter={(e) => {
					e.currentTarget.style.color = 'var(--ant-color-primary)';
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.color = '#999';
				}}
			>
				<HolderOutlined style={{ fontSize: 14 }} />
			</span>
			<div
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onVisibilityChange(column.dataIndex as string, !isVisible);
				}}
				style={{ flex: 1, cursor: 'pointer' }}
			>
				<Checkbox
					checked={isVisible}
					onChange={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onVisibilityChange(column.dataIndex as string, e.target.checked);
					}}
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
					}}
				>
					{column.title as string}
				</Checkbox>
			</div>
		</div>
	);
};

export const ContextHeaderMenu = <T,>({
	isOpen,
	position,
	column,
	columns,
	allColumns,
	currentSort,
	onColumnVisibilityChange,
	onSortChange,
	onFreezeChange,
	onColumnReorder,
	onResetToDefault,
	currentSorts,
	onRemoveSort,
	onClearAllSorts,
	showAdvanceFilter,
	onAdvanceFilterToggle,
	hasFilterableColumns,
	hideMenu,
}: ContextHeaderMenuProps<T>) => {
	const { t } = useAppTranslate();

	// Flatten columns to get all available columns for the show/hide menu
	const flattenColumns = (cols: TableColumn<T>[]): TableColumn<T>[] => {
		const result: TableColumn<T>[] = [];
		cols.forEach((col) => {
			if (col.children) {
				result.push(...flattenColumns(col.children));
			} else if (col.dataIndex) {
				result.push(col);
			}
		});
		return result;
	};

	// Prefer rendering "Show/Hide" menu from the full set of columns.
	// The `columns` prop reflects current visible columns; using it as the source will make
	// hidden columns disappear from the submenu (undesired).
	const getAllAvailableColumns = React.useCallback((): TableColumn<T>[] => {
		if (!allColumns && !columns) return [];
		return allColumns ? flattenColumns(allColumns) : flattenColumns(columns);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [allColumns, columns]);

	// Merge an ordering source (usually visible columns) into a stable base list
	// without dropping items that are missing from the ordering source.
	const mergeColumnsByOrder = React.useCallback(
		(
			base: TableColumn<T>[],
			orderSource: TableColumn<T>[] | undefined,
			fallbackOrder: TableColumn<T>[],
		): TableColumn<T>[] => {
			const order = orderSource && orderSource.length > 0 ? orderSource : undefined;
			if (!order) return base;

			const orderIndex = new Map<string, number>();
			order.forEach((c, idx) => {
				if (c.dataIndex) orderIndex.set(c.dataIndex as string, idx);
			});

			// Keep "hidden" columns in the same positions as `base`.
			// Only reorder the subset of columns that are present in the `orderSource` list
			// (typically the currently visible columns).
			const baseDataIndexes = base.map((c) => (c.dataIndex ? (c.dataIndex as string) : undefined));
			const visibleSlots: number[] = [];
			const visibleColumnsInBase: TableColumn<T>[] = [];

			baseDataIndexes.forEach((dataIndex, idx) => {
				if (!dataIndex) return;
				if (orderIndex.has(dataIndex)) {
					visibleSlots.push(idx);
					visibleColumnsInBase.push(base[idx]);
				}
			});

			// Reorder visible columns according to the orderSource index
			const reorderedVisible = [...visibleColumnsInBase].sort((a, b) => {
				const aKey = a.dataIndex as string;
				const bKey = b.dataIndex as string;
				return (orderIndex.get(aKey) ?? 0) - (orderIndex.get(bKey) ?? 0);
			});

			// Place reordered visible columns back into the same slots.
			const result = [...base];
			visibleSlots.forEach((slotIdx, i) => {
				result[slotIdx] = reorderedVisible[i];
			});

			// Note: `fallbackOrder` remains in the signature to preserve existing API usage.
			// It can be used later if we need additional tie-breaking behavior.
			void fallbackOrder;

			return result;
		},
		[],
	);

	// Use allColumns if provided (original columns), otherwise use current columns
	const [availableColumns, setAvailableColumns] = React.useState<TableColumn<T>[]>(() => {
		if (!allColumns && !columns) return [];
		return allColumns ? flattenColumns(allColumns) : flattenColumns(columns);
	});

	// Track if we just reordered to prevent useEffect from resetting
	const isReorderingRef = React.useRef(false);

	// Update availableColumns when allColumns or columns change (but not if we just reordered)
	React.useEffect(() => {
		// Skip update if we just reordered - the reorder handler will update the state
		if (isReorderingRef.current) {
			isReorderingRef.current = false;
			return;
		}

		if (!allColumns && !columns) {
			setAvailableColumns([]);
			return;
		}

		// Base list should always contain all possible columns so unchecked items remain in the submenu.
		const baseAll = getAllAvailableColumns();
		const visibleOrderSource = columns ? flattenColumns(columns) : [];
		const merged = mergeColumnsByOrder(baseAll, visibleOrderSource, availableColumns);

		// Only update if the order or membership actually changed (prevents unnecessary resets)
		const currentDataIndexes = availableColumns.map((col) => col.dataIndex).join(',');
		const mergedDataIndexes = merged.map((col) => col.dataIndex).join(',');

		// If the order is the same, don't reset (prevents unnecessary resets)
		if (currentDataIndexes === mergedDataIndexes && availableColumns.length === merged.length) {
			return;
		}

		setAvailableColumns(merged);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [allColumns, columns, getAllAvailableColumns, mergeColumnsByOrder]);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 1,
			},
		}),
	);

	// Calculate visibleColumns before early return to maintain hook order
	const visibleColumns = React.useMemo(() => {
		return availableColumns.filter((col) => {
			// Check if column is visible in the current columns array
			return columns.some((c) => {
				if (c.children) {
					return c.children.some((child) => {
						return 'dataIndex' in child && 'dataIndex' in col && (child.dataIndex as string) === (col.dataIndex as string);
					});
				}
				return 'dataIndex' in c && 'dataIndex' in col && (c.dataIndex as string) === (col.dataIndex as string);
			});
		});
	}, [availableColumns, columns]);

	// Create sortable menu items - must be before early return to maintain hook order
	const sortableMenuItems = React.useMemo(() => {
		return availableColumns.map((col) => {
			const isVisible = visibleColumns.some((vc) => vc.dataIndex === col.dataIndex);
			return {
				key: `column_${col.dataIndex}`,
				label: (
					<SortableMenuItem
						column={col}
						isVisible={isVisible}
						onVisibilityChange={onColumnVisibilityChange || (() => {})}
					/>
				),
			};
		});
	}, [availableColumns, visibleColumns, onColumnVisibilityChange]);

	if (!column || !column.dataIndex) {
		return null;
	}

	const columnDataIndex = column.dataIndex as string;
	const isColumnVisible = columns.some((col) => {
		if (col.children) {
			return col.children.some((child) => {
				return 'dataIndex' in child && (child.dataIndex as string) === columnDataIndex;
			});
		}
		return 'dataIndex' in col && (col.dataIndex as string) === columnDataIndex;
	});

	const isMultiSortMode = currentSorts !== undefined && currentSorts.length >= 0;
	const multiSortIndex = isMultiSortMode
		? currentSorts!.findIndex((s) => s.sortField === columnDataIndex)
		: -1;
	const isCurrentlySorted = isMultiSortMode
		? multiSortIndex >= 0
		: currentSort?.sortField === columnDataIndex && currentSort?.sortType !== undefined;
	const activeSortCount = isMultiSortMode ? currentSorts!.length : (isCurrentlySorted ? 1 : 0);
	const nextSortPosition = isMultiSortMode ? currentSorts!.length + 1 : 1;
	const isFrozen = column.fixed === 'left' || column.fixed === 'right';

	// Helper to find all columns in the same group as a given column
	const findGroupColumns = (dataIndex: string, cols: TableColumn<T>[]): string[] => {
		const result: string[] = [];
		
		const findInColumns = (colsToSearch: TableColumn<T>[]): boolean => {
			for (const col of colsToSearch) {
				if (col.children) {
					// Check if the target is in this group
					const hasTarget = col.children.some((child) => 'dataIndex' in child && child.dataIndex === dataIndex);
					if (hasTarget) {
						// Add all columns in this group
						col.children.forEach((child) => {
							if ('dataIndex' in child && child.dataIndex) {
								result.push(child.dataIndex as string);
							}
						});
						return true;
					}
					// Recursively search in nested groups
					if (findInColumns(col.children)) {
						return true;
					}
				} else if ('dataIndex' in col && col.dataIndex === dataIndex) {
					// Top-level column, no group
					result.push(dataIndex);
					return true;
				}
			}
			return false;
		};

		findInColumns(cols);
		return result.length > 0 ? result : [dataIndex];
	};

	// Handle drag end for column reordering
	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (!over || active.id === over.id) {
			return;
		}

		const oldIndex = availableColumns.findIndex((col) => col.dataIndex === active.id);
		const newIndex = availableColumns.findIndex((col) => col.dataIndex === over.id);

		if (oldIndex !== -1 && newIndex !== -1) {
			// Find all columns in the same group as the active column
			const activeGroupColumns = allColumns
				? findGroupColumns(active.id as string, allColumns)
				: [active.id as string];

			// If moving a grouped column, we need to move all columns in that group
			if (activeGroupColumns.length > 1) {
				// Find the indices of all columns in the group
				const groupIndices = activeGroupColumns
					.map((dataIndex) => availableColumns.findIndex((col) => col.dataIndex === dataIndex))
					.filter((idx) => idx !== -1)
					.sort((a, b) => a - b);

				if (groupIndices.length > 0) {
					// Move the entire group to the new position
					const firstGroupIndex = groupIndices[0];
					const targetIndex = newIndex > firstGroupIndex ? newIndex + 1 - groupIndices.length : newIndex;

					// Remove all group columns
					const columnsToMove = groupIndices.map((idx) => availableColumns[idx]);
					const remainingColumns = availableColumns.filter(
						(_, idx) => !groupIndices.includes(idx),
					);

					// Insert at new position
					const newColumns = [
						...remainingColumns.slice(0, targetIndex),
						...columnsToMove,
						...remainingColumns.slice(targetIndex),
					];

					// Mark that we're reordering to prevent useEffect from resetting
					isReorderingRef.current = true;
					setAvailableColumns(newColumns);

					// Update the original structure
					if (allColumns) {
						const reorderedAllColumns = reorderColumnsInOriginalStructure(
							allColumns,
							active.id as string,
							over.id as string,
						);
						onColumnReorder?.(reorderedAllColumns);
					} else {
						onColumnReorder?.(newColumns);
					}
					return;
				}
			}

			// Simple reorder for non-grouped columns
			const reorderedColumns = arrayMove(availableColumns, oldIndex, newIndex);
			
			// Mark that we're reordering to prevent useEffect from resetting
			isReorderingRef.current = true;
			setAvailableColumns(reorderedColumns);

			// Find and move grouped/nested columns together
			if (allColumns) {
				const reorderedAllColumns = reorderColumnsInOriginalStructure(
					allColumns,
					active.id as string,
					over.id as string,
				);
				onColumnReorder?.(reorderedAllColumns);
			} else {
				onColumnReorder?.(reorderedColumns);
			}
		}
	};

	// Helper function to reorder columns in the original nested structure
	const reorderColumnsInOriginalStructure = (
		cols: TableColumn<T>[],
		activeDataIndex: string,
		overDataIndex: string,
	): TableColumn<T>[] => {
		// Find the parent groups containing active and over columns
		const findColumnAndParent = (
			colsToSearch: TableColumn<T>[],
			targetDataIndex: string,
		): { column: TableColumn<T>; parent: TableColumn<T> | null; parentIndex: number; groupIndex: number } | null => {
			for (let i = 0; i < colsToSearch.length; i++) {
				const col = colsToSearch[i];
				if (col.children) {
					// Check if target is in this parent's children
					for (let j = 0; j < col.children.length; j++) {
						const child = col.children[j];
						if (child.dataIndex === targetDataIndex) {
							return { column: child, parent: col, parentIndex: j, groupIndex: i };
						}
					}
					// Recursively search in children
					const found = findColumnAndParent(col.children, targetDataIndex);
					if (found) {
						found.groupIndex = i;
						return found;
					}
				} else if (col.dataIndex === targetDataIndex) {
					return { column: col, parent: null, parentIndex: i, groupIndex: i };
				}
			}
			return null;
		};

		const activeContext = findColumnAndParent(cols, activeDataIndex);
		const overContext = findColumnAndParent(cols, overDataIndex);

		if (!activeContext || !overContext) {
			return cols;
		}

		// If both columns are in the same parent group, reorder within that group
		if (
			activeContext.parent &&
			overContext.parent &&
			activeContext.groupIndex === overContext.groupIndex
		) {
			const parent = cols[activeContext.groupIndex];
			if (parent.children) {
				const activeChildIndex = parent.children.findIndex((c) => 'dataIndex' in c && c.dataIndex === activeDataIndex);
				const overChildIndex = parent.children.findIndex((c) => 'dataIndex' in c && c.dataIndex === overDataIndex);
				if (activeChildIndex !== -1 && overChildIndex !== -1) {
					const newChildren = arrayMove(parent.children, activeChildIndex, overChildIndex);
					const newCols = [...cols];
					newCols[activeContext.groupIndex] = { ...parent, children: newChildren };
					return newCols;
				}
			}
		}

		// If columns are in different groups or one is top-level, move the entire group
		// For simplicity, we'll move the parent group if it exists, otherwise move the column itself
		if (activeContext.parent && overContext.parent) {
			// Both are in groups - move the entire parent groups
			const newCols = [...cols];
			const activeGroup = newCols[activeContext.groupIndex];
			const overGroup = newCols[overContext.groupIndex];
			newCols[activeContext.groupIndex] = overGroup;
			newCols[overContext.groupIndex] = activeGroup;
			return newCols;
		} else if (activeContext.parent || overContext.parent) {
			// One is in a group, one is not - move the group/column
			const newCols = [...cols];
			const activeItem = newCols[activeContext.groupIndex];
			const overItem = newCols[overContext.groupIndex];
			newCols[activeContext.groupIndex] = overItem;
			newCols[overContext.groupIndex] = activeItem;
			return newCols;
		} else {
			// Both are top-level columns - simple reorder
			return arrayMove(cols, activeContext.groupIndex, overContext.groupIndex);
		}
	};

	const menuItems: MenuProps['items'] = [
		{
			key: 'show_hide_columns',
			label: (
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					{isColumnVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
					<span>{t('Show/Hide Columns')}</span>
				</div>
			),
			popupClassName: 'sortable-columns-submenu',
			children: sortableMenuItems,
		},
		{
			key: 'show_advance_filter',
			label: (
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					{showAdvanceFilter ? <FilterFilled /> : <FilterOutlined />}
					<span>{t('Show Advance Filter')}</span>
				</div>
			),
			disabled: !hasFilterableColumns,
		},
		{ type: 'divider' as const },
		{
			key: 'sort_asc',
			label: (
				<div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
					<span>{t('Sort A-Z')}</span>
					{isMultiSortMode && !isCurrentlySorted && column.sorter && (
						<span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--ant-color-text-quaternary)', background: 'var(--ant-color-fill-tertiary)', padding: '1px 6px', borderRadius: 3 }}>
							adds as #{nextSortPosition}
						</span>
					)}
				</div>
			),
			icon: <SortAscendingOutlined />,
			disabled: !column.sorter,
		},
		{
			key: 'sort_desc',
			label: (
				<div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
					<span>{t('Sort Z-A')}</span>
					{isMultiSortMode && !isCurrentlySorted && column.sorter && (
						<span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--ant-color-text-quaternary)', background: 'var(--ant-color-fill-tertiary)', padding: '1px 6px', borderRadius: 3 }}>
							adds as #{nextSortPosition}
						</span>
					)}
				</div>
			),
			icon: <SortDescendingOutlined />,
			disabled: !column.sorter,
		},
		{
			key: 'unsort',
			label: t('Remove from Sort'),
			icon: <ClearOutlined />,
			disabled: !isCurrentlySorted,
		},
		...(isMultiSortMode
			? [
					{
						key: 'clear_all_sorts',
						label: (
							<div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
								<span>{t('Clear All Sorts')}</span>
								{activeSortCount > 0 && (
									<span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--ant-color-text-quaternary)', background: 'var(--ant-color-fill-tertiary)', padding: '1px 6px', borderRadius: 3 }}>
										{activeSortCount} active
									</span>
								)}
							</div>
						),
						icon: <ClearOutlined />,
						disabled: activeSortCount === 0,
					},
				]
			: []),
		{ type: 'divider' },
		{
			key: 'freeze_left',
			label: t('Freeze Left'),
			icon: <PushpinOutlined />,
			disabled: column.fixed === 'left',
		},
		{
			key: 'freeze_right',
			label: t('Freeze Right'),
			icon: <PushpinOutlined />,
			disabled: column.fixed === 'right',
		},
		{
			key: 'unfreeze',
			label: t('Unfreeze'),
			icon: <PushpinFilled />,
			disabled: !isFrozen,
		},
		{ type: 'divider' },
		{
			key: 'reset_to_default',
			label: t('Reset to Default'),
			icon: <ReloadOutlined />,
		},
	];

	const handleMenuClick: MenuProps['onClick'] = ({ key, domEvent }) => {
		// Ignore clicks on submenu items (column checkboxes)
		if (key.toString().startsWith('column_')) {
			domEvent?.stopPropagation();
			domEvent?.preventDefault();
			return;
		}

		switch (key) {
			case 'show_advance_filter':
				onAdvanceFilterToggle?.();
				break;
			case 'sort_asc':
				onSortChange?.(columnDataIndex, SORT.ASC);
				break;
			case 'sort_desc':
				onSortChange?.(columnDataIndex, SORT.DESC);
				break;
			case 'unsort':
				if (isMultiSortMode && isCurrentlySorted) {
					onRemoveSort?.(columnDataIndex);
				} else {
					onSortChange?.(undefined, undefined);
				}
				break;
			case 'clear_all_sorts':
				onClearAllSorts?.();
				break;
			case 'freeze_left':
				onFreezeChange?.(columnDataIndex, 'left');
				break;
			case 'freeze_right':
				onFreezeChange?.(columnDataIndex, 'right');
				break;
			case 'unfreeze':
				onFreezeChange?.(columnDataIndex, false);
				break;
			case 'reset_to_default':
				onResetToDefault?.();
				break;
		}
		hideMenu();
	};

	return (
		<Dropdown
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) {
					hideMenu();
				}
			}}
			menu={{
				items: menuItems,
				onClick: handleMenuClick,
			}}
			trigger={['click']}
			placement="bottomLeft"
			popupRender={(menu) => {
				// Wrap the menu in DndContext for the submenu items
				return (
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={availableColumns.map((col) => col.dataIndex as string)}
							strategy={verticalListSortingStrategy}
						>
							{menu}
						</SortableContext>
					</DndContext>
				);
			}}
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
