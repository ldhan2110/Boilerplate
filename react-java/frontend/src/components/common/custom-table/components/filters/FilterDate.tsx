/* eslint-disable @typescript-eslint/no-explicit-any */
import { DatePicker, Form } from 'antd';
import type { DatePickerProps, FormItemProps } from 'antd/lib';
import type { RangePickerProps } from 'antd/lib/date-picker';

import { FILTER_TYPE } from '@/constants';
import { useAppTranslate } from '@/hooks';
import appStore from '@/stores/AppStore';
import { FilterTypeMenu } from './FilterTypeMenu';

type FilterDateProps = FormItemProps &
	DatePickerProps &
	RangePickerProps & {
		filterName: string;
		filterType: string;
	};

export const FilterDate = ({
	name,
	initialValue,
	filterName,
	filterType,
	onChange,
}: FilterDateProps) => {
	const { t } = useAppTranslate();
	const { dateFormat } = appStore.state;
	const form = Form.useFormInstance();
	const filterOperator = Form.useWatch(`${name}Operator`, form);

	return (
		<>
			<div
				onClick={(event) => {
					event.stopPropagation();
				}}
				onMouseDown={(event) => {
					event.stopPropagation();
				}}
				onKeyDown={(event) => {
					event.stopPropagation();
				}}
			>
				{filterOperator != FILTER_TYPE.BETWEEN.key ? (
					<Form.Item name={name} initialValue={initialValue} style={{ width: '100%' }}>
						<DatePicker
							style={{ width: '100%', fontWeight: 'normal' }}
							placeholder={t(dateFormat.split(' ')[0])}
							format={dateFormat.split(' ')[0]}
							onChange={(date) => {
								form.setFieldValue(name, date);
								onChange?.(
									{
										[name]: date,
									} as any,
									form.getFieldsValue(),
								);
							}}
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
						<Form.Item name={`${name}To`} initialValue={initialValue} hidden />
						<DatePicker.RangePicker
							style={{ width: '100%', fontWeight: 'normal' }}
							format={dateFormat.split(' ')[0]}
							prefix={
								<FilterTypeMenu
									filterType={filterType}
									filterName={filterName}
									onFilterTableChange={onChange}
									defaultOperator={filterOperator}
								/>
							}
							allowClear
							allowEmpty
							onChange={(dates) => {
								if (!dates) {
									form.setFieldsValue({
										[name]: null,
										[`${name}To`]: null,
									});
									onChange?.(
										{
											[name]: null,
											[`${name}To`]: null,
										} as any,
										form.getFieldsValue(),
									);
								} else {
									const [dateFrom, dateTo] = Array.from(dates);
									form.setFieldsValue({
										[name]: dateFrom,
										[`${name}To`]: dateTo,
									});
									onChange?.(
										{
											[name]: dateFrom,
											[`${name}To`]: dateTo,
										} as any,
										form.getFieldsValue(),
									);
								}
							}}
						/>
					</>
				)}
			</div>
		</>
	);
};
