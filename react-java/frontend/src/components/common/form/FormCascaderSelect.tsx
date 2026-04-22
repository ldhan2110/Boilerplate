import { useMemo } from 'react';
import { Form, type FormItemProps } from 'antd';
import type { Rule } from 'antd/es/form';

import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';
import { CascaderSelect, type CascaderSelectProps } from '@/components/common/input/cascader-select';

type FormCascaderSelectProps = CascaderSelectProps &
	FormItemProps & {
		width?: number | string;
		height?: number | string;
	};

export const FormCascaderSelect = ({
	name,
	label,
	required,
	placeholder,
	rules,
	width,
	height,
	initialValue,
	layout,
	options,
	...props
}: FormCascaderSelectProps) => {
	const { t, m } = useAppTranslate();

	const mappedRule: Rule[] = useMemo(() => {
		if (required)
			return [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])];
		return rules || ([] as Rule[]);
	}, [rules, required, m]);

	return (
		<Form.Item
			name={name}
			label={label ? t(label as string) : undefined}
			required={required}
			validateTrigger="onBlur"
			rules={mappedRule}
			initialValue={initialValue}
			style={{ width: width || '100%' }}
			layout={layout}
		>
			<CascaderSelect
				style={{ width: width || '100%', height: height || 'auto' }}
				placeholder={placeholder || t('Please select')}
				options={options}
				{...props}
			/>
		</Form.Item>
	);
};
