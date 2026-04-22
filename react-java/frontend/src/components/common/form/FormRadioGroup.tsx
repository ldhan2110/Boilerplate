import { useMemo } from 'react';
import { Form, Radio, type RadioGroupProps } from 'antd';
import type { Rule } from 'antd/es/form';
import type { FormItemProps } from 'antd/lib';

import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';

type FormRadioGroupProps = RadioGroupProps & FormItemProps;

export const FormRadioGroup = ({
	name,
	label,
	required,
	rules,
	options,
	className,
	...props
}: FormRadioGroupProps) => {
	const { m } = useAppTranslate();

	const mappedRule: Rule[] = useMemo(() => {
		if (required)
			return [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])];
		return rules || ([] as Rule[]);
	}, [required, rules, m]);

	return (
		<Form.Item
			name={name}
			label={label}
			required={required}
			validateTrigger="onBlur"
			rules={mappedRule}
		>
			<Radio.Group
				options={options}
				className={className ? `upload-dnd ${className}` : 'upload-dnd'}
				{...props}
			/>
		</Form.Item>
	);
};
