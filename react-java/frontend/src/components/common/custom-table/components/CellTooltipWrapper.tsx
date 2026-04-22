import React from 'react';
import { Tooltip } from 'antd';

interface CellTooltipWrapperProps {
	tooltip?: string | ((value: any, record: any) => React.ReactNode);
	value: any;
	record: any;
	children: React.ReactElement;
}

export const CellTooltipWrapper: React.FC<CellTooltipWrapperProps> = ({
	tooltip,
	value,
	record,
	children,
}) => {
	if (!tooltip) return children;

	const content = typeof tooltip === 'function' ? tooltip(value, record) : tooltip;

	return (
		<Tooltip title={content} mouseEnterDelay={0.3} destroyTooltipOnHide>
			{children}
		</Tooltip>
	);
};
