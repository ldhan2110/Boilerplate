/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TableColumn, TableData } from "@/types";
import type { FormInstance } from "antd";

export const DEFAULT_MIN_COLUMN_WIDTH = 80;
export const TITLE_PADDING_PX = 60;
export const PX_PER_CHAR = 8;

export function getRecordIndex<T>(key: number, tableForm: FormInstance, formTableName: string) {
    const fields = tableForm.getFieldsValue();
    const recordIndex = fields[formTableName].findIndex((item: TableData<T>) => item.key === key);
    return recordIndex;
}

// Helper function to get nested value from object using dot notation
export function getTableNestedValue(obj: any, path: string): any {
	const keys = path.split('.');
	let value = obj;
	for (const key of keys) {
		if (value == null) return undefined;
		value = value[key];
	}
	return value;
}

export function getTitleText<T>(col: TableColumn<T>, t: (key: string) => string): string {
	return typeof col.title === 'string' ? t(col.title) : '';
}

export function estimateMinWidth(text: string): number {
	if (!text) return DEFAULT_MIN_COLUMN_WIDTH;
	return text.length * PX_PER_CHAR + TITLE_PADDING_PX;
}

export function adjustColumnWidths<T>(cols: TableColumn<T>[], t: (key: string) => string): TableColumn<T>[] {
	return cols.map((col) => {
		if (col.children && col.children.length > 0) {
			return { ...col, children: adjustColumnWidths(col.children, t) };
		}
		const minW = estimateMinWidth(getTitleText(col, t));
		const w = Math.max((col.width as number) ?? DEFAULT_MIN_COLUMN_WIDTH, minW);
		return { ...col, width: w };
	});
}

export function flattenToLeaves<T>(cols: TableColumn<T>[]): TableColumn<T>[] {
	const result: TableColumn<T>[] = [];
	cols.forEach((col) => {
		if (col.children && col.children.length > 0) {
			result.push(...flattenToLeaves(col.children));
		} else {
			result.push(col);
		}
	});
	return result;
}

export function sumLeafWidths<T>(cols: TableColumn<T>[]): number {
	return flattenToLeaves(cols).reduce((sum, c) => sum + ((c.width as number) ?? 0), 0);
}

/**
 * Applies numeric `width` from a previous column tree onto matching leaf columns in `nextCols`
 * (match by `dataIndex`, else `key`). Used when the `columns` prop updates (e.g. new select options)
 * without discarding user-resized widths.
 */
export function mergeResizedWidthsIntoColumns<T>(
	prevCols: TableColumn<T>[],
	nextCols: TableColumn<T>[],
): TableColumn<T>[] {
	if (!prevCols.length) return nextCols;

	const widthByLeafId = new Map<string, number>();
	const collect = (cols: TableColumn<T>[]) => {
		for (const col of cols) {
			if (col.children && col.children.length > 0) {
				collect(col.children);
				continue;
			}
			const id =
				col.dataIndex !== undefined && col.dataIndex !== null
					? String(col.dataIndex)
					: col.key !== undefined && col.key !== null
						? String(col.key)
						: '';
			if (id && typeof col.width === 'number') {
				widthByLeafId.set(id, col.width);
			}
		}
	};
	collect(prevCols);

	const apply = (cols: TableColumn<T>[]): TableColumn<T>[] =>
		cols.map((col) => {
			if (col.children && col.children.length > 0) {
				return { ...col, children: apply(col.children) };
			}
			const id =
				col.dataIndex !== undefined && col.dataIndex !== null
					? String(col.dataIndex)
					: col.key !== undefined && col.key !== null
						? String(col.key)
						: '';
			const w = id ? widthByLeafId.get(id) : undefined;
			if (w !== undefined) {
				return { ...col, width: w };
			}
			return col;
		});

	return apply(nextCols);
}