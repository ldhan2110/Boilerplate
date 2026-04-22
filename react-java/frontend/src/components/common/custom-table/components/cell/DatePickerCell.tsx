/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';
import appStore from '@/stores/AppStore';
import type { EditProps } from '@/types';
import { Form, DatePicker, type DatePickerProps } from 'antd';
import type { FormListFieldData, Rule } from 'antd/es/form';
import React from 'react';

type DatePickerCellProps<T> = Partial<EditProps<T>> & {
	cellKey: string;
	name: any[] | string;
	field: FormListFieldData;
	tableFormName?: string;
	activeEditingCell?: string | null;
	setActiveEditingCell?: (cellKey: string | null) => void;
	onKeyDown?: (e: React.KeyboardEvent) => void;
} & Omit<DatePickerProps, 'name' | 'onChange'>;

export const DatePickerCell = <T,>({
	cellKey,
	name,
	rules,
	required,
	placeholder,
	field,
	initialValue,
	tableFormName,
	shouldUpdate,
	overrideEditProps,
	onChange,
	activeEditingCell,
	setActiveEditingCell,
	onKeyDown,
	picker,
	...props
}: DatePickerCellProps<T>) => {
	const { t, m } = useAppTranslate();
	const form = Form.useFormInstance();
	const { dateFormat } = appStore.state;
	const fieldPath = React.useMemo(
		() =>
			tableFormName
				? [tableFormName, ...(Array.isArray(name) ? name : [name])]
				: (name as (string | number)[]),
		[tableFormName, name],
	);

	const mappedRule: Rule[] = React.useMemo(() => {
		if (required)
			return [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])];
		return rules || ([] as Rule[]);
	}, [required, rules, m]);

	const format = React.useMemo(() => {
		if (picker === 'month') return 'MM/YYYY';
		if (picker === 'year') return 'YYYY';
		if (picker === 'week') return 'WW/YYYY';
		if (picker === 'quarter') return 'QQ/YYYY';
		// For date picker, use the date part from dateFormat (DD/MM/YYYY, MM/DD/YYYY, or YYYY/MM/DD)
		return dateFormat.split(' ')[0];
	}, [picker, dateFormat]);

	return (
		<Form.Item shouldUpdate={(prev, curr) => shouldUpdate?.(prev, curr, name[0]) ?? false}>
			{!shouldUpdate ? (
				<Form.Item
					{...field}
					name={name}
					rules={mappedRule}
					validateTrigger={['onChange', 'onBlur']}
					key={cellKey}
					initialValue={initialValue}
				>
					<DatePicker
						style={{ width: '100%' }}
						placeholder={t(placeholder as string)}
						format={format}
						picker={picker}
						onKeyDown={(e) => {
							if (e.key === 'Tab') {
								onKeyDown?.(e);
							}
							if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 'Escape') {
								const pickerDropdown = document.querySelector('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)');
								if (!pickerDropdown) {
									onKeyDown?.(e);
								}
							}
						}}
						onChange={(date, dateString) => {
							onChange?.(date, dateString, form, name);
							// Don't close on onChange - let onOpenChange handle it after validation
						}}
						onOpenChange={async (open) => {
							// Only close edit mode when picker closes
							if (!open && activeEditingCell === cellKey) {
								try {
									await form.validateFields([fieldPath]);
									// Validation passed, close edit mode
									setActiveEditingCell?.(null);
								} catch (error) {
									// Validation failed, keep edit mode open
									// Error is already displayed by Form.Item
								}
							}
						}}
						{...props}
					/>
				</Form.Item>
			) : (
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
								}, // clears error + border
							]);
						}, 0);
					}

					return (
						<Form.Item
							{...field}
							name={name}
							rules={overrideDisabled ? [] : mappedRule}
							validateTrigger={['onChange', 'onBlur']}
							key={cellKey}
							initialValue={initialValue}
						>
							<DatePicker
								style={{ width: '100%' }}
								placeholder={t(placeholder as string)}
								format={format}
								picker={picker}
								onKeyDown={(e) => {
									if (e.key === 'Tab') {
										onKeyDown?.(e);
									}
									if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 'Escape') {
										const pickerDropdown = document.querySelector('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)');
										if (!pickerDropdown) {
											onKeyDown?.(e);
										}
									}
								}}
								onChange={(date, dateString) => {
									onChange?.(date, dateString, form, name);
									// Don't close on onChange - let onOpenChange handle it after validation
								}}
								onOpenChange={async (open) => {
									// Only close edit mode when picker closes
									if (!open && activeEditingCell === cellKey) {
										try {
											await form.validateFields([fieldPath]);
											// Validation passed, close edit mode
											setActiveEditingCell?.(null);
										} catch (error) {
											// Validation failed, keep edit mode open
											// Error is already displayed by Form.Item
										}
									}
								}}
								{...props}
								disabled={overrideDisabled}
								{...(restOverrideProps as any)}
							/>
						</Form.Item>
					);
				}
			)}
		</Form.Item>
	);
};
