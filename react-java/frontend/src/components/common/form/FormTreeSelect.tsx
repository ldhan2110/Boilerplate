/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';
import { Form, TreeSelect, type FormItemProps, type TreeSelectProps } from 'antd';
import type { Rule } from 'antd/es/form';
import type { DataNode } from 'antd/es/tree';

import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';

type FormTreeSelectProps = TreeSelectProps &
	FormItemProps & {
		width?: number | string;
	};

export const FormTreeSelect = ({
	name,
	label,
	required,
	placeholder,
	rules,
	width,
	...props
}: FormTreeSelectProps) => {
	const { t, m } = useAppTranslate();

	const mappedRule: Rule[] = useMemo(() => {
		if (required)
			return [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])];
		return rules || ([] as Rule[]);
	}, [rules, required, m]);

	function handleFilter(input: string, treeNode: DataNode) {
		return (treeNode.title as string).toLowerCase().includes(input.toLowerCase());
	}

	return (
		<Form.Item
			name={name}
			label={t(label as string)}
			required={required}
			validateTrigger="onBlur"
			rules={mappedRule}
			style={{ width: width || '100%' }}
		>
			<TreeSelect
				style={{ width: width || '100%' }}
				allowClear
				showSearch
				treeDefaultExpandAll
				placeholder={t((placeholder as string) || 'Select value')}
				filterTreeNode={handleFilter as any}
				{...props}
			/>
		</Form.Item>
	);
};
