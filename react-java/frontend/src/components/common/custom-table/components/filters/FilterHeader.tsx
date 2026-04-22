/* eslint-disable @typescript-eslint/no-explicit-any */
import { Form } from 'antd';

import type { FilterTableProps } from '@/types';
import { FormInput, FormSelect } from '@/components/common/form';
import { FILTER_TYPE } from '@/constants';
import { FilterDate } from './FilterDate';
import { FilterNumber } from './FilterNumber';
import { FilterTimePicker } from './FilterTimePicker';
import { FilterMultiSelect } from './FilterMultiSelect';
import { FilterTypeMenu } from './FilterTypeMenu';

type FilterHeaderProps = FilterTableProps & {
	onFilterTableChange: (changedValues: any, allValues: any) => void;
};

export const FilterHeader = ({
	showFilter,
	filterName,
	filterType,
	filterInitialValue,
	filterOptions,
	filterNumberType,
	onFilterTableChange,
}: FilterHeaderProps) => {
	function renderFilter() {
		switch (filterType) {
			case 'DATEPICKER':
				return (
					<FilterDate
						name={filterName}
						initialValue={filterInitialValue}
						style={{ fontWeight: 'normal', textAlign: 'left' }}
						onClick={(event) => event.stopPropagation()}
						onChange={onFilterTableChange}
						filterType={filterType}
						filterName={filterName}
					/>
				);
			case 'SELECT':
				return (
					<FormSelect
						name={filterName}
						options={filterOptions}
						initialValue={filterInitialValue}
						style={{ fontWeight: 'normal', textAlign: 'left' }}
						onClick={(event) => event.stopPropagation()}
					/>
				);
			case 'NUMBER':
				return (
					<FilterNumber
						name={filterName}
						initialValue={filterInitialValue}
						style={{ fontWeight: 'normal', textAlign: 'left' }}
						onClick={(event) => event.stopPropagation()}
						onChange={onFilterTableChange as any}
						filterType={filterType}
						filterName={filterName}
						filterNumberType={filterNumberType}
					/>
				);
			case 'TIMEPICKER':
				return (
					<FilterTimePicker
						name={filterName}
						initialValue={filterInitialValue}
						filterName={filterName}
						filterType={filterType}
						onChange={onFilterTableChange}
					/>
				);
			case 'MULTI_SELECT':
				return (
					<FilterMultiSelect
						name={filterName}
						filterOptions={filterOptions}
						initialValue={filterInitialValue}
						filterName={filterName}
						filterType={filterType}
						onChange={onFilterTableChange}
					/>
				);
			default:
				return (
					<FormInput
						name={filterName}
						prefix={
							<FilterTypeMenu
								filterType={filterType}
								filterName={filterName}
								onFilterTableChange={onFilterTableChange}
							/>
						}
						initialValue={filterInitialValue}
						allowClear
						style={{ fontWeight: 'normal', width: '100%' }}
						onClick={(event) => event.stopPropagation()}
					/>
				);
		}
	}

	const defaultOperator =
		filterType === 'MULTI_SELECT' ? FILTER_TYPE.IN.key : FILTER_TYPE.DEFAULT.key;

	return (
		showFilter && (
			<>
				<Form.Item name={`${filterName}Operator`} initialValue={defaultOperator} hidden>
					<input type="hidden" />
				</Form.Item>
				{renderFilter()}
			</>
		)
	);
};
