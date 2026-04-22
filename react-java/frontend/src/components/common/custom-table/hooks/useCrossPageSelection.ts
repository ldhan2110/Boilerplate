import { useCallback, useEffect, useRef, useState } from 'react';
import type { CrossPageSelectionConfig, CrossPageSelectionInfo } from '@/types';

type CrossPageState = {
	isAllSelected: boolean;
	totalCount: number;
};

export function useCrossPageSelection<T extends { key: React.Key }>(
	config: CrossPageSelectionConfig | undefined,
	data: T[],
	paginationTotal: number | undefined,
) {
	const enabled = config?.enabled ?? false;

	// Refs for large Sets — avoids recreating on every toggle
	const selectedIdsRef = useRef<Set<React.Key>>(new Set());
	const deselectedIdsRef = useRef<Set<React.Key>>(new Set());

	// State for UI re-renders (version counter pattern)
	const [state, setState] = useState<CrossPageState>({
		isAllSelected: false,
		totalCount: 0,
	});
	const [version, setVersion] = useState(0);

	// Track previous total to detect filter changes
	const prevTotalRef = useRef<number | undefined>(paginationTotal);
	const isInitialMountRef = useRef(true);

	// Auto-clear when total changes (filter/search changed)
	useEffect(() => {
		if (!enabled) {
			prevTotalRef.current = paginationTotal;
			isInitialMountRef.current = false;
			return;
		}
		// Only auto-clear if there's an active selection (all-selected or individual picks)
		if (!state.isAllSelected && selectedIdsRef.current.size === 0) {
			prevTotalRef.current = paginationTotal;
			isInitialMountRef.current = false;
			return;
		}
		if (isInitialMountRef.current) {
			isInitialMountRef.current = false;
			prevTotalRef.current = paginationTotal;
			return;
		}
		if (prevTotalRef.current !== paginationTotal) {
			selectedIdsRef.current.clear();
			deselectedIdsRef.current.clear();
			setState({ isAllSelected: false, totalCount: 0 });
			setVersion((v) => v + 1);
			config?.onSelectionChange?.({
				totalSelected: 0,
				getEffectiveKeys: () => [],
				deselectedKeys: [],
			});
		}
		prevTotalRef.current = paginationTotal;
	}, [paginationTotal, enabled, state.isAllSelected]);

	// Build selection info (cheap — doesn't compute full array)
	const buildInfo = useCallback((): CrossPageSelectionInfo => {
		const selectedIds = selectedIdsRef.current;
		const deselectedIds = deselectedIdsRef.current;
		return {
			totalSelected: selectedIds.size - deselectedIds.size,
			getEffectiveKeys: () =>
				[...selectedIds].filter((k) => !deselectedIds.has(k)),
			deselectedKeys: [...deselectedIds],
		};
	}, []);

	// Handle "Select All (N)" click — synchronous, reads allKeys from config
	const handleSelectAll = useCallback(() => {
		if (!config) return;
		const keys = config.allKeys;
		const total = keys.length;
		selectedIdsRef.current = new Set(keys);
		deselectedIdsRef.current.clear();
		setState({ isAllSelected: true, totalCount: total });
		setVersion((v) => v + 1);
		const info = {
			totalSelected: total,
			getEffectiveKeys: () => [...keys],
			deselectedKeys: [],
		};
		config.onSelectionChange?.(info);
	}, [config]);

	// Handle clearing cross-page selection
	const handleClear = useCallback(() => {
		selectedIdsRef.current.clear();
		deselectedIdsRef.current.clear();
		setState({ isAllSelected: false, totalCount: 0 });
		setVersion((v) => v + 1);
		config?.onSelectionChange?.({
			totalSelected: 0,
			getEffectiveKeys: () => [],
			deselectedKeys: [],
		});
	}, [config]);

	// Toggle a single row in "select all" mode (deselect tracking)
	const toggleRow = useCallback(
		(key: React.Key) => {
			if (deselectedIdsRef.current.has(key)) {
				deselectedIdsRef.current.delete(key);
			} else {
				deselectedIdsRef.current.add(key);
			}
			setVersion((v) => v + 1);
			config?.onSelectionChange?.(buildInfo());
		},
		[config, buildInfo],
	);

	// Sync individual row selections from antd's onChange (non-select-all mode).
	// Merges current-page changes with previously selected keys from other pages.
	const syncSelection = useCallback(
		(selectedKeys: React.Key[], currentPageData: T[]) => {
			if (!enabled) return;
			const currentPageKeySet = new Set(currentPageData.map((row) => row.key));
			const newSelectedSet = new Set(selectedKeys);

			// Keep selections from other pages, update only current page rows
			for (const pageKey of currentPageKeySet) {
				if (newSelectedSet.has(pageKey)) {
					selectedIdsRef.current.add(pageKey);
				} else {
					selectedIdsRef.current.delete(pageKey);
				}
			}
			deselectedIdsRef.current.clear();
			setVersion((v) => v + 1);
			config?.onSelectionChange?.(buildInfo());
		},
		[enabled, config, buildInfo],
	);

	// Compute selectedRowKeys for the current page (O(pageSize), not O(total))
	const getPageSelectedKeys = useCallback((): React.Key[] => {
		return data
			.filter((row) => selectedIdsRef.current.has(row.key) && !deselectedIdsRef.current.has(row.key))
			.map((row) => row.key);
	}, [data, version]);

	const effectiveCount = selectedIdsRef.current.size - deselectedIdsRef.current.size;

	// Whether cross-page has any selection (select-all or individual picks)
	const hasSelection = enabled && effectiveCount > 0;

	// Direct ref check — no closure over `data`, safe to call from any useMemo
	const isRowSelected = useCallback(
		(key: React.Key): boolean =>
			selectedIdsRef.current.has(key) && !deselectedIdsRef.current.has(key),
		[],
	);

	return {
		/** Whether the feature is enabled and "select all" has been activated */
		isAllSelected: state.isAllSelected,
		/** Total count from allKeys */
		totalCount: state.totalCount,
		/** Effective selected count (total - deselected) */
		effectiveCount,
		/** Whether there is any cross-page selection active (select-all or individual) */
		hasSelection,
		/** Version counter — include in useMemo deps to trigger re-renders */
		version,
		/** Selected keys for the current page only */
		getPageSelectedKeys,
		/** Trigger "Select All" using allKeys from config */
		handleSelectAll,
		/** Clear cross-page selection */
		handleClear,
		/** Toggle a single row key (select-all mode deselect tracking) */
		toggleRow,
		/** Sync individual row selection keys from antd onChange */
		syncSelection,
		/** Check if a specific key is selected (reads refs directly) */
		isRowSelected,
		/** Build CrossPageSelectionInfo for consumers */
		buildInfo,
	};
}
