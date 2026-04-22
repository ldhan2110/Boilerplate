/* eslint-disable @typescript-eslint/no-explicit-any */
import { Form, TimePicker } from 'antd';
import type { FormItemProps } from 'antd/lib';
import type { TimePickerProps } from 'antd/lib';
import dayjs from 'dayjs';

import { FILTER_TYPE } from '@/constants';
import { useAppTranslate } from '@/hooks';
import appStore from '@/stores/AppStore';
import { FilterTypeMenu } from './FilterTypeMenu';

type FilterTimePickerProps = FormItemProps &
	TimePickerProps & {
		filterName: string;
		filterType: string;
		onChange?: (changedValues: any, allValues: any) => void;
	};

export const FilterTimePicker = ({
	name,
	initialValue,
	filterName,
	filterType,
	onChange,
}: FilterTimePickerProps) => {
	const { t } = useAppTranslate();
	const { dateFormat } = appStore.state;
	const form = Form.useFormInstance();
	const filterOperator = Form.useWatch(`${name}Operator`, form);

	// Derive time format from dateFormat (e.g. "DD/MM/YYYY HH:mm:ss" -> "HH:mm")
	const extractedTimeFormat = dateFormat.split(' ')[1] || 'HH:mm';
	const timeFormat = extractedTimeFormat.replace(':ss', '') || 'HH:mm';

	const toDayjs = (value: any) => {
		if (!value) return value;
		if (dayjs.isDayjs(value)) return value;
		const parsed = dayjs(value, timeFormat, true);
		return parsed.isValid() ? parsed : dayjs(value);
	};

	const handleSingleChange = (date: dayjs.Dayjs | null) => {
		const stringValue = date ? date.format(timeFormat) : null;
		form.setFieldValue(name, stringValue);
		onChange?.(
			{ [name as string]: stringValue },
			form.getFieldsValue(),
		);
	};

	const handleRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
		if (!dates) {
			form.setFieldsValue({
				[name as string]: null,
				[`${name as string}To`]: null,
			});
			onChange?.(
				{ [name as string]: null, [`${name as string}To`]: null },
				form.getFieldsValue(),
			);
		} else {
			const [from, to] = dates;
			const fromStr = from ? from.format(timeFormat) : null;
			const toStr = to ? to.format(timeFormat) : null;
			form.setFieldsValue({
				[name as string]: fromStr,
				[`${name as string}To`]: toStr,
			});
			onChange?.(
				{ [name as string]: fromStr, [`${name as string}To`]: toStr },
				form.getFieldsValue(),
			);
		}
	};

	return (
		<div
			onClick={(e) => e.stopPropagation()}
			onMouseDown={(e) => e.stopPropagation()}
			onKeyDown={(e) => e.stopPropagation()}
		>
			{filterOperator !== FILTER_TYPE.BETWEEN.key ? (
				<Form.Item
					name={name}
					initialValue={initialValue}
					getValueProps={(value) => ({ value: toDayjs(value) })}
					getValueFromEvent={(date: dayjs.Dayjs | null) =>
						date ? date.format(timeFormat) : null
					}
					style={{ width: '100%' }}
				>
					<TimePicker
						style={{ width: '100%', fontWeight: 'normal' }}
						placeholder={t('HH:mm')}
						format={timeFormat}
						needConfirm={false}
						onChange={handleSingleChange}
						prefix={
							<FilterTypeMenu
								filterType={filterType}
								filterName={filterName}
								onFilterTableChange={onChange}
								defaultOperator={filterOperator}
							/>
						}
					/>
				</Form.Item>
			) : (
				<>
					<Form.Item name={name} initialValue={initialValue} hidden />
					<Form.Item name={`${name as string}To`} initialValue={initialValue} hidden />
					<TimePicker.RangePicker
						style={{ width: '100%', fontWeight: 'normal' }}
						format={timeFormat}
						needConfirm={false}
						prefix={
							<FilterTypeMenu
								filterType={filterType}
								filterName={filterName}
								onFilterTableChange={onChange}
								defaultOperator={filterOperator}
							/>
						}
						allowClear
						onChange={(dates) =>
							handleRangeChange(
								dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
							)
						}
					/>
				</>
			)}
		</div>
	);
};
