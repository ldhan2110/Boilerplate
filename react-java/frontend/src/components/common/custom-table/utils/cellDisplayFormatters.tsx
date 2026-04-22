/* eslint-disable @typescript-eslint/no-explicit-any */
import { ALL_OPTION } from '@/constants';
import appStore from '@/stores/AppStore';
import { formatNumberAmount } from '@/utils/helper';
import type { DefaultOptionType } from 'antd/es/select';
import dayjs from 'dayjs';

/**
 * Format a value for display in a cell based on its type
 */
export function formatCellDisplayValue(
	value: any,
	editType: string | undefined,
	editProps?: {
		numberType?: 'amount' | 'number';
		options?: DefaultOptionType[];
		picker?: 'date' | 'month' | 'year' | 'week' | 'quarter';
		checkboxMapping?: {
			checked: string | number | boolean | object;
			unchecked: string | number | boolean | object;
		};
	},
): string | React.ReactNode {
	if (value === null || value === undefined || value === '') {
		return '';
	}

	// Handle enum values (EDIT_TYPE.TIMEPICKER = 'TIMEPICKER')
	const normalizedEditType = editType;
	
	switch (normalizedEditType) {
		case 'INPUT_NUMBER': {
			const numberType = editProps?.numberType || 'number';
			if (numberType === 'amount') {
				return formatNumberAmount(value);
			}
			return String(value);
		}
		case 'INPUT_NUMBER_DECIMAL': {
			const numberType = editProps?.numberType || 'number';
			if (numberType === 'amount') {
				return formatNumberAmount(value);
			}
			return String(value);
		}

		case 'DATEPICKER': {
			const { dateFormat } = appStore.state;
			const displayFormat = (() => {
				switch (editProps?.picker) {
					case 'month':
						return 'MM/YYYY';
					case 'year':
						return 'YYYY';
					case 'week':
						return 'WW/YYYY';
					case 'quarter':
						return 'QQ/YYYY';
					default:
						return dateFormat.split(' ')[0];
				}
			})();

			if (!dayjs.isDayjs(value)) {
				const parsed = dayjs(value);
				if (!parsed.isValid()) return '';
				return parsed.format(displayFormat);
			}
			return value.format(displayFormat);
		}

		case 'TIMEPICKER': {
			const { dateFormat } = appStore.state;
			const extractedTimeFormat = dateFormat.split(' ')[1] || 'HH:mm';
			const timeFormat = extractedTimeFormat.replace(':ss', '') || 'HH:mm';

			// Handle dayjs objects (TimePicker stores as dayjs via getValueProps)
			if (dayjs.isDayjs(value)) {
				if (value.isValid()) {
					return value.format(timeFormat);
				}
				// Invalid dayjs object, return empty
				return '';
			}

			// Handle string values
			if (typeof value === 'string' && value.trim()) {
				// Try parsing with various time formats
				const timeFormats = [timeFormat, 'HH:mm:ss', 'HH:mm', 'H:mm', 'h:mm A', 'h:mm:ss A'];
				let parsed = dayjs(value, timeFormats, true);
				
				if (!parsed.isValid()) {
					// Try general dayjs parsing (handles ISO strings, etc.)
					parsed = dayjs(value);
				}
				
				return parsed.isValid() ? parsed.format(timeFormat) : value;
			}

			// Handle number timestamps
			if (typeof value === 'number') {
				const parsed = dayjs(value);
				return parsed.isValid() ? parsed.format(timeFormat) : String(value);
			}

			// Handle Date objects
			if (value instanceof Date) {
				const parsed = dayjs(value);
				return parsed.isValid() ? parsed.format(timeFormat) : '';
			}

			// For any other non-null value, try to convert to string and parse
			if (value != null && value !== '') {
				const parsed = dayjs(value);
				return parsed.isValid() ? parsed.format(timeFormat) : String(value);
			}

			return '';
		}

		case 'SELECT': {
			const options = editProps?.options || [];
			const option = options.find((opt) => opt.value === value);
			return option?.label || String(value);
		}

		case 'MULTI_SELECT': {
			const options = editProps?.options || [];
			if (!Array.isArray(value)) return '';
			if (value.includes(ALL_OPTION.value)) return ALL_OPTION.label;
			if (options.length > 0) {
				const selectedCount = new Set(value.filter((v) => v && v !== ALL_OPTION.value)).size;
				if (selectedCount >= options.length) return ALL_OPTION.label;
			}
			const labels = value
				.map((val) => {
					const option = options.find((opt) => opt.value === val);
					return option?.label || String(val);
				})
				.filter(Boolean);
			return labels.join(', ');
		}

		case 'CHECKBOX': {
			const checkboxMapping = editProps?.checkboxMapping || { checked: true, unchecked: false };
			const isChecked = value === checkboxMapping.checked;
			return isChecked ? '✓' : '✗';
		}

		case 'INPUT':
		case 'SEARCH':
		default:
			return String(value);
	}
}
