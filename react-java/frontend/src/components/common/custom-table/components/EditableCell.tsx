import React, { type ReactElement } from 'react';
import { EDIT_TYPE, type DecimalEditProps, type EditProps } from '@/types';
import type { FormListFieldData } from 'antd';
import { Form } from 'antd';
import {
	CheckBoxCell,
	InputCell,
	InputNumberCell,
	InputNumberDecimalCell,
	MultiSelectCell,
	SelectCell,
	DatePickerCell,
	TimePickerCell,
	SearchCell,
	ReadOnlyCell,
	type SearchCellProps,
} from './cell';
import { CellTooltipWrapper } from './CellTooltipWrapper';
import { formatCellDisplayValue } from '../utils/cellDisplayFormatters';

const EditCellWrapper = ({
	children,
	style: wrapperStyle,
	cellKey,
}: {
	children: React.ReactNode;
	style?: React.CSSProperties;
	cellKey: string;
}) => (
	<div
		data-cell-key={cellKey}
		onClick={(e) => e.stopPropagation()}
		onMouseDown={(e) => e.stopPropagation()}
		style={wrapperStyle}
	>
		{children}
	</div>
);

interface EditableCellProps<T> {
	editType?: EDIT_TYPE;
	field: FormListFieldData;
	cellKey: string;
	name: (string | number)[];
	tableFormName: string;
	editProps?: Partial<EditProps<T> | DecimalEditProps<T>>;
	text: string | ReactElement;
	record: T;
	activeEditingCell: string | null;
	align?: 'left' | 'right' | 'center';
	setActiveEditingCell: (cellKey: string | null) => void;
	onCellKeyDown?: (
		cellKey: string,
		e: React.KeyboardEvent,
		isEditing?: boolean,
	) => Promise<boolean> | boolean;
	setFocusedCell?: (cellKey: string | null) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	customRender?: (text: any, record: T, rowIndex: number) => React.ReactNode;
	/** Tooltip shown on cell hover. String for static text, or function receiving (cellValue, record) returning ReactNode. */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	tooltip?: string | ((value: any, record: T) => React.ReactNode);
	/** Incremented after Ctrl+V paste to force re-render of memoized cell */
	pasteVersion?: number;
}

export const EditableCell = React.memo(
	<T,>({
		editType,
		field,
		cellKey,
		name,
		tableFormName,
		editProps,
		activeEditingCell,
		align,
		setActiveEditingCell,
		onCellKeyDown,
		setFocusedCell,
		customRender,
		tooltip,
		text, // text is part of interface but value comes from form, so we use value from form instead
		record,
		pasteVersion,
	}: EditableCellProps<T>) => {
		// text is intentionally unused - we use value from form instead
		void text;
		// pasteVersion is only used to trigger React.memo re-render after Ctrl+V paste
		void pasteVersion;
		const form = Form.useFormInstance();
		const fullPath = [tableFormName, ...name];
		const isEditing = activeEditingCell === cellKey;
		const value = form.getFieldValue(fullPath);

		// Extract rowIndex from cellKey (format: "rowIndex-dataIndex")
		const rowIndex = parseInt(cellKey.split('-')[0], 10) || 0;

		const handleKeyDown = React.useCallback(
			(e: React.KeyboardEvent) => {
				if (!onCellKeyDown) return;
				// Tab, Arrow Up/Down, Enter, Escape are handled by unified handler in editing mode
				if (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 'Escape') {
					void Promise.resolve(onCellKeyDown(cellKey, e, true));
				}
			},
			[onCellKeyDown, cellKey],
		);

		// Handle keys when cell is in focused (non-editing) state
		const handleDisplayKeyDown = React.useCallback(
			(e: React.KeyboardEvent) => {
				if (!onCellKeyDown) return;
				// All navigation keys handled by unified handler in focused (non-editing) state
				if (['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Escape', ' '].includes(e.key)) {
					void Promise.resolve(onCellKeyDown(cellKey, e, false));
				}
				// Ctrl+C / Ctrl+V for cell copy-paste
				if ((e.key === 'c' || e.key === 'v') && (e.ctrlKey || e.metaKey)) {
					void Promise.resolve(onCellKeyDown(cellKey, e, false));
				}
			},
			[onCellKeyDown, cellKey],
		);

		const commonProps = {
			field,
			cellKey,
			name,
			tableFormName,
			...editProps,
			activeEditingCell,
			setActiveEditingCell,
		};
		const decimalProps = {
			field,
			cellKey,
			name,
			tableFormName,
			...(editProps as Partial<DecimalEditProps<T>>),
			activeEditingCell,
			setActiveEditingCell,
		};

		// Handle keys for checkbox cells (they don't have edit mode)
		const handleCheckboxWrapperKeyDown = React.useCallback(
			(e: React.KeyboardEvent) => {
				if (!onCellKeyDown) return;
				// Unified handler manages Tab, arrows, Enter, Space, Escape for checkbox cells
				if (['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Escape', ' '].includes(e.key)) {
					void Promise.resolve(onCellKeyDown(cellKey, e, false));
				}
				// Ctrl+C for copy (Ctrl+V is blocked for checkbox cells in the handler)
				if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
					void Promise.resolve(onCellKeyDown(cellKey, e, false));
				}
			},
			[onCellKeyDown, cellKey],
		);

		// Handler for keys when checkbox itself is focused
		const handleCheckboxTabKeyDown = React.useCallback(
			(e: React.KeyboardEvent) => {
				if (!onCellKeyDown) return;
				if (['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Escape', ' '].includes(e.key)) {
					void Promise.resolve(onCellKeyDown(cellKey, e, false));
				}
			},
			[onCellKeyDown, cellKey],
		);

		// Checkbox cells toggle directly without edit mode
		if (editType === EDIT_TYPE.CHECKBOX) {
			return (
				<div
					data-cell-key={cellKey}
					onKeyDown={handleCheckboxWrapperKeyDown}
					tabIndex={0}
					style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
				>
					<CheckBoxCell
						{...commonProps}
						onKeyDown={handleCheckboxTabKeyDown}
						checkboxMapping={editProps?.checkboxMapping ?? { checked: true, unchecked: false }}
					/>
				</div>
			);
		}

		// Display view (not editing)
		if (!isEditing) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const displayValue = formatCellDisplayValue(value, editType, editProps as any);
			// For SELECT/MULTI_SELECT use displayValue (value + options) so UI shows the current selection after user changes; customRender uses record which is stale
			const renderedValue =
				(editType === EDIT_TYPE.SELECT || editType === EDIT_TYPE.MULTI_SELECT) && editProps?.options
					? displayValue
					: customRender
						? customRender(value, record, rowIndex)
						: displayValue;
			// Default to right alignment for number inputs
			const textAlign = align || (editType === EDIT_TYPE.INPUT_NUMBER ? 'right' : 'left');

			const hasTooltip = !!tooltip;
			const cellContent = (
				<div
					data-cell-key={cellKey}
					style={{
						minHeight: '24px',
						padding: '2px 8px',
						cursor: 'text',
						width: '100%',
						display: 'flex',
						alignItems: 'center',
					}}
					onMouseDown={(e) => {
						e.stopPropagation();
					}}
					onClick={() => {
						setFocusedCell?.(cellKey);
					}}
					onKeyDown={handleDisplayKeyDown}
					tabIndex={0}
					onDoubleClick={async (e) => {
						e.stopPropagation();
						// Prevent read-only cells (no editType) from entering edit mode
						if (!editType) {
							return;
						}
						if (editProps?.overrideEditProps) {
							const override = editProps.overrideEditProps(
								form.getFieldsValue(),
								rowIndex,
								form,
								name as string[],
							);
							if (override?.disabled) return;
						}
						// If there's an active cell different from this one, validate it first
						if (activeEditingCell && activeEditingCell !== cellKey) {
							// Parse the active cell's key to get its field path
							const [rowIndexStr, ...dataIndexParts] = activeEditingCell.split('-');
							const activeRowIndex = parseInt(rowIndexStr, 10);
							const dataIndex = dataIndexParts.join('-');

							if (!isNaN(activeRowIndex) && dataIndex) {
								try {
									// Validate the currently active cell before switching
									// Field path: [tableFormName, rowIndex, dataIndex]
									const activeFieldPath = [tableFormName, activeRowIndex, dataIndex];
									await form.validateFields([activeFieldPath]);
									// Validation passed, switch to new cell
									setActiveEditingCell(cellKey);
									// eslint-disable-next-line @typescript-eslint/no-unused-vars
								} catch (error) {
									// Validation failed, keep the old cell open
									// Error is already displayed by Form.Item
								}
							} else {
								// If we can't parse, just switch (fallback)
								setActiveEditingCell(cellKey);
							}
						} else {
							// No active cell or clicking the same cell, just activate it
							setActiveEditingCell(cellKey);
						}
					}}
					title={
						hasTooltip
							? undefined
							: typeof renderedValue === 'string'
								? renderedValue
								: typeof displayValue === 'string'
									? displayValue
									: String(displayValue)
					}
				>
					<span
						style={{
							textAlign,
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
							width: '100%',
						}}
					>
						{renderedValue}
					</span>
				</div>
			);

			return hasTooltip ? (
				<CellTooltipWrapper tooltip={tooltip} value={value} record={record}>
					{cellContent}
				</CellTooltipWrapper>
			) : cellContent;
		}

		// Edit view (editing)
		switch (editType) {
			case EDIT_TYPE.INPUT:
				return (
					<EditCellWrapper cellKey={cellKey}>
						<InputCell {...commonProps} onKeyDown={handleKeyDown} />
					</EditCellWrapper>
				);
			case EDIT_TYPE.INPUT_NUMBER:
				return (
					<EditCellWrapper cellKey={cellKey}>
						<InputNumberCell {...commonProps} onKeyDown={handleKeyDown} />
					</EditCellWrapper>
				);
			case EDIT_TYPE.INPUT_NUMBER_DECIMAL:
				return (
					<EditCellWrapper cellKey={cellKey}>
						<InputNumberDecimalCell {...decimalProps} onKeyDown={handleKeyDown} />
					</EditCellWrapper>
				);
			case EDIT_TYPE.MULTI_SELECT:
				return (
					<EditCellWrapper cellKey={cellKey}>
						<MultiSelectCell {...commonProps} onKeyDown={handleKeyDown} />
					</EditCellWrapper>
				);
			case EDIT_TYPE.SELECT:
				return (
					<EditCellWrapper cellKey={cellKey}>
						<SelectCell {...commonProps} onKeyDown={handleKeyDown} />
					</EditCellWrapper>
				);
			case EDIT_TYPE.DATEPICKER:
				return (
					<EditCellWrapper cellKey={cellKey}>
						<DatePickerCell {...commonProps} onKeyDown={handleKeyDown} />
					</EditCellWrapper>
				);
			case EDIT_TYPE.TIMEPICKER:
				return (
					<EditCellWrapper cellKey={cellKey}>
						<TimePickerCell {...commonProps} onKeyDown={handleKeyDown} />
					</EditCellWrapper>
				);
			case EDIT_TYPE.SEARCH:
				return (
					<EditCellWrapper cellKey={cellKey}>
						<SearchCell {...(commonProps as SearchCellProps<T>)} onKeyDown={handleKeyDown} />
					</EditCellWrapper>
				);
			default:
				return (
					<ReadOnlyCell
						fieldName={name}
						{...commonProps}
						customRender={customRender}
						tooltip={tooltip}
						record={record}
						rowIndex={rowIndex}
						onCellKeyDown={onCellKeyDown}
						setFocusedCell={setFocusedCell}
					/>
				);
		}
	},
) as <T>(props: EditableCellProps<T>) => ReactElement | null;
