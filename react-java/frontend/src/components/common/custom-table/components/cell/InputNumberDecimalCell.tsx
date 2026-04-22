/* eslint-disable @typescript-eslint/no-explicit-any */
import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';
import type { DecimalEditProps } from '@/types';
import { formatDecimalCommaDisplay, parseDecimalCommaInput } from '@/utils/helper';
import { Form, InputNumber, type InputNumberProps } from 'antd';
import type { FormListFieldData, Rule } from 'antd/es/form';
import React from 'react';

type InputNumberDecimalCellProps<T> = Partial<DecimalEditProps<T>> & {
	cellKey: string;
	name: any[] | string;
	field: FormListFieldData;
	tableFormName?: string;
	activeEditingCell?: string | null;
	setActiveEditingCell?: (cellKey: string | null) => void;
	onKeyDown?: (e: React.KeyboardEvent) => void;
} & Omit<InputNumberProps, 'name' | 'onChange'>;

export const InputNumberDecimalCell = <T,>({
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
	parser,
	formatter,
	onChange,
	activeEditingCell,
	setActiveEditingCell,
	onKeyDown,
	...props
}: InputNumberDecimalCellProps<T>) => {
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
				const amountParser = (input: string | undefined) => {
					const parsedValue = (parser ?? parseDecimalCommaInput)(input);
					if (!parsedValue) return '';
					const [intPart, decPart = ''] = parsedValue.split('.');
					return decPart ? `${intPart}.${decPart.slice(0, 2)}` : intPart;
				};
				return {
					formatter: formatter ?? formatDecimalCommaDisplay,
					parser: amountParser,
					precision: props.precision ?? 2,
					...props,
				};
			default:
				return {
					...props,
				};
		}
	}, [props, numberType, formatter, parser]);

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
