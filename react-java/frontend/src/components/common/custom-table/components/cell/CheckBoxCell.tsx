/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';
import type { EditProps } from '@/types';
import { Checkbox, Form, Switch } from 'antd';
import type { FormListFieldData, Rule } from 'antd/es/form';
import type { CheckboxProps } from 'antd/lib';
import React from 'react';

export type CheckBoxCellProps<T> = Partial<EditProps<T>> & {
	cellKey: string;
	name: any[] | string;
	field: FormListFieldData;
	allowSelectAll?: boolean;
	tableFormName?: string;
	activeEditingCell?: string | null;
	checkboxMapping: {
		checked: string | number | boolean | object;
		unchecked: string | number | boolean | object;
	};
	
	setActiveEditingCell?: (cellKey: string | null) => void;
	onKeyDown?: (e: React.KeyboardEvent) => void;
} & Omit<CheckboxProps, 'name' | 'onChange'>;

export const CheckBoxCell = <T,>({
	cellKey,
	name,
	rules,
	required,
	field,
	initialValue,
	checkboxMapping,
	checkboxAsSwitch,
	tableFormName,
	activeEditingCell,
	setActiveEditingCell,
	shouldUpdate,
	overrideEditProps,
	onChange,
	onKeyDown,
	...props
}: CheckBoxCellProps<T>) => {
	const { m } = useAppTranslate();
	const form = Form.useFormInstance();
	const mappedRule: Rule[] = React.useMemo(() => {
		if (required)
			return [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])];
		return rules || ([] as Rule[]);
	}, [required, rules, m]);

	const isSwitch = !!checkboxAsSwitch;
	const mapChecked = (value: any) => value === checkboxMapping.checked;
	const mapEventToValue = (e: any) => {
		if (typeof e === 'boolean') {
			return e ? checkboxMapping.checked : checkboxMapping.unchecked;
		}
		return e?.target?.checked ? checkboxMapping.checked : checkboxMapping.unchecked;
	};

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
					valuePropName="checked"
					getValueFromEvent={mapEventToValue}
					getValueProps={(value) => ({ checked: mapChecked(value) })}
				>
					{isSwitch ? (
						<Switch
							{...(props as any)}
							onKeyDown={(e: React.KeyboardEvent<Element>) => {
								// Toggle on Space, navigate on Tab
								if (e.key === ' ') {
									e.preventDefault();
									const currentValue = form.getFieldValue(name);
									const isChecked = currentValue === checkboxMapping.checked;
									form.setFieldValue(
										name,
										isChecked ? checkboxMapping.unchecked : checkboxMapping.checked,
									);
								} else if (["Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Escape"].includes(e.key)) {
									onKeyDown?.(e);
									}
							}}
							onChange={(checked, event) => {
								onChange?.(
									checked ? checkboxMapping.checked : checkboxMapping.unchecked,
									event,
									form,
									name,
								);
							}}
						/>
					) : (
						<Checkbox
							{...props}
							style={{ width: '100%' }}
							className="flex justify-center"
							onKeyDown={(e) => {
								// Toggle on Space, navigate on Tab
								if (e.key === ' ') {
									e.preventDefault();
									const currentValue = form.getFieldValue(name);
									const isChecked = currentValue === checkboxMapping.checked;
									form.setFieldValue(name, isChecked ? checkboxMapping.unchecked : checkboxMapping.checked);
								} else if (["Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Escape"].includes(e.key)) {
									onKeyDown?.(e);
									}
							}}
							onChange={(event) => {
								onChange?.(
									event.target.checked ? checkboxMapping.checked : checkboxMapping.unchecked,
									event,
									form,
									name,
								);
							}}
						/>
					)}
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
							rules={mappedRule}
							validateTrigger={['onChange', 'onBlur']}
							key={cellKey}
							initialValue={initialValue}
							valuePropName="checked"
							getValueFromEvent={mapEventToValue}
							getValueProps={(value) => ({ checked: mapChecked(value) })}
						>
					{isSwitch ? (
						<Switch
							{...(props as any)}
									onKeyDown={(e: React.KeyboardEvent<Element>) => {
										// Toggle on Space, navigate on Tab
										if (e.key === ' ') {
											e.preventDefault();
											const currentValue = form.getFieldValue([
												tableFormName,
												...(Array.isArray(name) ? name : [name]),
											]);
											const isChecked = currentValue === checkboxMapping.checked;
											form.setFieldValue(
												[tableFormName, ...(Array.isArray(name) ? name : [name])],
												isChecked ? checkboxMapping.unchecked : checkboxMapping.checked,
											);
										} else if (["Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Escape"].includes(e.key)) {
											onKeyDown?.(e);
											}
									}}
									onChange={(checked, event) => {
										onChange?.(
											checked ? checkboxMapping.checked : checkboxMapping.unchecked,
											event,
											form,
											name,
										);
									}}
									disabled={overrideDisabled}
									{...(restOverrideProps as any)}
								/>
							) : (
								<Checkbox
									{...props}
									style={{ width: '100%' }}
									className="flex justify-center"
									onKeyDown={(e) => {
										// Toggle on Space, navigate on Tab
										if (e.key === ' ') {
											e.preventDefault();
											const currentValue = form.getFieldValue([
												tableFormName,
												...(Array.isArray(name) ? name : [name]),
											]);
											const isChecked = currentValue === checkboxMapping.checked;
											form.setFieldValue(
												[tableFormName, ...(Array.isArray(name) ? name : [name])],
												isChecked ? checkboxMapping.unchecked : checkboxMapping.checked,
											);
										} else if (["Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Escape"].includes(e.key)) {
											onKeyDown?.(e);
											}
									}}
									onChange={(event) => {
										onChange?.(
											event.target.checked ? checkboxMapping.checked : checkboxMapping.unchecked,
											event,
											form,
											name,
										);
									}}
									disabled={overrideDisabled}
									{...(restOverrideProps as any)}
								/>
							)}
						</Form.Item>
					);
				}
			)}
		</Form.Item>
	);
};
