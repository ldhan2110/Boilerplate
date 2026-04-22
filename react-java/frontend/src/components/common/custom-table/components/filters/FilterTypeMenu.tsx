/* eslint-disable @typescript-eslint/no-explicit-any */
import { FILTER_TYPE } from '@/constants';
import { TABLE_FILTER_TYPE } from '@/types';
import { SearchOutlined } from '@ant-design/icons';
import { Dropdown, Form } from 'antd';
import React, { type JSX } from 'react';

type FilterTypeMenuProps = {
	filterName: string;
	filterType: string;
	defaultOperator?: string;
	onFilterTableChange?: (changedValues: any, allValues: any) => void;
};

export const FilterTypeMenu = ({
	filterName,
	filterType,
	defaultOperator,
	onFilterTableChange,
}: FilterTypeMenuProps) => {
	const form = Form.useFormInstance();

	const [selected, setSelected] = React.useState<{
		key: string;
		label: string;
		icon: JSX.Element;
	} | null>(
		Object.values(FILTER_TYPE)
			.filter((type) => type.key == defaultOperator)
			.map((type) => ({
				key: type.key,
				icon: type.icon,
				label: type.label,
			})) as any,
	);

	React.useEffect(() => {
		if (defaultOperator) setSelected(items.find((item) => item.key == defaultOperator) || null);
	}, [defaultOperator]);

	const items = Object.values(FILTER_TYPE)
		.filter((type) => {
			switch (filterType) {
				case TABLE_FILTER_TYPE.TEXT: {
					const allowType = [
						FILTER_TYPE.NOT_EQUALS,
						FILTER_TYPE.EQUALS,
						FILTER_TYPE.CONTAINS,
						FILTER_TYPE.DEFAULT,
					];
					return allowType.includes(type);
				}
				case TABLE_FILTER_TYPE.DATEPICKER:
				case TABLE_FILTER_TYPE.TIMEPICKER:
				case TABLE_FILTER_TYPE.NUMBER: {
					const allowType = [
						FILTER_TYPE.NOT_EQUALS,
						FILTER_TYPE.EQUALS,
						FILTER_TYPE.LESS_THAN,
						FILTER_TYPE.GREATER_THAN,
						FILTER_TYPE.GREATER_OR_EQUAL,
						FILTER_TYPE.LESS_OR_EQUAL,
						FILTER_TYPE.DEFAULT,
						FILTER_TYPE.BETWEEN,
					];
					return allowType.includes(type);
				}
				case TABLE_FILTER_TYPE.MULTI_SELECT: {
					const allowType = [
						FILTER_TYPE.IN,
						FILTER_TYPE.NOT_IN,
						FILTER_TYPE.DEFAULT,
					];
					return allowType.includes(type);
				}
			}
		})
		.map((type) => ({
			key: type.key,
			icon: type.icon,
			label: type.label,
		}));

	const menuProps = {
		items,
		onClick: (event: any) => {
			event.domEvent.stopPropagation();
			form.setFieldsValue({
				[`${filterName}Operator`]: event.key,
				[filterName]: null,
				[`${filterName}To`]: null,
			});
			onFilterTableChange?.(
				{
					[`${filterName}Operator`]: event.key,
				},
				form.getFieldsValue(),
			);
			setSelected(items.find((item) => item.key == event.key) || null);
		},
	};

	return (
		<Dropdown menu={menuProps} placement="bottomLeft">
			<span style={{ cursor: 'pointer' }}>{selected?.icon ?? <SearchOutlined />}</span>
		</Dropdown>
	);
};
