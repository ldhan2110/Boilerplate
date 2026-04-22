/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import type { EditProps } from '@/types';
import { Form } from 'antd';
import type { FormListFieldData } from 'antd/es/form';
import { CellTooltipWrapper } from '../CellTooltipWrapper';

type ReadOnlyCellProps<T> = Partial<EditProps<T>> & {
	cellKey: string;
	fieldName: any[] | string;
	field: FormListFieldData;
	tableFormName?: string;
	record?: T;
	rowIndex?: number;
	customRender?: (text: any, record: T, rowIndex: number) => React.ReactNode;
	tooltip?: string | ((value: any, record: T) => React.ReactNode);
	onCellKeyDown?: (
		cellKey: string,
		e: React.KeyboardEvent,
		isEditing?: boolean,
	) => Promise<boolean> | boolean;
	setFocusedCell?: (cellKey: string | null) => void;
};

export const ReadOnlyCell = <T,>({
	cellKey,
	fieldName,
	field,
	initialValue,
	tableFormName,
	record,
	rowIndex,
	shouldUpdate,
	customRender,
	tooltip,
	onCellKeyDown,
	setFocusedCell,
}: ReadOnlyCellProps<T>) => {
	const form = Form.useFormInstance();

	const fullPath = Array.isArray(fieldName)
		? [tableFormName, ...fieldName]
		: [tableFormName, fieldName];

	const handleKeyDown = React.useCallback(
		(e: React.KeyboardEvent) => {
			if (!onCellKeyDown) return;
			if (['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Escape', ' '].includes(e.key)) {
				void Promise.resolve(onCellKeyDown(cellKey, e, false));
			}
			if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
				void Promise.resolve(onCellKeyDown(cellKey, e, false));
			}
		},
		[onCellKeyDown, cellKey],
	);

	return (
		<Form.Item
			shouldUpdate={
				shouldUpdate
					? (prev, curr) =>
							shouldUpdate(prev, curr, Array.isArray(fieldName) ? fieldName[0] : fieldName)
					: false
			}
			noStyle
		>
			{() => {
				const value = form.getFieldValue(fullPath);
				const renderedValue = customRender && record !== undefined && rowIndex !== undefined
					? customRender(value, record, rowIndex)
					: value;
				const hasTooltip = !!tooltip;

				const cellContent = (
					<Form.Item {...field} key={cellKey} initialValue={initialValue} noStyle>
						<div
							data-cell-key={cellKey}
							tabIndex={0}
							onKeyDown={handleKeyDown}
							onClick={() => {
								setFocusedCell?.(cellKey);
							}}
							onMouseDown={(e) => {
								e.stopPropagation();
							}}
							style={{
								display: 'flex',
								alignItems: 'center',
								minHeight: '24px',
								padding: '2px 8px',
								width: '100%',
								cursor: 'default',
							}}
						>
							<span
								style={{
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
									width: '100%',
								}}
								title={hasTooltip ? undefined : (value != null ? String(value) : '')}
							>
								{renderedValue}
							</span>
						</div>
					</Form.Item>
				);

				return hasTooltip ? (
					<CellTooltipWrapper tooltip={tooltip} value={value} record={record}>
						{cellContent}
					</CellTooltipWrapper>
				) : cellContent;
			}}
		</Form.Item>
	);
};
