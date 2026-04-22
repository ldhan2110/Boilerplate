import React from 'react';
import { Form, Table, type FormInstance } from 'antd';
import { AGGERATE_TYPE } from '@/types';
import { isEmpty } from 'lodash';
import { formatNumberAmount } from '@/utils/helper';
import { aggregate } from '../../utils/aggerate';

interface TableSummaryProps {
	cellKey: number;
	formTableName: string;
	dataIndex: string;
	summary?: AGGERATE_TYPE | (() => React.ReactNode);
	valueType?: string;
	align?: 'left' | 'right' | 'center';
	form: FormInstance;
}

const TableSummaryCell = ({
	cellKey,
	formTableName,
	dataIndex,
	summary,
	valueType,
	align,
	form,
}: TableSummaryProps) => {
	// Watch only this specific column's values
	const columnValues = Form.useWatch([formTableName], form);

	// Memoize the summary calculation
	const content = React.useMemo(() => {
		if (typeof summary === 'function') return summary();
		if (isEmpty(summary)) return <></>;
		if (Object.values(AGGERATE_TYPE).includes(summary!)) {
			const values = columnValues || [];
			const result = aggregate(values, dataIndex, summary as AGGERATE_TYPE);
			return valueType === 'amount' && typeof result === 'number'
				? formatNumberAmount(result)
				: result;
		}
		return null;
	}, [columnValues, dataIndex, summary, valueType]);

	return (
		<Table.Summary.Cell key={cellKey} index={cellKey} align={align}>
			{content}
		</Table.Summary.Cell>
	);
};

export default React.memo(TableSummaryCell);
