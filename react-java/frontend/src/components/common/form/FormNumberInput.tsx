import { useCallback } from 'react';
import { Form, InputNumber } from 'antd';
import type { Rule } from 'antd/es/form';
import type { FormItemProps, InputNumberProps } from 'antd/lib';

import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';
import { formatNumberAmount, parserNumberAmount } from '@/utils/helper';

type FormNumberInputProps = InputNumberProps &
	FormItemProps & {
		type?: 'amount' | 'number';
		height?: number | string;
	};

export const FormNumberInput = ({
	type = 'number',
	name,
	label,
	required,
	placeholder,
	maxLength,
	rules,
	width,
	initialValue,
	height,
	...props
}: FormNumberInputProps) => {
	const { t, m } = useAppTranslate();

	const handleFocus = useCallback(
		(e: React.FocusEvent<HTMLInputElement>) => {
			requestAnimationFrame(() => e.target.select());
			props.onFocus?.(e);
		},
		[props.onFocus],
	);

	const mappedRule: Rule[] = required
		? [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])]
		: rules || [];

	const precision = (props as InputNumberProps).precision ?? 2;
	const customProps: InputNumberProps =
		type === 'amount'
			? {
					formatter: (value?: string | number) => formatNumberAmount(value ?? '', precision),
					parser: parserNumberAmount,
					precision,
					...props,
				}
			: { ...props };

	return (
		<Form.Item
			name={name}
			label={label}
			required={required}
			validateTrigger="onBlur"
			rules={mappedRule}
			initialValue={initialValue}
			style={{
				width: '100%',
			}}
		>
			<InputNumber
				style={{
					width: '100%',
					height: height || 'auto',
					textAlign: 'right',
					paddingTop: 0,
					paddingBottom: 0,
				}}
				controls={false}
				placeholder={t(placeholder || 'Input number')}
				maxLength={maxLength}
				{...customProps}
				onFocus={handleFocus}
			/>
		</Form.Item>
	);
};
