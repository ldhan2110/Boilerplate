/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ALL_OPTION, MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';
import type { EditProps } from '@/types';
import { Form, Select } from 'antd';
import type { FormListFieldData, Rule } from 'antd/es/form';
import type { DefaultOptionType, SelectProps } from 'antd/es/select';
import React from 'react';

type MultiSelectCellProps<T> = Partial<EditProps<T>> & {
	cellKey: string;
	name: any[] | string;
	field: FormListFieldData;
	allowSelectAll?: boolean;
	tableFormName?: string;
	activeEditingCell?: string | null;
	setActiveEditingCell?: (cellKey: string | null) => void;
	onKeyDown?: (e: React.KeyboardEvent) => void;
} & Omit<SelectProps, 'name' | 'onChange'>;

export const MultiSelectCell = <T,>({
	cellKey,
	name,
	rules,
	required,
	placeholder,
	field,
	allowSelectAll,
	options,
	initialValue,
	tableFormName,
	shouldUpdate,
	overrideEditProps,
	onChange,
	activeEditingCell,
	setActiveEditingCell,
	onKeyDown,
	...props
}: MultiSelectCellProps<T>) => {
	const { t, m } = useAppTranslate();
	const form = Form.useFormInstance();

	const mappedRule: Rule[] = React.useMemo(() => {
		if (required)
			return [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])];
		return rules || ([] as Rule[]);
	}, [required, rules, m]);

	function handleFilter(input: string, option: DefaultOptionType | undefined) {
		return ((option?.label || '') as string).toLowerCase().includes(input.toLowerCase());
	}

	function normalizeSelectedValues(values: string[] = []): string[] {
		if (!allowSelectAll) return values;
		if (!values.includes(ALL_OPTION.value)) return values;

		return (options || []).map((o) => String(o.value));
	}

	function handleAllAwareChange(
		values: string[],
		option?: DefaultOptionType | DefaultOptionType[],
	) {
		const normalizedValues = normalizeSelectedValues(values);
		onChange?.(normalizedValues, option, form, name);
	}

	return (
		<Form.Item shouldUpdate={(prev, curr) => shouldUpdate?.(prev, curr, name[0]) ?? false}>
			{!shouldUpdate ? (
				<Form.Item
					{...field}
					name={name}
					rules={mappedRule}
					validateTrigger={['onChange', 'onBlur']}
					getValueFromEvent={(values: string[]) => normalizeSelectedValues(values)}
					key={cellKey}
					initialValue={initialValue}
				>
					<Select
						style={{ width: '100%' }}
						allowClear
						showSearch
						mode="multiple"
						maxTagCount="responsive"
						filterOption={handleFilter}
						placeholder={t((placeholder as string) || 'Select value')}
						options={
							allowSelectAll && (options ?? []).length != 0
								? [{ label: t(ALL_OPTION.label), value: ALL_OPTION.value }, ...(options || [])]
								: options
						}
						onKeyDown={(e) => {
							// Close dropdown on Tab and navigate
							if (e.key === 'Tab') {
								onKeyDown?.(e);
							}
						}}
						onChange={handleAllAwareChange}
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
							getValueFromEvent={(values: string[]) => normalizeSelectedValues(values)}
							key={cellKey}
							initialValue={initialValue}
						>
							<Select
								style={{ width: '100%' }}
								allowClear
								showSearch
								mode="multiple"
								maxTagCount="responsive"
								filterOption={handleFilter}
								placeholder={t((placeholder as string) || 'Select value')}
								options={
									allowSelectAll && (options ?? []).length != 0
										? [{ label: t(ALL_OPTION.label), value: ALL_OPTION.value }, ...(options || [])]
										: options
								}
								onKeyDown={(e) => {
									// Close dropdown on Tab and navigate
									if (e.key === 'Tab') {
										onKeyDown?.(e);
									}
								}}
								onChange={handleAllAwareChange}
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
