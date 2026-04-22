/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Resizable } from 'react-resizable';
import { DragIndexContext } from './dnd/DragDropTableContextProvider';
import { useSortable } from '@dnd-kit/sortable';
import { dragActiveStyle } from '@/constants';
import { HolderOutlined, MoreOutlined } from '@ant-design/icons';
import 'react-resizable/css/styles.css';
import { FilterHeader } from './filters';
import { Flex } from 'antd';

export const TableHeader = (props: any) => {
	const {
		onResize,
		width,
		resizable,
		filterProps,
		draggable,
		onHeaderMenuClick,
		columnData,
		showHeaderMenu = true,
		...restProps
	} = props;

	const dragState = React.useContext(DragIndexContext);
	const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id: props.id });
	const style: React.CSSProperties = {
		...props.style,
		...(isDragging ? { position: 'relative', zIndex: 9999, userSelect: 'none' } : {}),
		...dragActiveStyle(dragState, props.id),
	};

	if (!width) {
		return <th {...restProps} />;
	}

	return (
		<Resizable
			width={width}
			height={0}
			handle={
				<span
					className="react-resizable-handle"
					style={{
						display: resizable ? 'block' : 'none',
					}}
					onClick={(e) => e.stopPropagation()}
				/>
			}
			onResize={onResize}
			draggableOpts={{ enableUserSelectHack: false }}
		>
			<th
				{...restProps}
				style={{
					...style,
					position: 'relative',
				}}
				{...attributes}
			>
				<Flex vertical gap={8}>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							width: '100%',
							position: 'relative',
						}}
					>
						{/* Title */}
						<span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
							{restProps.children}
						</span>

						{/* Icons Container - Always at the right */}
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								flexShrink: 0,
								marginLeft: 8,
								position: 'relative',
								zIndex: 100,
							}}
						>
							{/* Small Drag Handle Icon (only draggable area) */}
							<span
								ref={setNodeRef}
								{...attributes}
								{...listeners}
								style={{
									cursor: 'grab',
									display: draggable ? 'inline-flex' : 'none',
									alignItems: 'center',
									justifyContent: 'center',
									zIndex: 10,
									color: '#999',
									position: 'relative',
									pointerEvents: 'auto',
								}}
								onClick={(e) => e.stopPropagation()} // prevent sorting trigger
							>
								<HolderOutlined style={{ fontSize: 14 }} />
							</span>

							{/* Header Context Menu Icon - To the right of drag icon */}
							{showHeaderMenu && onHeaderMenuClick && (
								<span
									style={{
										cursor: 'pointer',
										display: 'inline-flex',
										alignItems: 'center',
										justifyContent: 'center',
										color: '#999',
										transition: 'all 0.2s',
										position: 'relative',
										zIndex: 100,
										pointerEvents: 'auto',
										borderRadius: '4px',
									}}
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										onHeaderMenuClick?.(e, columnData || props);
									}}
									onMouseDown={(e) => {
										e.preventDefault();
										e.stopPropagation();
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.color = 'var(--ant-color-primary)';
										e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.color = '#999';
										e.currentTarget.style.backgroundColor = 'transparent';
									}}
								>
									<MoreOutlined style={{ fontSize: 16 }} />
								</span>
							)}
						</div>
					</div>
					<FilterHeader {...filterProps} />
				</Flex>
			</th>
		</Resizable>
	);
};
