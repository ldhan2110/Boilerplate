/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate, useToggle } from '@/hooks';
import appStore from '@/stores/AppStore';
import type { EditProps, SearchModalProps, TableData } from '@/types';
import { SearchOutlined } from '@ant-design/icons';
import { Form, TimePicker, type TimePickerProps } from 'antd';
import type { FormListFieldData, Rule } from 'antd/es/form';
import type { FormInstance } from 'antd/lib';
import React from 'react';
import dayjs from 'dayjs';

type TimePickerCellProps<T> = Partial<EditProps<T>> & {
	cellKey: string;
	name: any[] | string;
	field: FormListFieldData;
	tableFormName?: string;
	searchModal?: React.ReactElement<SearchModalProps<T>>;
	onSearchSelect?: (
		record: TableData<T>,
		rowIdx: number,
		form: FormInstance,
		name: string[],
	) => void;
	activeEditingCell?: string | null;
	setActiveEditingCell?: (cellKey: string | null) => void;
	onKeyDown?: (e: React.KeyboardEvent) => void;
} & Omit<TimePickerProps, 'name' | 'onChange'>;

export const TimePickerCell = <T,>({
	cellKey,
	name,
	rules,
	required,
	placeholder,
	field,
	initialValue,
	tableFormName,
	searchModal,
	onSearchSelect,
	shouldUpdate,
	overrideEditProps,
	onChange,
	activeEditingCell,
	setActiveEditingCell,
	onKeyDown,
	...props
}: TimePickerCellProps<T>) => {
	const { t, m } = useAppTranslate();
	const { isToggle, toggle } = useToggle(false);
	const form = Form.useFormInstance();
	const { dateFormat } = appStore.state;

	// Extract time format from dateFormat and remove seconds (e.g., "DD/MM/YYYY HH:mm:ss" -> "HH:mm")
	const extractedTimeFormat = dateFormat.split(' ')[1] || 'HH:mm';
	const timeFormat = extractedTimeFormat.replace(':ss', '') || 'HH:mm';
	const fieldPath = React.useMemo(
		() =>
			tableFormName
				? [tableFormName, ...(Array.isArray(name) ? name : [name])]
				: (name as (string | number)[]),
		[tableFormName, name],
	);

	const toDayjs = React.useCallback(
		(value: any) => {
			if (!value) return value;
			if (dayjs.isDayjs(value)) return value;
			const parsed = dayjs(value, timeFormat, true);
			return parsed.isValid() ? parsed : dayjs(value);
		},
		[timeFormat],
	);

	const mappedRule: Rule[] = React.useMemo(() => {
		if (required)
			return [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])];
		return rules || ([] as Rule[]);
	}, [required, rules, m]);

	async function handleSearchSelect(record: TableData<T>) {
		form.setFieldValue([tableFormName, ...name], record[name[1] as keyof T]);
		onSearchSelect?.(record, name[0], form, name as string[]);
		// Close edit mode after selection and validation
		if (activeEditingCell === cellKey) {
			try {
				await form.validateFields([[tableFormName, ...name]]);
				setActiveEditingCell?.(null);
			} catch (error) {
				// Validation failed, keep edit mode open
			}
		}
	};

	const searchIcon = (
		<span
			style={{ position: 'relative', zIndex: 10, pointerEvents: 'all', display: 'inline-flex', cursor: 'pointer' }}
			onMouseDown={(e) => {
				e.preventDefault();
				e.stopPropagation();
			}}
			onClick={(e: React.MouseEvent) => {
				e.stopPropagation();
				toggle();
			}}
		>
			<SearchOutlined style={{ fontSize: 14 }} />
		</span>
	);

	const hasSearch = !!searchModal;

	const commonTimePickerProps = {
		style: { width: '100%' },
		placeholder: t(placeholder as string) || 'HH:mm',
		format: timeFormat,
		needConfirm: false as const,
		suffixIcon: hasSearch ? searchIcon : undefined,
		onKeyDown: (e: React.KeyboardEvent) => {
			if (e.key === 'Tab') {
				onKeyDown?.(e);
			}
			if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 'Escape') {
				const pickerDropdown = document.querySelector('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)');
				if (!pickerDropdown) {
					onKeyDown?.(e);
				}
			}
		},
		onChange: (date: any, dateString: any) => {
			onChange?.(date, dateString, form, name);
		},
		onOpenChange: async (open: boolean) => {
			if (!open && !isToggle && activeEditingCell === cellKey) {
				await new Promise((resolve) => setTimeout(resolve, 100));
				try {
					await form.validateFields([fieldPath]);
					setActiveEditingCell?.(null);
				} catch (error) {
					// Validation failed, keep edit mode open
				}
			}
		},
		...props,
	};

	const renderFormItem = (overrideDisabled?: boolean, restOverrideProps?: any) => (
		<Form.Item
			{...field}
			name={name}
			rules={overrideDisabled ? [] : mappedRule}
			validateTrigger={['onChange', 'onBlur']}
			key={cellKey}
			initialValue={toDayjs(initialValue)}
			getValueProps={(value) => ({ value: toDayjs(value) })}
			getValueFromEvent={(value) => value}
		>
			<TimePicker
				{...commonTimePickerProps}
				{...(overrideDisabled ? { disabled: true } : {})}
				{...(restOverrideProps ?? {})}
			/>
		</Form.Item>
	);

	return (
		<>
			<Form.Item shouldUpdate={(prev, curr) => shouldUpdate?.(prev, curr, name[0]) ?? false}>
				{!shouldUpdate ? (renderFormItem()) : (
					({ getFieldsValue, getFieldValue, setFields }) => {
						const {
							disabled: overrideDisabled,
							clearValueDisable,
							...restOverrideProps
						} = overrideEditProps?.(getFieldsValue(), name[0], form, name) ?? {};

						if (overrideDisabled) {
							setTimeout(() => {
								setFields([
									{
										name: [tableFormName, ...(Array.isArray(name) ? name : [name])],
										value: clearValueDisable
											? null
											: getFieldValue([tableFormName, ...(Array.isArray(name) ? name : [name])]),
										errors: [],
									},
								]);
							}, 0);
						}

						return renderFormItem(overrideDisabled, restOverrideProps as any)
					}
				)}
			</Form.Item>

			{/* Render Search Modal */}
			{searchModal &&
				React.cloneElement(searchModal, {
					open: isToggle,
					fieldName: name[1],
					fieldValue: form.getFieldValue([tableFormName, ...name]),
					onCancel: () => {
						toggle();
					},
					onSelect: handleSearchSelect,
				})}
		</>
	);
};
