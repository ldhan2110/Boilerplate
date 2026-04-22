import { useMemo } from 'react';
import { Form, TimePicker, type FormItemProps } from 'antd';
import type { Rule } from 'antd/es/form';
import type { TimePickerProps } from 'antd/lib';

import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';
import appStore from '@/stores/AppStore';

type FormTimePickerProps = TimePickerProps & FormItemProps;

export const FormTimePicker = ({
	name,
	label,
	required,
	rules,
	width,
	placeholder,
	initialValue,
	...props
}: FormTimePickerProps) => {
	const { t, m } = useAppTranslate();
	const { dateFormat } = appStore.state;

	// Extract time format from dateFormat and remove seconds (e.g., "DD/MM/YYYY HH:mm:ss" -> "HH:mm")
	const extractedTimeFormat = dateFormat.split(' ')[1] || 'HH:mm';
	const timeFormat = extractedTimeFormat.replace(':ss', '') || 'HH:mm';

	const mappedRule: Rule[] = useMemo(() => {
		if (required)
			return [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])];
		return rules || ([] as Rule[]);
	}, [required, rules, m]);

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
			<TimePicker
				style={{ width: width || '100%' }}
				placeholder={"HH:mm"}
				format={timeFormat}
				needConfirm={false}
				{...props}
			/>
		</Form.Item>
	);
};

