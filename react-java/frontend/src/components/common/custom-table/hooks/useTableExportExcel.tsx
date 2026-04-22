/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import * as XLSX from 'xlsx-js-style';
import { aggregate, extractTextFromReactElement, formatCellValue, getNestedValue } from '../utils';
import { AGGERATE_TYPE, type TableColumn } from '@/types';
import { isEmpty, some } from 'lodash';
import { formatNumberAmount } from '@/utils/helper';

interface FlattenedColumn<T = any> extends TableColumn<T> {
	parentTitle: string | null;
}

interface UseExportExcelReturn {
	exportToExcel: <T extends Record<string, any>>(
		dataSource: T[],
		columns: TableColumn<T>[],
		summaryData?: Record<string, any> | ((data: T[]) => Record<string, any>),
	) => void;
}

/**
 * Custom hook to export Ant Design table data to Excel
 * @param {string} fileName - The name of the exported file (without extension)
 * @returns {Object} - Object containing exportToExcel function
 */
export const useTableExportExcel = (fileName: string = 'table-export'): UseExportExcelReturn => {
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
				} else if (col.dataIndex && !col.excelProps?.hideInExport) {
					// Add leaf column with parent title info
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

	function getSummaryContent(summary: any, valueType: string, data: any[], dataIndex: string) {
		let content;
		if (typeof summary === 'function') content = extractTextFromReactElement(summary());
		else if (isEmpty(summary)) content = '';
		else if (Object.values(AGGERATE_TYPE).includes(summary!)) {
			content = aggregate(data as any[], dataIndex as any, summary as AGGERATE_TYPE);
			if (valueType === 'amount' && typeof content === 'number') {
				content = formatNumberAmount(content);
			}
		}
		return content;
	}

	const exportToExcel = React.useCallback(<T extends Record<string, any>>(dataSource: T[], columns: TableColumn<T>[]): void => {
		// Flatten columns to get all leaf columns
		const exportColumns = flattenColumns(columns);

		// Create multi-level headers
		const hasParentHeaders = exportColumns.some((col) => col.parentTitle);

		// Prepare data array for Excel
		const excelData: any[][] = [];

		if (hasParentHeaders) {
			// Add parent header row
			const parentHeaders = exportColumns.map((col) => col.parentTitle || '');
			excelData.push(parentHeaders);
		}

		// Add child header row
		const childHeaders = exportColumns.map((col) => col.title as string);
		excelData.push(childHeaders);

		// Add data rows
		dataSource.forEach((row, rowIndex) => {
			const rowData = exportColumns.map((col) => {
				// Get value from dataIndex
				const dataIndex = col.dataIndex as string | string[];
				const value = getNestedValue(row, dataIndex);

				// Check if column has exportValue function (takes priority over render)
				if (col.excelProps?.exportValue) {
					return col.excelProps.exportValue(value);
				}

				// Check if column has a render function
				if (col.render) {
					const rendered = col.render(
						value,
						row,
						rowIndex,
					);

					// Extract text content from rendered element
					return extractTextFromReactElement(rendered);
				}

				// Otherwise format the value
				return formatCellValue(value ?? '', col.excelProps?.exportType, col.excelProps?.exportFormat);
			});
			excelData.push(rowData);
		});

		if (some(exportColumns, 'summary')) {
			const summaryRow = exportColumns.map(({ valueType, summary, dataIndex }) => {
				if (dataIndex) {
					const value = getSummaryContent(summary, valueType!, dataSource, dataIndex as any);
					return formatCellValue(value, valueType as any);
				}
				return '';
			});
			excelData.push(summaryRow);
		}

		// Create worksheet from array of arrays
		const ws = XLSX.utils.aoa_to_sheet(excelData);

		// Apply borders to all cells
		const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
		for (let row = range.s.r; row <= range.e.r; row++) {
			for (let col = range.s.c; col <= range.e.c; col++) {
				const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
				if (!ws[cellAddress]) continue;

				const isHeader = row < (hasParentHeaders ? 2 : 1);
				const dataRowIndex = hasParentHeaders ? row - 2 : row - 1;
				const currentCol = exportColumns[col];

				// Initialize cell style
				const cellStyle: any = {
					border: {
						top: { style: 'thin', color: { rgb: '000000' } },
						bottom: { style: 'thin', color: { rgb: '000000' } },
						left: { style: 'thin', color: { rgb: '000000' } },
						right: { style: 'thin', color: { rgb: '000000' } },
					},
					alignment: { vertical: 'center', horizontal: 'left' },
				};

				// Add header styling
				if (isHeader) {
					cellStyle.font = { bold: true };
					cellStyle.fill = { fgColor: { rgb: 'F0F0F0' } };
				} else if (currentCol && dataRowIndex >= 0) {
					// Apply format for data cells
					const cellValue = ws[cellAddress].v;

					if (currentCol.excelProps?.exportType === 'date') {
						cellStyle.numFmt = 'yyyy-mm-dd';
						cellStyle.alignment = {
							...cellStyle.alignment,
							horizontal: 'right',
						};
						// Ensure cell type is number for dates
						if (cellValue instanceof Date) {
							ws[cellAddress].t = 'n';
							ws[cellAddress].v =
								(cellValue.getTime() - new Date(1899, 11, 30).getTime()) / (24 * 60 * 60 * 1000);
						}
					} else if (currentCol.excelProps?.exportType === 'number') {
						cellStyle.numFmt = '0.00';
						cellStyle.alignment = {
							...cellStyle.alignment,
							horizontal: 'right',
						};
						// Ensure cell type is number
						if (typeof cellValue === 'number') {
							ws[cellAddress].t = 'n';
						}
					} else if (currentCol.excelProps?.exportType === 'string') {
						cellStyle.numFmt = '@'; // Text format
						ws[cellAddress].t = 's';
					} else if (currentCol.excelProps?.exportType === 'boolean') {
						ws[cellAddress].t = 'b';
					} else {
						// AUTO-DETECT FIXED
						if (typeof cellValue === 'number') {
							cellStyle.numFmt = '0.00';
							ws[cellAddress].t = 'n';
							cellStyle.alignment = { ...cellStyle.alignment, horizontal: 'right' }; // **IMPORTANT FIX**
						} else if (cellValue instanceof Date) {
							cellStyle.numFmt = 'yyyy-mm-dd';
							ws[cellAddress].t = 'n';
							cellStyle.alignment = { ...cellStyle.alignment, horizontal: 'right' };
							ws[cellAddress].v =
								(cellValue.getTime() - new Date(1899, 11, 30).getTime()) / 86400000;
						} else {
							cellStyle.numFmt = '@';
							ws[cellAddress].t = 's';
						}
					}

					// Determine and apply format
					if (currentCol.excelProps?.exportFormat) {
						// Use custom format if provided
						cellStyle.numFmt = currentCol.excelProps?.exportFormat;
					}
				}

				// Apply the style to the cell
				ws[cellAddress].s = cellStyle;
			}
		}

		// Merge cells for parent headers if they exist
		if (hasParentHeaders) {
			const merges: XLSX.Range[] = [];
			let currentParent: string | null = null;
			let startCol = 0;

			exportColumns.forEach((col, idx) => {
				if (col.parentTitle) {
					if (col.parentTitle !== currentParent) {
						if (currentParent && startCol < idx) {
							// Merge previous parent header
							merges.push({
								s: { r: 0, c: startCol },
								e: { r: 0, c: idx - 1 },
							});
						}
						currentParent = col.parentTitle;
						startCol = idx;
					}
				} else {
					if (currentParent && startCol < idx) {
						merges.push({
							s: { r: 0, c: startCol },
							e: { r: 0, c: idx - 1 },
						});
					}
					currentParent = null;
					startCol = idx + 1;
				}
			});

			// Handle last group
			if (currentParent && startCol < exportColumns.length) {
				merges.push({
					s: { r: 0, c: startCol },
					e: { r: 0, c: exportColumns.length - 1 },
				});
			}

			ws['!merges'] = merges;
		}

		// Set column widths
		const colWidths = exportColumns.map((col) => ({
			wch: Math.max((col.title as string)?.length || 10, 15),
		}));
		ws['!cols'] = colWidths;

		// Create workbook and add worksheet
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

		// Generate Excel file with cell styles and trigger download
		XLSX.writeFile(wb, `${fileName}.xlsx`);
	},
		[fileName, flattenColumns],
	);

	return { exportToExcel };
};
