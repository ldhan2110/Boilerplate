/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

export function useResizeHandler(
	columns: any[],
	setTableColumn: (columns: any[]) => void,
	onHeaderMenuClick?: (event: React.MouseEvent, column: any) => void,
) {
	const handleResize = React.useCallback(
		(dataIndex: string) =>
			(_e: any, { size }: any) => {
				const resizeColumn = (cols: any[]): any[] =>
					cols.map((col: any): any => {
						if (col.children) {
							return { ...col, children: resizeColumn(col.children) };
						}
						if (col.dataIndex === dataIndex) {
							return { ...col, width: size.width };
						}
						return col;
					});

				// ✅ Direct assignment, no function form
				setTableColumn(resizeColumn(columns));
			},
		[columns, setTableColumn],
	);

	// Apply resize only to leaf columns (skip group headers)
	const makeResizable = React.useCallback(
		(cols: any[]): any[] =>
			cols.map((col: any) => {
				if (col.children) {
					return { ...col, children: makeResizable(col.children) };
				}
				return {
					...col,
					ellipsis: {
						showTitle: false,
					},
					onHeaderCell: (column: any) => ({
						draggable: col.draggable,
						resizable: col.resizable ?? true,
						width: column.width,
						id: col.dataIndex || col.key,
						filterProps: col.filterProps,
						onResize: handleResize(column.dataIndex),
						columnData: col, // Pass the actual column definition
						onHeaderMenuClick: col.showHeaderMenu === false ? undefined : onHeaderMenuClick,
						showHeaderMenu: col.showHeaderMenu ?? true,
					}),
				};
			}),
		[handleResize, onHeaderMenuClick],
	);

	return {
		makeResizable,
		handleResize,
	};
}
