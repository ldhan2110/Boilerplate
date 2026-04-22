import React from 'react';

export function useFullscreen() {
	const containerRef = React.useRef<HTMLDivElement | null>(null);
	const [isFullscreen, setIsFullscreen] = React.useState(false);

	const enterFullscreen = React.useCallback(async () => {
		if (containerRef.current && !document.fullscreenElement) {
			await containerRef.current.requestFullscreen();
			setIsFullscreen(true);
		}
	}, []);

	const exitFullscreen = React.useCallback(() => {
		if (document.fullscreenElement) {
			document.exitFullscreen();
			setIsFullscreen(false);
		}
	}, []);

	const toggleFullscreen = React.useCallback(() => {
		if (document.fullscreenElement) exitFullscreen();
		else enterFullscreen();
	}, [enterFullscreen, exitFullscreen]);

	React.useEffect(() => {
		const handler = () => {
			setIsFullscreen(Boolean(document.fullscreenElement));
		};
		document.addEventListener('fullscreenchange', handler);
		return () => document.removeEventListener('fullscreenchange', handler);
	}, []);

	return { containerRef, isFullscreen, enterFullscreen, exitFullscreen, toggleFullscreen };
}
