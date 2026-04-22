import { useMemo, useState } from 'react';
import { Form } from 'antd';
import type { Rule } from 'antd/es/form';
import type { FormItemProps, InputNumberProps } from 'antd/lib';

import type { RangeValue } from '@/types';
import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';
import { formatNumberAmount, parserNumberAmount } from '@/utils/helper';
import { RangeNumberInput } from '../input';

type FormRangeNumberInputProps = Omit<InputNumberProps, 'placeholder'> &
	FormItemProps & {
		type?: 'amount' | 'number';
		placeholder: [string, string];
	};

export const FormRangeNumberInput = ({
	type = 'number',
	name,
	label,
	required,
	placeholder,
	rules,
	initialValue,
	width,
	...props
}: FormRangeNumberInputProps) => {
	const { t, m } = useAppTranslate();
	const [range, setRange] = useState<RangeValue>([null, null]);

	const mappedRule: Rule[] = useMemo(() => {
		if (required)
			return [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])];
		return rules || ([] as Rule[]);
	}, [required, rules, m]);

	const handleChange = (newValue: RangeValue) => {
		setRange(newValue);
	};

	const customProps = useMemo(() => {
		switch (type) {
			case 'amount':
				return {
					formatter: formatNumberAmount,
					parser: parserNumberAmount,
					...props,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
				} as any;
			default:
				return {
					...props,
				};
		}
	}, [type, props]);

	return (
		<Form.Item
			name={name}
			label={t(label as string)}
			required={required}
			validateTrigger="onBlur"
			rules={mappedRule}
			initialValue={initialValue}
			style={{
				width: '100%',
			}}
		>
			<RangeNumberInput
				{...customProps}
				value={range}
				onChange={handleChange}
				placeholder={placeholder}
				style={{ width: width || '100%', textAlign: 'right' }}
				{...customProps}
			/>
		</Form.Item>
	);
};
