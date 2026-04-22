/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { extractTextFromReactElement, formatCellValue, getNestedValue } from '../utils';
import type { TableColumn } from '@/types';

interface FlattenedColumn<T = any> extends TableColumn<T> {
	parentTitle: string | null;
}

interface CopyOptions {
	isTree?: boolean;
}

interface UseClipboardCopyReturn {
	copyRowsToClipboard: <T extends Record<string, any>>(
		rows: T[],
		columns: TableColumn<T>[],
		options?: CopyOptions,
	) => Promise<void>;
}

/**
 * Custom hook to copy table row data to clipboard in TSV format for Excel compatibility
 * @returns {Object} - Object containing copyRowsToClipboard function
 */
export const useClipboardCopy = (): UseClipboardCopyReturn => {
	// Flatten nested columns structure
	const flattenColumns = React.useCallback(
		<T extends Record<string, any>>(
			columns: TableColumn<T>[],
			parentTitle: string = '',
		): FlattenedColumn<T>[] => {
			let result: FlattenedColumn<T>[] = [];

			columns.forEach((col) => {
				if (col.children && col.children.length > 0) {
					// Recursively flatten children columns
					const childColumns = flattenColumns(
						col.children as TableColumn<T>[],
						col.title as string,
					);
					result = result.concat(childColumns);
				} else if (col.dataIndex) {
					// Add leaf column with parent title info
					// Note: hideInExport is for Excel export only, clipboard copy includes all columns with dataIndex
					result.push({
						...col,
						parentTitle: parentTitle || null,
					});
				}
			});

			return result;
		},
		[],
	);

	// Convert any value to string for clipboard
	const convertToClipboardString = React.useCallback((value: unknown): string => {
		if (value === null || value === undefined) {
			return '';
		}

		// Handle arrays - join with comma
		if (Array.isArray(value)) {
			return value
				.map((item) => convertToClipboardString(item))
				.filter((text) => text.trim() !== '')
				.join(', ');
		}

		// Handle Date objects
		if (value instanceof Date) {
			return value.toISOString().split('T')[0]; // YYYY-MM-DD format
		}

		// Handle numbers
		if (typeof value === 'number') {
			return String(value);
		}

		// Handle booleans
		if (typeof value === 'boolean') {
			return value ? 'true' : 'false';
		}

		// Handle objects (try to extract meaningful text)
		if (typeof value === 'object') {
			// Try common text properties
			const obj = value as Record<string, unknown>;
			if (obj.label !== undefined) return String(obj.label);
			if (obj.title !== undefined) return String(obj.title);
			if (obj.text !== undefined) return String(obj.text);
			if (obj.name !== undefined) return String(obj.name);
			if (obj.value !== undefined) return String(obj.value);
			// Fallback to empty string for complex objects
			return '';
		}

		return String(value);
	}, []);

	// Get cell value from row data
	const getCellValue = React.useCallback(
		<T extends Record<string, any>>(
			row: T,
			col: FlattenedColumn<T>,
			rowIndex: number,
		): string => {
			// Check if column has a render function
			if (col.render) {
				const rawValue = col.dataIndex
					? getNestedValue(row, col.dataIndex as any)
					: undefined;
				const rendered = col.render(rawValue, row, rowIndex);

				// First try to extract text from the rendered React element
				const extractedText = extractTextFromReactElement(rendered);

				// If extraction returned empty but we have a raw value, use that
				if (extractedText.trim() === '' && rawValue !== undefined && rawValue !== null) {
					return convertToClipboardString(rawValue);
				}

				return extractedText;
			}

			// Otherwise get value from dataIndex
			const dataIndex = col.dataIndex as string | string[];
			const value = getNestedValue(row, dataIndex);

			// Handle arrays before formatting
			if (Array.isArray(value)) {
				return value
					.map((item) => {
						const formatted = formatCellValue(
							item ?? '',
							col.excelProps?.exportType,
							col.excelProps?.exportFormat,
						);
						return convertToClipboardString(formatted);
					})
					.filter((text) => text.trim() !== '')
					.join(', ');
			}

			const formattedValue = formatCellValue(
				value ?? '',
				col.excelProps?.exportType,
				col.excelProps?.exportFormat,
			);

			return convertToClipboardString(formattedValue);
		},
		[convertToClipboardString],
	);

	// Flatten tree data recursively
	const flattenTreeData = React.useCallback(
		<T extends Record<string, any>>(rows: T[]): T[] => {
			const result: T[] = [];

			const processRow = (row: T) => {
				// Extract children before adding to result
				const { children, ...rowWithoutChildren } = row;
				result.push(rowWithoutChildren as T);

				// Recursively process children if they exist
				if (children && Array.isArray(children) && children.length > 0) {
					children.forEach((child: T) => processRow(child));
				}
			};

			rows.forEach((row) => processRow(row));
			return result;
		},
		[],
	);

	// Copy rows to clipboard in TSV format
	const copyRowsToClipboard = React.useCallback(
		async <T extends Record<string, any>>(
			rows: T[],
			columns: TableColumn<T>[],
			options?: CopyOptions,
		): Promise<void> => {
			if (!rows.length) return;

			// Flatten tree data if isTree option is enabled
			const processedRows = options?.isTree ? flattenTreeData(rows) : rows;

			// Flatten columns to get all leaf columns
			const flattenedColumns = flattenColumns(columns);

			// Convert rows to TSV format (Tab-Separated Values)
			const tsvData = processedRows
				.map((row, rowIndex) =>
					flattenedColumns
						.map((col) => {
							const value = getCellValue(row, col, rowIndex);
							// Escape tabs and newlines in cell values
							return value.replace(/[\t\n\r]/g, ' ');
						})
						.join('\t'),
				)
				.join('\n');

			// Copy to clipboard
			try {
				await navigator.clipboard.writeText(tsvData);
			} catch (error) {
				// Fallback for older browsers
				const textArea = document.createElement('textarea');
				textArea.value = tsvData;
				textArea.style.position = 'fixed';
				textArea.style.left = '-9999px';
				document.body.appendChild(textArea);
				textArea.select();
				document.execCommand('copy');
				document.body.removeChild(textArea);
			}
		},
		[flattenColumns, getCellValue, flattenTreeData],
	);

	return { copyRowsToClipboard };
};

