/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import type { TableColumn, TableData } from '@/types';

/**
 * Keyboard navigation hook for read-only CustomTable.
 * Provides Tab/Arrow navigation, focus highlight, and Ctrl+C copy.
 */
export function useTableNavigation<T>(
	columns: TableColumn<T>[],
	data: TableData<T>[],
) {
	const focusedCellRef = React.useRef<string | null>(null);
	const cellClipboardRef = React.useRef<string>('');

	// Ordered list of all navigable column dataIndex values
	const navigableColumnKeys = React.useMemo(() => {
		const collect = (cols: TableColumn<T>[]): string[] =>
			cols.flatMap((col) => {
				if (col.children?.length) return collect(col.children);
				return col.dataIndex !== undefined ? [String(col.dataIndex)] : [];
			});
		return collect(columns);
	}, [columns]);

	// Set focused cell — toggles .cell-focused CSS class via DOM (zero re-render)
	const setFocusedCell = React.useCallback((cellKey: string | null) => {
		const prev = focusedCellRef.current;
		focusedCellRef.current = cellKey;

		if (prev) {
			const prevEl = document.querySelector(`[data-cell-key="${prev}"]`) as HTMLElement;
			prevEl?.classList.remove('cell-focused');
		}
		if (cellKey) {
			const nextEl = document.querySelector(`[data-cell-key="${cellKey}"]`) as HTMLElement;
			nextEl?.classList.add('cell-focused');
			nextEl?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
		}
	}, []);

	// Click outside handler — clear focus when clicking outside cells
	React.useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (target.closest('[data-cell-key]')) return;
			if (target.closest('.ant-table-selection-column')) return;
			setFocusedCell(null);
		};

		const timeoutId = setTimeout(() => {
			document.addEventListener('mousedown', handleClickOutside);
		}, 100);

		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [setFocusedCell]);

	// Get next/previous cell key (horizontal)
	const getNextCellKey = React.useCallback(
		(currentKey: string, direction: 1 | -1, wrap: boolean = true) => {
			const [rowIndexStr, ...dataIndexParts] = currentKey.split('-');
			const rowIndex = parseInt(rowIndexStr, 10);
			const dataIndex = dataIndexParts.join('-');

			if (
				Number.isNaN(rowIndex) ||
				!dataIndex ||
				!navigableColumnKeys.length ||
				rowIndex < 0 ||
				rowIndex >= data.length
			) {
				return null;
			}

			const colIdx = navigableColumnKeys.indexOf(dataIndex);
			if (colIdx === -1) return null;

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
			if (nextRow >= data.length) {
				if (!wrap) return null;
				nextRow = 0;
			} else if (nextRow < 0) {
				if (!wrap) return null;
				nextRow = data.length - 1;
			}

			return `${nextRow}-${navigableColumnKeys[nextColIdx]}`;
		},
		[navigableColumnKeys, data.length],
	);

	// Get vertical cell key (up/down)
	const getVerticalCellKey = React.useCallback(
		(currentKey: string, direction: 'up' | 'down') => {
			const [rowIndexStr, ...dataIndexParts] = currentKey.split('-');
			const rowIndex = parseInt(rowIndexStr, 10);
			const dataIndex = dataIndexParts.join('-');

			if (Number.isNaN(rowIndex) || !dataIndex || rowIndex < 0 || rowIndex >= data.length) {
				return null;
			}

			const step = direction === 'down' ? 1 : -1;
			const nextRow = rowIndex + step;

			if (nextRow < 0 || nextRow >= data.length) return null;

			return `${nextRow}-${dataIndex}`;
		},
		[data.length],
	);

	// Focus a target cell (set ref + DOM focus)
	const focusCell = React.useCallback(
		(targetKey: string) => {
			setFocusedCell(targetKey);
			setTimeout(() => {
				const cellElement = document.querySelector(`[data-cell-key="${targetKey}"]`) as HTMLElement;
				if (cellElement && cellElement.tabIndex >= 0) {
					cellElement.focus();
				}
			}, 50);
		},
		[setFocusedCell],
	);

	// Keyboard handler for cells
	const handleCellKeyDown = React.useCallback(
		(cellKey: string, e: React.KeyboardEvent) => {
			const [rowIndexStr, ...dataIndexParts] = cellKey.split('-');
			const rowIndex = parseInt(rowIndexStr, 10);
			const dataIndex = dataIndexParts.join('-');

			if (Number.isNaN(rowIndex) || !dataIndex) return false;

			const key = e.key;

			// ─── Ctrl+C (Copy displayed value from DOM) ───
			if (key === 'c' && (e.ctrlKey || e.metaKey)) {
				// If user has selected text (e.g. via mouse drag), let browser handle native copy
				const selection = window.getSelection();
				if (selection && selection.toString().trim().length > 0) {
					return false;
				}
				e.preventDefault();
				const cellEl = document.querySelector(`[data-cell-key="${cellKey}"]`) as HTMLElement;
				const textToCopy = cellEl?.innerText?.trim() ?? '';
				cellClipboardRef.current = textToCopy;
				void navigator.clipboard.writeText(textToCopy).catch(() => {});
				return true;
			}

			// ─── Tab / Shift+Tab ───
			if (key === 'Tab') {
				e.preventDefault();
				const isShift = e.shiftKey;
				const nextKey = getNextCellKey(cellKey, isShift ? -1 : 1, true);
				if (!nextKey) return false;
				focusCell(nextKey);
				return true;
			}

			// ─── Arrow Left / Right ───
			if (key === 'ArrowLeft' || key === 'ArrowRight') {
				e.preventDefault();
				const direction = key === 'ArrowRight' ? 1 : -1;
				const nextKey = getNextCellKey(cellKey, direction as 1 | -1, false);
				if (!nextKey) return false;
				focusCell(nextKey);
				return true;
			}

			// ─── Arrow Up / Down ───
			if (key === 'ArrowUp' || key === 'ArrowDown') {
				e.preventDefault();
				const direction = key === 'ArrowDown' ? 'down' : 'up';
				const nextKey = getVerticalCellKey(cellKey, direction);
				if (!nextKey) return false;
				focusCell(nextKey);
				return true;
			}

			// ─── Escape ───
			if (key === 'Escape') {
				e.preventDefault();
				setFocusedCell(null);
				(document.activeElement as HTMLElement)?.blur();
				return true;
			}

			return false;
		},
		[data, getNextCellKey, getVerticalCellKey, focusCell, setFocusedCell],
	);

	return {
		setFocusedCell,
		handleCellKeyDown,
	};
}
