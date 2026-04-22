import { useMemo } from 'react';
import { Form, Input } from 'antd';
import type { Rule } from 'antd/es/form';
import type { FormItemProps, InputProps } from 'antd/lib';

import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';

type FormInputProps = InputProps &
	FormItemProps & {
		height?: number | string;
	};

export const FormInput = ({
	name,
	label,
	type,
	required,
	placeholder,
	maxLength,
	rules,
	initialValue,
	width,
	height,
	allowClear,
	onKeyDown,
	onBlur,
	...props
}: FormInputProps) => {
	const { t, m } = useAppTranslate();

	const mappedRule: Rule[] = useMemo(() => {
		if (required)
			return [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])];
		return rules || ([] as Rule[]);
	}, [required, rules, m]);

	function renderInput() {
		switch (type) {
			case 'password':
				return (
					<Input.Password
						style={{ height: height || 'auto' }}
						placeholder={t(placeholder || 'Input text')}
						maxLength={maxLength}
						onBlur={onBlur}
						allowClear={allowClear}
						onKeyDown={onKeyDown}
						{...props}
					/>
				);
			default:
				return (
					<Input
						style={{ height: height || 'auto' }}
						placeholder={t(placeholder || 'Input text')}
						maxLength={maxLength}
						onBlur={onBlur}
						allowClear={allowClear}
						onKeyDown={onKeyDown}
						{...props}
					/>
				);
		}
	}

	return (
		<Form.Item
			name={name}
			label={label ? t(label as string) : undefined}
			required={required}
			validateTrigger="onBlur"
			rules={mappedRule}
			initialValue={initialValue}
			style={{
				width: width || '100%',
			}}
			{...props}
		>
			{renderInput()}
		</Form.Item>
	);
};
