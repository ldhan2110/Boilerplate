/* eslint-disable @typescript-eslint/no-explicit-any */
import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';
import type { EditProps } from '@/types';
import { formatNumberAmount, parserNumberAmount } from '@/utils/helper';
import { Form, InputNumber, type InputProps } from 'antd';
import type { FormListFieldData, Rule } from 'antd/es/form';
import React from 'react';

type InputNumberCellProps<T> = Partial<EditProps<T>> & {
	cellKey: string;
	name: any[] | string;
	field: FormListFieldData;
	tableFormName?: string;
	activeEditingCell?: string | null;
	setActiveEditingCell?: (cellKey: string | null) => void;
	onKeyDown?: (e: React.KeyboardEvent) => void;
} & Omit<InputProps, 'name' | 'onChange'>;

export const InputNumberCell = <T,>({
	cellKey,
	name,
	rules,
	required,
	placeholder,
	field,
	initialValue,
	numberType = 'number',
	tableFormName,
	shouldUpdate,
	overrideEditProps,
	onChange,
	activeEditingCell,
	setActiveEditingCell,
	onKeyDown,
	...props
}: InputNumberCellProps<T>) => {
	const { t, m } = useAppTranslate();
	const form = Form.useFormInstance();

	const mappedRule: Rule[] = React.useMemo(() => {
		if (required)
			return [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])];
		return rules || ([] as Rule[]);
	}, [required, rules, m]);

	const customProps: any = React.useMemo(() => {
		switch (numberType) {
			case 'amount':
				return {
					formatter: formatNumberAmount,
					parser: parserNumberAmount,
					...props,
				};
			default:
				return {
					...props,
				};
		}
	}, [props, numberType]);

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
					<InputNumber
						style={{ width: '100%', textAlign: 'right' }}
						controls={false}
						keyboard={false}
						placeholder={t(placeholder || 'Input number')}
						onChange={(value) => {
							onChange?.(value, null, form, name);
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
								// eslint-disable-next-line @typescript-eslint/no-unused-vars
								} catch (error) {
									// Validation failed, keep edit mode open
									// Error is already displayed by Form.Item
								}
							}
						}}
						autoFocus
						{...customProps}
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
							<InputNumber
								style={{ width: '100%', textAlign: 'right' }}
								controls={false}
								keyboard={false}
								placeholder={t(placeholder || 'Input number')}
								onChange={(value) => {
									onChange?.(value, null, form, name);
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
										// eslint-disable-next-line @typescript-eslint/no-unused-vars
										} catch (error) {
											// Validation failed, keep edit mode open
											// Error is already displayed by Form.Item
										}
									}
								}}
								autoFocus
								{...customProps}
								disabled={overrideDisabled}
								{...restOverrideProps}
							/>
						</Form.Item>
					);
				}
			)}
		</Form.Item>
	);
};
