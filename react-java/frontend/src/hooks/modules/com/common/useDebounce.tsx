/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useCallback } from 'react';

/**
 * useDebounce
 * Returns a debounced version of a callback function.
 *
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds (default: 500)
 * @returns Debounced function
 */
export function useDebounce<T extends (...args: any[]) => void>(
	callback: T,
	delay: number = 500,
): (...args: Parameters<T>) => void {
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const debouncedFn = useCallback(
		(...args: Parameters<T>) => {
			if (timer.current) {
				clearTimeout(timer.current);
			}

			timer.current = setTimeout(() => {
				callback(...args);
			}, delay);
		},
		[callback, delay],
	);

	return debouncedFn;
}
