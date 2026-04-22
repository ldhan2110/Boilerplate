/* eslint-disable @typescript-eslint/no-explicit-any */
import { Form, Select } from 'antd';
import type { FormItemProps } from 'antd/lib';
import type { DefaultOptionType, SelectProps } from 'antd/es/select';

import { FILTER_TYPE } from '@/constants';
import { useAppTranslate } from '@/hooks';
import { FilterTypeMenu } from './FilterTypeMenu';

type FilterMultiSelectProps = FormItemProps &
	Omit<SelectProps, 'onChange'> & {
		filterName: string;
		filterType: string;
		filterOptions?: DefaultOptionType[];
		onChange?: (changedValues: any, allValues: any) => void;
	};

export const FilterMultiSelect = ({
	name,
	initialValue,
	filterName,
	filterType,
	filterOptions,
	onChange,
}: FilterMultiSelectProps) => {
	const { t } = useAppTranslate();
	const form = Form.useFormInstance();
	const filterOperator = Form.useWatch(`${name}Operator`, form);

	function handleFilter(input: string, option: DefaultOptionType | undefined) {
		return ((option?.label || '') as string).toLowerCase().includes(input.toLowerCase());
	}

	function handleChange(values: string[]) {
		form.setFieldValue(name, values);
		onChange?.({ [name as string]: values }, form.getFieldsValue());
	}

	return (
		<div
			onClick={(e) => e.stopPropagation()}
			onMouseDown={(e) => e.stopPropagation()}
			onKeyDown={(e) => e.stopPropagation()}
		>
			<Form.Item name={name} initialValue={initialValue} style={{ width: '100%' }}>
				<Select
					style={{ width: '100%', fontWeight: 'normal' }}
					allowClear
					showSearch
					mode="multiple"
					maxTagCount="responsive"
					filterOption={handleFilter}
					placeholder={t('Select value')}
					options={filterOptions}
					prefix={
						<FilterTypeMenu
							filterType={filterType}
							filterName={filterName}
							onFilterTableChange={onChange}
							defaultOperator={filterOperator}
						/>
					}
					onChange={handleChange}
				/>
			</Form.Item>
			{/* Ensure the operator hidden field stays in sync for BETWEEN-style resets */}
			{filterOperator === FILTER_TYPE.BETWEEN.key && (
				<Form.Item name={`${name as string}To`} initialValue={initialValue} hidden />
			)}
		</div>
	);
};
