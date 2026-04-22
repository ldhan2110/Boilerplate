/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

interface Position {
	x: number;
	y: number;
}

interface ContextRecord {
	[key: string]: any;
}

export function useContextMenu() {
	const [isOpen, setIsOpen] = React.useState(false);
	const [position, setPosition] = React.useState<Position>({ x: 0, y: 0 });
	const [record, setRecord] = React.useState<ContextRecord | null>(null);

	const showMenu = React.useCallback((event: React.MouseEvent, record: ContextRecord) => {
		event.preventDefault();
		setIsOpen(true);
		setPosition({ x: event.clientX, y: event.clientY });
		setRecord(record);
	}, []);

	const hideMenu = React.useCallback(() => {
		setIsOpen(false);
	}, []);

	return { isOpen, position, record, showMenu, hideMenu };
}
