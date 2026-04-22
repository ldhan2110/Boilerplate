import { useMemo } from 'react';
import { Form, Select, type FormItemProps, type SelectProps } from 'antd';
import type { Rule } from 'antd/es/form';
import type { DefaultOptionType } from 'antd/es/select';

import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';
import { getTextFromLabel } from '@/utils/helper';

type FormSelectProps = SelectProps &
	FormItemProps & {
		width?: number | string;
		height?: number | string;
	};

export const FormSelect = ({
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
}: FormSelectProps) => {
	const { t, m } = useAppTranslate();

	const mappedRule: Rule[] = useMemo(() => {
		if (required)
			return [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])];
		return rules || ([] as Rule[]);
	}, [rules, required, m]);

	function handleFilter(input: string, option: DefaultOptionType | undefined) {
		return (getTextFromLabel(option?.label || '') as string).toLowerCase().includes(input.toLowerCase());
	}

	return (
		<Form.Item
			name={name}
			label={t(label as string)}
			required={required}
			validateTrigger="onBlur"
			rules={mappedRule}
			initialValue={initialValue}
			style={{ width: width || '100%' }}
			layout={layout}
		>
			<Select
				style={{ width: width || '100%', height: height || 'auto' }}
				allowClear
				showSearch
				filterOption={handleFilter}
				placeholder={t((placeholder as string) || 'Select value')}
				options={options?.map((option) => ({
					label:
						typeof option.label === 'string'
							? t(option.label)
							: option?.label,
					value: option.value,
					...('selectionLabel' in option &&
						option.selectionLabel !== undefined && {
						selectionLabel: option.selectionLabel,
					}),
				}))}
				{...props}
			/>
		</Form.Item>
	);
};
