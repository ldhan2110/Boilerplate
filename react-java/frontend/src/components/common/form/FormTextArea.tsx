import { useMemo } from 'react';
import { Form, Input } from 'antd';
import type { Rule } from 'antd/es/form';
import type { TextAreaProps } from 'antd/es/input';
import type { FormItemProps } from 'antd/lib';

import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';

type FormTextAreaProps = TextAreaProps & FormItemProps;

export const FormTextArea = ({
	name,
	label,
	required,
	placeholder,
	rules,
	...props
}: FormTextAreaProps) => {
	const { t, m } = useAppTranslate();

	const mappedRule: Rule[] = useMemo(() => {
		if (required)
			return [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])];
		return rules || ([] as Rule[]);
	}, [required, rules, m]);

	return (
		<Form.Item
			name={name}
			label={label ? t(label as string) : undefined}
			required={required}
			validateTrigger="onBlur"
			rules={mappedRule}
		>
			<Input.TextArea rows={3} placeholder={t(placeholder || 'Input text')} {...props} />
		</Form.Item>
	);
};
