import { useCallback } from 'react';

import { useDebounce } from './useDebounce';

type FormValues = Record<string, unknown>;

type UseFormSearchWithDebounceParams = {
	/** Field names that trigger debounced onSearch */
	debouncedFields: string[];
	/** Field names that trigger onSearch immediately (optional) */
	immediateFields?: string[];
	/** Debounce delay in ms (default: 300) */
	delay?: number;
	/** Called with current form values when a tracked field changes */
	onSearch: (values: FormValues) => void;
};

type HandleValuesChange = (
	changedValues: Partial<FormValues>,
	allValues: FormValues,
) => void;

/**
 * Hook for Form onValuesChange with debounced and immediate search.
 * Use with Form's onValuesChange: when debouncedFields change, onSearch is called after delay;
 * when immediateFields change, onSearch is called right away.
 */
export function useFormSearchWithDebounce({
	debouncedFields,
	immediateFields = [],
	delay = 300,
	onSearch,
}: UseFormSearchWithDebounceParams): HandleValuesChange {
	const debouncedOnSearch = useDebounce((values: FormValues) => {
		onSearch(values);
	}, delay);

	const handleValuesChange = useCallback<HandleValuesChange>(
		(changedValues, allValues) => {
			const changedField = Object.keys(changedValues)[0];
			if (!changedField) return;

			if (debouncedFields.includes(changedField)) {
				debouncedOnSearch(allValues);
			} else if (immediateFields.includes(changedField)) {
				onSearch(allValues);
			}
		},
		[debouncedFields, immediateFields, debouncedOnSearch, onSearch],
	);

	return handleValuesChange;
}
