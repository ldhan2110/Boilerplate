/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';
import type { EditProps } from '@/types';
import { Form, Input, type InputProps } from 'antd';
import type { FormListFieldData, Rule } from 'antd/es/form';
import React from 'react';

type InputCellProps<T> = Partial<EditProps<T>> & {
	cellKey: string;
	name: any[] | string;
	field: FormListFieldData;
	tableFormName?: string;
	activeEditingCell?: string | null;
	setActiveEditingCell?: (cellKey: string | null) => void;
	onKeyDown?: (e: React.KeyboardEvent) => void;
} & Omit<InputProps, 'name' | 'onChange'>;

export const InputCell = <T,>({
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
	...props
}: InputCellProps<T>) => {
	const { t, m } = useAppTranslate();
	const form = Form.useFormInstance();

	const mappedRule: Rule[] = React.useMemo(() => {
		if (required)
			return [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])];
		return rules || ([] as Rule[]);
	}, [required, rules, m]);

	/** `overrideEditProps` needs form context; the simple branch never evaluates it (bug for read-only-by-row cells). */
	const useDynamicRender = Boolean(shouldUpdate) || Boolean(overrideEditProps);

	return (
		<Form.Item
			shouldUpdate={(prev, curr) => {
				if (shouldUpdate) return shouldUpdate(prev, curr, name[0]);
				if (overrideEditProps) return true;
				return false;
			}}
		>
			{!useDynamicRender ? (
				<Form.Item
					{...field}
					name={name}
					rules={mappedRule}
					validateTrigger={['onChange', 'onBlur']}
					key={cellKey}
					initialValue={initialValue}
				>
				<Input
					placeholder={t(placeholder as string)}
					onChange={(event) => {
						onChange?.(event.target.value, event, form, name);
					}}
					onKeyDown={(e) => {
								if (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 'Escape') {
									onKeyDown?.(e);
								}
							}}
					onBlur={async () => {
						if (activeEditingCell === cellKey) {
							try {
								await form.validateFields([name]);
								// Validation passed, close edit mode
								setActiveEditingCell?.(null);
							} catch (error) {
								// Validation failed, keep edit mode open
								// Error is already displayed by Form.Item
							}
						}
					}}
					autoFocus
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
						<Input
							placeholder={t(placeholder as string)}
							{...props}
							onChange={(event) => {
								onChange?.(event.target.value, event, form, name);
							}}
							onKeyDown={(e) => {
								if (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 'Escape') {
									onKeyDown?.(e);
								}
							}}
							onBlur={async () => {
								if (activeEditingCell === cellKey) {
									try {
										await form.validateFields([[tableFormName, ...(Array.isArray(name) ? name : [name])]]);
										// Validation passed, close edit mode
										setActiveEditingCell?.(null);
									} catch (error) {
										// Validation failed, keep edit mode open
										// Error is already displayed by Form.Item
									}
								}
							}}
							autoFocus
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
