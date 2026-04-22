/* eslint-disable @typescript-eslint/no-explicit-any */
import { FilterValueType, type FilterOperator } from '@/constants';
import type { DynamicFilterDto } from '@/types';
import { convertDate, convertToDBColumn } from '@/utils/helper';
import { isEmpty } from 'lodash';
import dayjs from 'dayjs';

export function getValueType(value: any): FilterValueType {
	if (Array.isArray(value)) return FilterValueType.ARRAY;
	if (typeof value === 'number') return FilterValueType.NUMBER;
	if (typeof value === 'boolean') return FilterValueType.BOOLEAN;
	if (typeof value === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(value)) return FilterValueType.TIME;
	if (dayjs.isDayjs(value)) return FilterValueType.DATE;
	return FilterValueType.STRING;
}

export function getValue(value: any, valueType: FilterValueType): any {
	if (valueType == 'DATE') return convertDate(value);
	return value;
}

export function toDynamicFilterList(input: Record<string, any>): DynamicFilterDto[] {
	const result: DynamicFilterDto[] = [];

	for (const [key, value] of Object.entries(input)) {
		if (key.endsWith('Operator')) {
			const field = key.replace('Operator', '');
			const fieldValue = input[field];
			const fieldValueTo = input[`${field}To`];
			const valueType = getValueType(fieldValue);
			const convertedValue = getValue(fieldValue, valueType);
			const convertedValueTo = getValue(fieldValueTo, valueType);

			if (!isEmpty(fieldValue) || (typeof fieldValue === 'number' && !Number.isNaN(fieldValue))) {
				result.push({
					field: convertToDBColumn(field),
					operator: value as FilterOperator,
					value: convertedValue,
					valueTo: convertedValueTo,
					valueType: valueType,
				});
			}
		}
	}

	return result;
}
