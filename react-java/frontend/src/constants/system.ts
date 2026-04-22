import { DateFormat } from '@/types';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import dayjs from 'dayjs';

dayjs.extend(customParseFormat);

export const TAB_ACTIONS = {
	CLOSE: 'CLOSE',
	CLOSE_OTHER: 'CLOSE_OTHER',
	REFRESH: 'REFRESH',
	ADD_FAVORITE: 'ADD_FAVORITE',
	REMOVE_FAVORITE: 'REMOVE_FAVORITE',
};

export const FORMAT_TYPE_DATE = [
	{
		code: DateFormat.DD_MM_YYYY_HH_MM_SS,
		label: 'Day/Month/Year',
	},
	{
		code: DateFormat.MM_DD_YYYY_HH_MM_SS,
		label: 'Month/Day/Year',
	},
	{
		code: DateFormat.YYYY_MM_DD_HH_MM_SS,
		label: 'Year/Month/Day',
	},
];

export const ALL_OPTION = { label: 'All', value: 'ALL' };

// Polling interval for export jobs (in milliseconds)
export const POLL_INTERVAL = 1000; // 1 second
