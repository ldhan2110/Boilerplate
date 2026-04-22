/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CheckboxChangeEvent, TablePaginationConfig } from 'antd';
import type { Rule, RuleObject } from 'antd/es/form';
import type { DefaultOptionType } from 'antd/es/select';
import type {
	ColumnGroupType,
	ColumnType,
	FilterValue,
	SorterResult,
	TableCurrentDataSource,
} from 'antd/es/table/interface';
import type { FormInstance } from 'antd/lib';
import type React from 'react';
import type { ReactNode } from 'react';
import type { UniqueIdentifier } from '@dnd-kit/core';
import type { SearchModalProps } from './app';

export type CustomRuleObject = RuleObject & {
	field?: string;
};

export type Pagination = TablePaginationConfig & {
	total?: number;
	current: number;
	pageSize: number;
};

export enum SORT {
	ASC = 'ASC',
	DESC = 'DESC',
}

export enum EDIT_TYPE {
	INPUT = 'INPUT',
	INPUT_NUMBER = 'INPUT_NUMBER',
	INPUT_NUMBER_DECIMAL = 'INPUT_NUMBER_DECIMAL',
	DATEPICKER = 'DATEPICKER',
	TIMEPICKER = 'TIMEPICKER',
	SELECT = 'SELECT',
	CHECKBOX = 'CHECKBOX',
	MULTI_SELECT = 'MULTI_SELECT',
	SEARCH = 'SEARCH',
}

export enum TABLE_FILTER_TYPE {
	TEXT = 'TEXT',
	SELECT = 'SELECT',
	NUMBER = 'NUMBER',
	DATEPICKER = 'DATEPICKER',
	TIMEPICKER = 'TIMEPICKER',
	MULTI_SELECT = 'MULTI_SELECT',
}

export enum AGGERATE_TYPE {
	SUM = 'sum',
	MAX = 'max',
	MIN = 'min',
	COUNT = 'count',
	UNIQUE_COUNT = 'unique_count',
}

export type Sort = {
	sortField: string | undefined;
	sortType: SORT | undefined;
};

export type MultiSort = Sort[];

export enum TABLE_ACTIONS {
	PAGINATE = 'paginate',
	SORT = 'sort',
	FILTER = 'filter',
}

export type FilterInputType = TABLE_FILTER_TYPE;

export type FilterTableProps = {
	showFilter: boolean;
	filterType: TABLE_FILTER_TYPE;
	filterName: string;
	filterNumberType: 'number' | 'amount';
	filterInitialValue: any;
	filterOptions: {
		label: string;
		value: string;
	}[];
};

export type TableFilter = Record<string, FilterValue | null>;

export type TableData<T> = T & {
	key: React.Key;
	procFlag?: 'S' | 'I' | 'U' | 'D';
	_treeNo?: number;
	_isTreeParent?: boolean;
};

export type TableExtra<T> = TableCurrentDataSource<T>;

export type RowSelection = {
	key: string;
	[prop: string]: any;
};

export type TableState<T> = {
	sort?: Sort;
	rowSelection?: TableData<T>[];
	pagination?: Pagination;
};

export type EditProps<T> = {
	required: boolean;
	placeholder: string;
	disabled: boolean;
	clearValueDisable?: boolean;
	initialValue?: any;
	rules?: Rule[];
	picker?: 'date' | 'month' | 'year' | 'week' | 'quarter';

	// Specials Method for rerender
	shouldUpdate?: (prevVal: TableData<any>, curVal: TableData<any>, rowIndex: number) => boolean; // Use this function to determine if the cell should update
	overrideEditProps?: (
		curVal: TableData<any>,
		rowIndex: number,
		form: FormInstance,
		name: string | string[],
	) => Partial<EditProps<T>>; // Use this function to override edit props based on current value
	onChange?: (
		value: any,
		options: any | CheckboxChangeEvent,
		form: FormInstance,
		name: string | string[],
	) => void; // Use this function to handle onChange event when cell value changes

	// INPUT & INPUT NUMBER
	maxLength: number;
	numberType: 'amount' | 'number' | 'coordinate';
	min?: number;
	max?: number;
	precision?: number;

	// SELECT
	options: DefaultOptionType[];

	// CHECKBOX
	checkboxMapping?: {
		checked: string | number | boolean | object;
		unchecked: string | number | boolean | object;
	};
	checkboxAsSwitch?: boolean;

	// SEARCH
	searchModal: React.ReactElement<SearchModalProps<any>>;
	onSearchSelect: (
		record: TableData<any>,
		rowIdx: number,
		form: FormInstance,
		name: string[],
	) => void;
};

export type DecimalEditProps<T> = Omit<EditProps<T>, 'numberType'> & {
	numberType?: 'amount' | 'number';
	parser?: (value: string | undefined) => string;
	formatter?: (value: string | number | undefined) => string;
};

export type ExcelProps = {
	exportType: 'string' | 'number' | 'date' | 'boolean' | 'auto';
	exportFormat?: string;
	exportValue?: (value: any) => any;
	hideInExport: boolean;
};

export type TableColumn<T> = Partial<ColumnType<T>> &
	Partial<ColumnGroupType<T>> & {
		valueType?: 'number' | 'string' | 'date' | 'datetime' | 'amount' | 'toggle';
		resizable?: boolean;
		draggable?: boolean;
		showHeaderMenu?: boolean;
		summary?: AGGERATE_TYPE | (() => ReactNode);
		editType?: EDIT_TYPE;
		editProps?: Partial<EditProps<T> | DecimalEditProps<T>>;
		filterProps?: Partial<FilterTableProps>;
		children?: TableColumn<T>[];
		excelProps?: Partial<ExcelProps>;
		/** Tooltip shown on cell hover. String for static text, or function receiving (cellValue, record) returning ReactNode. */
		tooltip?: string | ((value: any, record: T) => ReactNode);
	};

export type TableSort = SorterResult<any>;

export type EditTableHandler<T> = {
	insertAbove: (row?: Partial<TableData<T>>, index?: number) => void;
	insertBelow: (row?: Partial<TableData<T>>, index?: number) => void;
	onAddRow: (row?: Partial<TableData<T>>, index?: number) => void;
	onRemoveRow: (index: number | number[]) => void;
	getDeletedRows: () => TableData<T>[];
	resetDeletedRows: () => void;
	duplicateRow: (rows: TableData<T>[]) => void;
	validateAllFields: () => Promise<void>;
};

export type CrossPageSelectionInfo = {
	/** Total number of currently selected keys (selectedIds.size - deselectedIds.size) */
	totalSelected: number;
	/** Lazily compute the full array of effective selected keys. Call only when needed (e.g., bulk action submit). */
	getEffectiveKeys: () => React.Key[];
	/** Keys the user manually deselected after "select all" */
	deselectedKeys: React.Key[];
};

export type CrossPageSelectionConfig = {
	/** Enable cross-page selection. When true, selection persists across pagination. */
	enabled: boolean;
	/**
	 * All matching keys from the current search query.
	 * The backend should return these alongside the paginated data so no extra API call is needed.
	 */
	allKeys: React.Key[];
	/**
	 * Called whenever the effective selection state changes.
	 * Consumer uses `info.getEffectiveKeys()` for bulk action payloads.
	 */
	onSelectionChange?: (info: CrossPageSelectionInfo) => void;
};

export interface DragIndexState {
	active: UniqueIdentifier;
	over: UniqueIdentifier | undefined;
	direction?: 'left' | 'right';
}
