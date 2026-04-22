import React from 'react';
import { DatePicker, Form, type FormItemProps } from 'antd';
import type { Rule } from 'antd/es/form';
import type { DatePickerProps } from 'antd/lib';
import dayjs from 'dayjs';

import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';
import appStore from '@/stores/AppStore';

type FormDatePickerProps = DatePickerProps & FormItemProps;

export const FormDatePicker = ({
	name,
	label,
	required,
	rules,
	width,
	placeholder,
	showTime,
	initialValue,
	...props
}: FormDatePickerProps) => {
	const { t, m } = useAppTranslate();
	const { dateFormat } = appStore.state;

	const mappedRule: Rule[] = React.useMemo(() => {
		if (required)
			return [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])];
		return rules || ([] as Rule[]);
	}, [required, rules, m]);

	const defaultFormat = !showTime ? dateFormat.split(' ')[0] : dateFormat;
	const defaultPlaceholder = (placeholder as string) || defaultFormat;

	return (
		<Form.Item
			name={name}
			label={t(label as string)}
			required={required}
			validateTrigger="onBlur"
			rules={mappedRule}
			initialValue={initialValue}
			style={{ width: width || '100%' }}
		>
			<DatePicker
				style={{ width: width || '100%' }}
				showTime={showTime ? { defaultValue: dayjs('00:00:00', dateFormat.split(' ')[1]) } : false}
				{...props}
				placeholder={t(placeholder as string || defaultPlaceholder)}
				format={props.format || defaultFormat}
			/>
		</Form.Item>
	);
};
