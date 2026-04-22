import React, { type ReactElement, useMemo } from 'react';
import { Form, Input } from 'antd';
import { CloseCircleFilled, SearchOutlined } from '@ant-design/icons';
import type { Rule } from 'antd/es/form';
import type { FormItemProps, InputProps } from 'antd/lib';

import type { SearchModalProps, TableData } from '@/types';
import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate, useToggle } from '@/hooks';

type FormSearchInputProps<T> = InputProps &
	FormItemProps & {
		searchModal: ReactElement<SearchModalProps<T>>;
		modalsProps: SearchModalProps<T>;
		onSelectCallback?: (record: TableData<T> | TableData<T>[]) => void;
		disabled?: boolean;
		width?: number | string;
	};

export const FormSearchInput = <T,>({
	name,
	label,
	title,
	required,
	placeholder,
	maxLength,
	rules,
	width,
	searchModal,
	modalsProps,
	onSelectCallback,
	disabled,
	...props
}: FormSearchInputProps<T>) => {
	const { t, m } = useAppTranslate();
	const { isToggle, toggle } = useToggle(false);
	const form = Form.useFormInstance();
	const fieldValue = Form.useWatch(name, form);
	const showClear = !disabled && props.allowClear !== false && !!fieldValue;

	const mappedRule: Rule[] = useMemo(() => {
		if (required)
			return [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])];
		return rules || ([] as Rule[]);
	}, [required, rules, m]);

	function handleCloseModal() {
		toggle();
	}

	function handleSelect(record: TableData<T> | TableData<T>[]) {
		if (disabled) return;

		if (modalsProps.selectType == 'single') {
			record = record as TableData<T>;
			form.setFields([
				{
					name: name,
					value: record[name as keyof T],
					touched: true,
				},
			]);
			onSelectCallback?.(record);
		}
	}

	function handleClear() {
		if (disabled) return;
		form.setFields([
			{
				name: name,
				value: undefined,
				touched: true,
			},
		]);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		onSelectCallback?.(undefined as any);
	}

	return (
		<>
			<Form.Item
				name={name}
				label={label}
				required={required}
				validateTrigger="onBlur"
				rules={mappedRule}
				style={{ width: width || '100%' }}
			>
				<Input
					disabled={disabled}
					placeholder={t(placeholder || 'Input text')}
					maxLength={maxLength}
					style={{ width: width || '100%' }}
					{...props}
					allowClear={false}
					suffix={
						<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
							{showClear && (
								<CloseCircleFilled
									className="ant-input-clear-icon"
									onClick={handleClear}
									onMouseDown={(e) => e.preventDefault()}
								/>
							)}
							<SearchOutlined style={{ cursor: 'pointer' }} onClick={toggle} />
						</span>
					}
				/>
			</Form.Item>

			{/* Render Modals */}
			{!disabled &&
				React.cloneElement(searchModal, {
					...modalsProps,
					open: isToggle,
					title: title,
					fieldName: name,
					fieldValue: form.getFieldValue(name),
					onSelect: handleSelect,
					onCancel: handleCloseModal,
				})}
		</>
	);
};
