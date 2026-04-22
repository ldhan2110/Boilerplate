import { useCallback, useEffect, useMemo, useState } from 'react';
import { Form, Select, type FormItemProps, type SelectProps } from 'antd';
import type { Rule } from 'antd/es/form';
import type { DefaultOptionType } from 'antd/es/select';

import { ALL_OPTION, MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';
import { type TreeMap, getAncestors } from '@/utils/buildTreeMap';
import { getTextFromLabel } from '@/utils/helper';

type FormSelectProps = SelectProps &
	FormItemProps & {
		width?: number | string;
		allowSelectAll?: boolean;
		isTree?: boolean;
		treeMap?: TreeMap;
	};

export const FormMultiSelect = ({
	name,
	label,
	required,
	placeholder,
	rules,
	width,
	allowSelectAll = false,
	isTree = false,
	treeMap,
	options,
	layout,
	...props
}: FormSelectProps) => {
	const { t, m } = useAppTranslate();
	const [selectOptions, setSelectOptions] = useState<DefaultOptionType[]>([]);
	const form = Form.useFormInstance();

	const mappedRule: Rule[] = useMemo(() => {
		if (required)
			return [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])];
		return rules || ([] as Rule[]);
	}, [rules, required, m]);

	useEffect(() => {
		function handleConfigOptions(options: DefaultOptionType[]) {
			if (allowSelectAll && options.length != 0) {
				return [{ label: t(ALL_OPTION.label), value: ALL_OPTION.value }, ...options];
			}
			return options;
		}
		setSelectOptions(handleConfigOptions(options || []));
	}, [options, allowSelectAll, t]);

	function handleFilter(input: string, option: DefaultOptionType | undefined) {
		return (getTextFromLabel(option?.label || '') as string).toLowerCase().includes(input.toLowerCase());
	}

	const getDescendants = useCallback(
		(value: string): string[] => {
			if (!isTree || !treeMap) return [];
			return treeMap.parentToChildren.get(value) ?? [];
		},
		[isTree, treeMap],
	);

	function handleSelectOption(value: string) {
		const selectedOptions: string[] = form.getFieldValue(name) ?? [];
		let newValue: string[] | undefined;
		if (value == 'ALL') {
			newValue = [ALL_OPTION.value];
			form.setFieldValue(name, newValue);
		} else if (selectedOptions.includes(ALL_OPTION.value)) {
			newValue = [value, ...getDescendants(value)];
			form.setFieldValue(name, newValue);
		} else {
			const descendants = getDescendants(value);
			const combined = new Set([...selectedOptions, value, ...descendants]);

			if (isTree && treeMap) {
				const ancestors = getAncestors(value, treeMap);
				for (const ancestor of ancestors) {
					const ancestorDescendants = treeMap.parentToChildren.get(ancestor) ?? [];
					if (ancestorDescendants.every((d) => combined.has(d))) {
						combined.add(ancestor);
					}
				}
			}

			if (allowSelectAll && combined.size >= (options?.length ?? 0)) {
				newValue = [ALL_OPTION.value];
			} else {
				newValue = [...combined];
			}
			form.setFieldValue(name, newValue);
		}
		if (newValue !== undefined && props.onChange) {
			props.onChange(newValue, []);
		}
	}

	function handleDeselectOption(value: string) {
		if (!isTree || !treeMap) return;
		const selectedOptions: string[] = form.getFieldValue(name) ?? [];
		const toRemove = new Set([value, ...getDescendants(value)]);
		const ancestors = getAncestors(value, treeMap);
		for (const ancestor of ancestors) {
			toRemove.add(ancestor);
		}
		const newValue = selectedOptions.filter((v) => !toRemove.has(v));
		form.setFieldValue(name, newValue);
		if (props.onChange) {
			props.onChange(newValue, []);
		}
	}

	return (
		<Form.Item
			name={name}
			label={t(label as string)}
			required={required}
			validateTrigger="onBlur"
			rules={mappedRule}
			style={{ width: width || '100%' }}
			layout={layout}
		>
			<Select
				style={{ width: width || '100%' }}
				allowClear
				showSearch
				mode="multiple"
				maxTagCount="responsive"
				filterOption={handleFilter}
				placeholder={t((placeholder as string) || 'Select value')}
				options={selectOptions}
				onSelect={handleSelectOption}
				onDeselect={handleDeselectOption}
				{...props}
			/>
		</Form.Item>
	);
};
