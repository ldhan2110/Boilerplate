import type { DragIndexState } from '@/types';
import { FontSizeOutlined, SearchOutlined } from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd';

export const DEFAULT_PAGE_SIZE_OPTIONS = ['15', '30', '50'];
export const DEFAULT_PAGE_SIZE = 15;
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_OPTIONS: TablePaginationConfig = {
	showSizeChanger: true,
	pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
	position: ['bottomLeft'],
};

export const DEFAULT_TABLE_STATE = {
	pagination: {
		total: 0,
		current: DEFAULT_PAGE,
		pageSize: DEFAULT_PAGE_SIZE,
	},
	rowSelection: [],
};

export const DEFAULT_PAGINATION = {
	total: 0,
	current: DEFAULT_PAGE,
	pageSize: DEFAULT_PAGE_SIZE,
};

export const dragActiveStyle = (dragState: DragIndexState, id: string) => {
	const { active, over } = dragState;
	// drag active style
	let style: React.CSSProperties = {};
	if (active && active === id) {
		style = { backgroundColor: 'gray', opacity: 0.5 };
	} else if (over && id === over && active !== over) {
		style = { borderInlineStart: '1px dashed gray' };
	}
	return style;
};

export const FILTER_TYPE = {
	EQUALS: {
		key: 'EQUALS',
		value: 'EQUALS',
		label: 'Equals',
		icon: <span style={{ fontSize: '12px' }}>=</span>,
	},
	NOT_EQUALS: {
		key: 'NOT_EQUALS',
		value: 'NOT_EQUALS',
		label: 'Not Equals',
		icon: <span style={{ fontSize: '12px' }}>≠</span>,
	},
	CONTAINS: {
		key: 'CONTAINS',
		value: 'CONTAINS',
		label: 'Contains',
		icon: (
			<span style={{ fontSize: '12px' }}>
				<FontSizeOutlined />
			</span>
		),
	},
	LESS_THAN: {
		key: 'LESS_THAN',
		value: 'LESS_THAN',
		label: 'Less Than',
		icon: <span style={{ fontSize: '12px' }}>{'<'}</span>,
	},
	GREATER_THAN: {
		key: 'GREATER_THAN',
		value: 'GREATER_THAN',
		label: 'Greater Than',
		icon: <span style={{ fontSize: '12px' }}>{'>'}</span>,
	},
	LESS_OR_EQUAL: {
		key: 'LESS_OR_EQUAL',
		value: 'LESS_OR_EQUAL',
		label: 'Less or equal to',
		icon: <span style={{ fontSize: '12px' }}>{'≤'}</span>,
	},
	GREATER_OR_EQUAL: {
		key: 'GREATER_OR_EQUAL',
		value: 'GREATER_OR_EQUAL',
		label: 'Greater or equal',
		icon: <span style={{ fontSize: '12px' }}>{'≥'}</span>,
	},
	BETWEEN: {
		key: 'BETWEEN',
		value: 'BETWEEN',
		label: 'Between',
		icon: <span style={{ fontSize: '12px' }}>↔</span>,
	},
	IN: {
		key: 'IN',
		value: 'IN',
		label: 'In',
		icon: <span style={{ fontSize: '12px' }}>∈</span>,
	},
	NOT_IN: {
		key: 'NOT_IN',
		value: 'NOT_IN',
		label: 'Not In',
		icon: <span style={{ fontSize: '12px' }}>∉</span>,
	},
	DEFAULT: {
		key: 'RESET',
		value: 'RESET',
		label: 'Reset',
		icon: (
			<span>
				<SearchOutlined />
			</span>
		),
	},
};

export enum FilterOperator {
	EQUALS = 'EQUALS',
	NOT_EQUALS = 'NOT_EQUALS',
	GREATER_THAN = 'GREATER_THAN',
	LESS_THAN = 'LESS_THAN',
	GREATER_OR_EQUAL = 'GREATER_OR_EQUAL',
	LESS_OR_EQUAL = 'LESS_OR_EQUAL',
	IN = 'IN',
	NOT_IN = 'NOT_IN',
	CONTAINS = 'CONTAINS',
	BETWEEN = 'BETWEEN',
}

export enum FilterValueType {
	STRING = 'STRING',
	NUMBER = 'NUMBER',
	DATE = 'DATE',
	BOOLEAN = 'BOOLEAN',
	ARRAY = 'ARRAY',
	TIME = 'TIME',
}
