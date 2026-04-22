import { useEffect, useState } from 'react';

/** Stable reference when callers do not need deps-driven height recalculation. */
export const STABLE_TABLE_SCROLL_DEPS: unknown[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useTableScroll(deps: any[] = STABLE_TABLE_SCROLL_DEPS, offset: number = 200, isFullscreen?: boolean) {
	const [tableHeight, setTableHeight] = useState<number>();

	useEffect(() => {
		const calcHeight = () => {
			if (isFullscreen) offset = (window.innerHeight * 15) / 100;
			const availableHeight = window.innerHeight - offset;
			setTableHeight(availableHeight > 200 ? availableHeight : 200);
		};

		calcHeight();
		window.addEventListener('resize', calcHeight);

		return () => window.removeEventListener('resize', calcHeight);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [deps, isFullscreen]);

	return tableHeight;
}
