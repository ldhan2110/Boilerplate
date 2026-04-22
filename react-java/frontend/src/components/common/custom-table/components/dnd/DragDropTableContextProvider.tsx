/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { closestCenter, DndContext, DragOverlay } from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';

import type { DragIndexState, TableColumn } from '@/types';
import { useDragDropHandler } from '../../hooks';

type DragDropContextProviderProps<T> = {
	columns: TableColumn<T>[];
	children?: React.ReactNode;
	setColumns: React.Dispatch<React.SetStateAction<TableColumn<T>[]>>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const DragIndexContext = React.createContext<DragIndexState>({ active: -1, over: -1 });

export const DragDropTableContextProvider = <T,>({
	columns,
	children,
	setColumns,
}: DragDropContextProviderProps<T>) => {
	const { dragIndex, sensors, onDragEnd, onDragOver } = useDragDropHandler(columns, setColumns);

	return (
		<DndContext
			sensors={sensors}
			modifiers={[restrictToHorizontalAxis]}
			onDragEnd={onDragEnd}
			onDragOver={onDragOver}
			collisionDetection={closestCenter}
		>
			<SortableContext
				items={columns.map((i) => i.key) as any[]}
				strategy={horizontalListSortingStrategy}
			>
				<DragIndexContext.Provider value={dragIndex}>{children}</DragIndexContext.Provider>
			</SortableContext>
			<DragOverlay>
				<th style={{ backgroundColor: 'gray', padding: 16 }}>
					{columns[columns.findIndex((i) => i.key === dragIndex.active)]?.title as React.ReactNode}
				</th>
			</DragOverlay>
		</DndContext>
	);
};
