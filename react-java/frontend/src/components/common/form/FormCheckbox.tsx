import { useMemo } from 'react';
import { Checkbox, Form, type CheckboxProps } from 'antd';
import type { Rule } from 'antd/es/form';
import type { FormItemProps } from 'antd/lib';

import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';

type FormCheckboxProps = CheckboxProps &
	FormItemProps & {
		checkboxMapping?: {
			checked: string | number | boolean | object;
			unchecked: string | number | boolean | object;
		};
		titlePosition?: 'LEFT' | 'RIGHT';
	};

export const FormCheckbox = ({
	name,
	label,
	title,
	required,
	rules,
	checkboxMapping,
	titlePosition = 'RIGHT',
	...props
}: FormCheckboxProps) => {
	const { t, m } = useAppTranslate();

	const mappedRule: Rule[] = useMemo(() => {
		if (required)
			return [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])];
		return rules || ([] as Rule[]);
	}, [required, rules, m]);

	return (
		<Form.Item
			valuePropName="checked"
			name={name}
			label={label ? t(label as string) : undefined}
			rules={mappedRule}
			validateTrigger={['onChange', 'onBlur']}
			getValueFromEvent={(e) => {
				if (checkboxMapping) {
					return e.target.checked ? checkboxMapping.checked : checkboxMapping.unchecked;
				}
				return e.target.checked;
			}}
			getValueProps={(value) => {
				if (checkboxMapping) {
					return { checked: value === checkboxMapping.checked };
				}
				return { checked: !!value };
			}}
		>
			<Checkbox
				{...props}
				style={titlePosition === 'LEFT' ? { flexDirection: 'row-reverse' } : undefined}
			>
				{title ? t(title as string) : ''}
			</Checkbox>
		</Form.Item>
	);
};
