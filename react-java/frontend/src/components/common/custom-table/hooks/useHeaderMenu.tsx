/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import type { TableColumn } from '@/types';

interface Position {
	x: number;
	y: number;
}

export function useHeaderMenu<T>() {
	const [isOpen, setIsOpen] = React.useState(false);
	const [position, setPosition] = React.useState<Position>({ x: 0, y: 0 });
	const [column, setColumn] = React.useState<TableColumn<T> | null>(null);

	const showMenu = React.useCallback((event: React.MouseEvent, columnProps: any) => {
		event.preventDefault();
		event.stopPropagation();
		setIsOpen(true);
		setPosition({ x: event.clientX, y: event.clientY });
		// Extract column info from props
		setColumn(columnProps as TableColumn<T>);
	}, []);

	const hideMenu = React.useCallback(() => {
		setIsOpen(false);
		setColumn(null);
	}, []);

	return { isOpen, position, column, showMenu, hideMenu };
}
