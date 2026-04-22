import { type TableData, type Sort, type MultiSort, SORT } from '@/types';

/**
 * Sort data locally based on sort configuration
 * @param data - Array of data to sort
 * @param sort - Sort configuration (field and type)
 * @returns Sorted array
 */
export function sortDataLocally<T>(data: TableData<T>[], sort: Sort | undefined): TableData<T>[] {
	if (!sort || !sort.sortField || !sort.sortType) {
		return data;
	}

	const { sortField, sortType } = sort;
	const sortedData = [...data];

	sortedData.sort((a, b) => {
		const aValue = getNestedValue(a, sortField);
		const bValue = getNestedValue(b, sortField);

		// Handle null/undefined values
		if (aValue == null && bValue == null) return 0;
		if (aValue == null) return 1; // null values go to end
		if (bValue == null) return -1; // null values go to end

		// Compare values
		let comparison = 0;
		if (typeof aValue === 'number' && typeof bValue === 'number') {
			comparison = aValue - bValue;
		} else if (aValue instanceof Date && bValue instanceof Date) {
			comparison = aValue.getTime() - bValue.getTime();
		} else {
			// Convert to string for comparison
			const aStr = String(aValue).toLowerCase();
			const bStr = String(bValue).toLowerCase();
			comparison = aStr.localeCompare(bStr);
		}

		// Apply sort direction
		return sortType === SORT.ASC ? comparison : -comparison;
	});

	return sortedData;
}

/**
 * Get nested value from object using dot notation (e.g., "user.name")
 * @param obj - Object to get value from
 * @param path - Path to the value (supports dot notation)
 * @returns The value at the path
 */
/**
 * Sort data locally based on multi-sort configuration (multiple fields with priority)
 */
export function multiSortDataLocally<T>(data: TableData<T>[], sorts: MultiSort): TableData<T>[] {
	const activeSorts = sorts.filter((s) => s.sortField && s.sortType);
	if (activeSorts.length === 0) return data;

	const sortedData = [...data];
	sortedData.sort((a, b) => {
		for (const { sortField, sortType } of activeSorts) {
			const aValue = getNestedValue(a, sortField!);
			const bValue = getNestedValue(b, sortField!);

			if (aValue == null && bValue == null) continue;
			if (aValue == null) return 1;
			if (bValue == null) return -1;

			let comparison = 0;
			if (typeof aValue === 'number' && typeof bValue === 'number') {
				comparison = aValue - bValue;
			} else if (aValue instanceof Date && bValue instanceof Date) {
				comparison = aValue.getTime() - bValue.getTime();
			} else {
				const aStr = String(aValue).toLowerCase();
				const bStr = String(bValue).toLowerCase();
				comparison = aStr.localeCompare(bStr);
			}

			if (comparison !== 0) {
				return sortType === SORT.ASC ? comparison : -comparison;
			}
		}
		return 0;
	});

	return sortedData;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNestedValue(obj: any, path: string): any {
	const keys = path.split('.');
	let value = obj;
	for (const key of keys) {
		if (value == null) return undefined;
		value = value[key];
	}
	return value;
}

