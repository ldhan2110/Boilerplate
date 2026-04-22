/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
	type DragOverEvent,
	type UniqueIdentifier,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

export interface DragIndexState {
	active: UniqueIdentifier;
	over: UniqueIdentifier | undefined;
	direction?: 'left' | 'right';
}

export function useDragDropHandler(
	columns: any[],
	setColumns: React.Dispatch<React.SetStateAction<any[]>>,
) {
	const [dragIndex, setDragIndex] = React.useState<DragIndexState>({ active: -1, over: -1 });

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 1,
			},
		}),
	);

	const findParentIndexById = React.useCallback((arr: any[], id: UniqueIdentifier | undefined) => {
		for (let i = 0; i < arr.length; i++) {
			const item = arr[i];

			// Check top-level match
			if (item.dataIndex === id || item.key === id) {
				return i;
			}

			// Check nested children
			if (Array.isArray(item.children)) {
				const foundChild = item.children.find(
					(child: any) => child.dataIndex === id || child.key === id,
				);
				if (foundChild) return i; // Return parent index
			}
		}

		return -1; // Not found
	}, []);

	const onDragEnd = ({ active, over }: DragEndEvent) => {
		if (active.id !== over?.id) {
			setColumns((prevState) => {
				const activeIndex = findParentIndexById(prevState, active?.id);
				const overIndex = findParentIndexById(prevState, over?.id);

				if (
					activeIndex == overIndex &&
					activeIndex !== -1 &&
					Array.isArray(prevState[activeIndex].children)
				) {
					const column = prevState[activeIndex].children;
					const childActiveIndex = findParentIndexById(column, active?.id);
					const childOverIndex = findParentIndexById(column, over?.id);
					prevState[activeIndex].children = arrayMove(
						prevState[activeIndex].children,
						childActiveIndex,
						childOverIndex,
					);
					return [...prevState];
				}
				return arrayMove(prevState, activeIndex, overIndex);
			});
		}
		setDragIndex({ active: -1, over: -1 });
	};

	const onDragOver = ({ active, over }: DragOverEvent) => {
		const activeIndex = columns.findIndex((i) => i.key === active.id);
		const overIndex = columns.findIndex((i) => i.key === over?.id);
		setDragIndex({
			active: active.id,
			over: over?.id,
			direction: overIndex > activeIndex ? 'right' : 'left',
		});
	};

	return {
		sensors,
		dragIndex,
		onDragEnd,
		onDragOver,
	};
}
