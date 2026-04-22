import React, { type ReactElement, useMemo } from 'react';
import {
	DndContext,
	closestCenter,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { SortableContext, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { Tab } from '@/types';
import store from '@/stores/AppStore';

type SortableTabNodeProps = {
	id: string;
	children: ReactElement;
};

const SortableTabNode: React.FC<SortableTabNodeProps> = ({ id, children }) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
	});

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		cursor: isDragging ? 'grabbing' : 'grab',
		userSelect: 'none',
	};

	// Return drag props that will be applied to TabDropdown's wrapper div
	const dragProps = {
		...attributes,
		...listeners,
		style: {
			...style,
		},
		ref: setNodeRef,
	};

	return React.cloneElement(children as React.ReactElement<any>, {
		...(children.props as any),
		dragProps,
	});
};

type SortableTabBarWrapperProps = {
	tabs: Tab[];
	children: ReactElement;
};

export const SortableTabBarWrapper: React.FC<SortableTabBarWrapperProps> = ({ tabs, children }) => {
	const tabKeys = useMemo(() => tabs.map((tab) => tab.key), [tabs]);

	// Configure sensors with activation constraint to prevent accidental drags
	// This allows clicks on interactive elements (star icon, close button) without triggering drag
	// The 5px distance requirement ensures that clicks (no movement) don't trigger drag,
	// while actual dragging (with movement) will work properly
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5, // Require 5px movement before drag starts
			},
		}),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (!over || active.id === over.id) {
			return;
		}

		const oldIndex = tabKeys.indexOf(active.id as string);
		const newIndex = tabKeys.indexOf(over.id as string);

		if (oldIndex !== -1 && newIndex !== -1) {
			const newOrder = [...tabs];
			const [removed] = newOrder.splice(oldIndex, 1);
			newOrder.splice(newIndex, 0, removed);
			store.reorderTabs(newOrder);
		}
	};

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
			modifiers={[restrictToHorizontalAxis]}
		>
			<SortableContext items={tabKeys} strategy={horizontalListSortingStrategy}>
				{children}
			</SortableContext>
		</DndContext>
	);
};

export { SortableTabNode };