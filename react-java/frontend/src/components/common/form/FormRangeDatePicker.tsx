import React from 'react';
import { DatePicker, Form, type FormItemProps } from 'antd';
import type { Rule } from 'antd/es/form';
import type { RangePickerProps } from 'antd/es/date-picker';
import dayjs from 'dayjs';

import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';
import appStore from '@/stores/AppStore';

const { RangePicker } = DatePicker;

type FormRangeDatePickerProps = RangePickerProps & FormItemProps;

export const FormRangeDatePicker = ({
	name,
	label,
	required,
	rules,
	width,
	placeholder,
	showTime,
	layout,
	initialValue,
	...props
}: FormRangeDatePickerProps) => {
	const { t, m } = useAppTranslate();
	const { dateFormat } = appStore.state;

	const mappedRule: Rule[] = React.useMemo(() => {
		if (required)
			return [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])];
		return rules || ([] as Rule[]);
	}, [required, rules, m]);

	const format = showTime ? dateFormat : dateFormat.split(' ')[0];

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
			<RangePicker
				style={{ width: width || '100%' }}
				placeholder={placeholder}
				format={format}
				showTime={
					showTime
						? {
								defaultValue: [
									dayjs('00:00:00', dateFormat.split(' ')[1]),
									dayjs('23:59:59', dateFormat.split(' ')[1]),
								],
							}
						: false
				}
				{...props}
			/>
		</Form.Item>
	);
};
