import React from 'react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useElementSize = (visible?: boolean, _timeOut?: number, _recalculate?: boolean) => {
	const elementRef = React.useRef<HTMLDivElement>(undefined);
	const [size, setSize] = React.useState({
		width: 0,
		height: 0,
	});

	React.useLayoutEffect(() => {
		if (!elementRef.current) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				setSize({ width, height });
			}
		});

		observer.observe(elementRef.current);

		return () => observer.disconnect();
	}, [visible]);

	// Return the ref to be attached to an element and the size state.
	return [elementRef, size];
};
