import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

/**
 * Measures container height using ResizeObserver.
 * Use when the table must scroll inside its container instead of the page.
 * @param enabled - Whether to observe (default true)
 * @returns [ref, height] - Attach ref to the container, height is the measured height in px
 */
export function useContainerHeight(enabled = true): [RefObject<HTMLDivElement | null>, number] {
	const ref = useRef<HTMLDivElement | null>(null);
	const [height, setHeight] = useState(0);

	useEffect(() => {
		if (!enabled || !ref.current) return;

		const el = ref.current;
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { height: h } = entry.contentRect;
				setHeight(Math.floor(h));
			}
		});
		resizeObserver.observe(el);

		// Initial measurement
		setHeight(Math.floor(el.getBoundingClientRect().height));

		return () => resizeObserver.disconnect();
	}, [enabled]);

	return [ref, height];
}
