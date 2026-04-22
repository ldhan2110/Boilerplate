/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate, useToggle } from '@/hooks';
import type { EditProps, SearchModalProps, TableData } from '@/types';
import { SearchOutlined } from '@ant-design/icons';
import { Form, Input, type InputProps } from 'antd';
import type { FormListFieldData, Rule } from 'antd/es/form';
import type { FormInstance } from 'antd/lib';
import React from 'react';

export type SearchCellProps<T> = Partial<EditProps<T>> & {
	cellKey: string;
	name: any[] | string;
	field: FormListFieldData;
	tableFormName?: string;
	searchModal: React.ReactElement<SearchModalProps<T>>;
	onSearchSelect: (
		record: TableData<T>,
		rowIdx: number,
		form: FormInstance,
		name: string[],
	) => void;
	activeEditingCell?: string | null;
	setActiveEditingCell?: (cellKey: string | null) => void;
	onKeyDown?: (e: React.KeyboardEvent) => void;
} & Omit<InputProps, 'name' | 'onChange'>;

export const SearchCell = <T,>({
	cellKey,
	name,
	rules,
	required,
	placeholder,
	field,
	initialValue,
	tableFormName,
	searchModal,
	shouldUpdate,
	overrideEditProps,
	onChange,
	onSearchSelect,
	activeEditingCell,
	setActiveEditingCell,
	onKeyDown,
	...props
}: SearchCellProps<T>) => {
	const { t, m } = useAppTranslate();
	const { isToggle, toggle } = useToggle(false);
	const form = Form.useFormInstance();

	const mappedRule: Rule[] = React.useMemo(() => {
		if (required)
			return [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])];
		return rules || ([] as Rule[]);
	}, [required, rules, m]);

	async function handleSearchSelect(record: TableData<T>) {
		form.setFieldValue([tableFormName, ...name], record[name[1] as keyof T]);
		onSearchSelect(record, name[0], form, name as string[]);
		// Close edit mode after selection and validation
		if (activeEditingCell === cellKey) {
			try {
				await form.validateFields([[tableFormName, ...name]]);
				// Validation passed, close edit mode
				setActiveEditingCell?.(null);
			} catch (error) {
				// Validation failed, keep edit mode open
				// Error is already displayed by Form.Item
			}
		}
	}

	const handleSearchIconClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		toggle();
	};

	const handleInputBlur = async (e: React.FocusEvent) => {
		// Don't close if clicking on modal
		const relatedTarget = e.relatedTarget as HTMLElement;
		if (relatedTarget?.closest('.ant-modal')) {
			return;
		}
		if (activeEditingCell === cellKey && !isToggle) {
			try {
				await form.validateFields([[tableFormName, ...name]]);
				// Validation passed, close edit mode
				setActiveEditingCell?.(null);
			} catch (error) {
				// Validation failed, keep edit mode open
				// Error is already displayed by Form.Item
			}
		}
	};

	return (
		<>
			<Form.Item shouldUpdate={(prev, curr) => shouldUpdate?.(prev, curr, name[0]) ?? false}>
				{!shouldUpdate ? (
					<Form.Item
						{...field}
						name={name}
						rules={mappedRule}
						validateTrigger={['onChange', 'onBlur']}
						key={cellKey}
						initialValue={initialValue}
					>
						<Input
							placeholder={t(placeholder as string)}
							onChange={(event) => {
								onChange?.(event.target.value, event, form, name);
							}}
							onKeyDown={(e) => {
								if (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 'Escape') {
									onKeyDown?.(e);
								}
							}}
							onBlur={handleInputBlur}
							suffix={
								<SearchOutlined
									style={{ cursor: 'pointer' }}
									onMouseDown={(e) => {
										e.preventDefault();
										e.stopPropagation();
									}}
									onClick={handleSearchIconClick}
								/>
							}
							autoFocus
							{...props}
						/>
					</Form.Item>
				) : (
					({ getFieldsValue, getFieldValue, setFields }) => {
						const {
							disabled: overrideDisabled,
							clearValueDisable,
							...restOverrideProps
						} = overrideEditProps?.(getFieldsValue(), name[0], form, name) ?? {};

						if (overrideDisabled) {
							setTimeout(() => {
								setFields([
									{
										name: [tableFormName, ...(Array.isArray(name) ? name : [name])],
										value: clearValueDisable
											? null
											: getFieldValue([tableFormName, ...(Array.isArray(name) ? name : [name])]),
										errors: [],
									}, // clears error + border
								]);
							}, 0);
						}

						return (
							<Form.Item
								{...field}
								name={name}
								rules={overrideDisabled ? [] : mappedRule}
								validateTrigger={['onChange', 'onBlur']}
								key={cellKey}
								initialValue={initialValue}
							>
								<Input
									placeholder={t(placeholder as string)}
									{...props}
									onChange={(event) => {
										onChange?.(event.target.value, event, form, name);
									}}
									onKeyDown={(e) => {
								if (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 'Escape') {
									onKeyDown?.(e);
								}
							}}
									onBlur={handleInputBlur}
									suffix={
										<SearchOutlined
											style={{ cursor: 'pointer' }}
											onMouseDown={(e) => {
												e.preventDefault();
												e.stopPropagation();
											}}
											onClick={handleSearchIconClick}
										/>
									}
									autoFocus
									disabled={overrideDisabled}
									{...(restOverrideProps as any)}
								/>
							</Form.Item>
						);
					}
				)}
			</Form.Item>

			{/* Render Modals */}
			{React.cloneElement(searchModal, {
				open: isToggle,
				fieldName: name[1],
				fieldValue: form.getFieldValue([tableFormName, ...name]),
				onCancel: () => {
					toggle();
					// Don't close edit mode when canceling search modal
				},
				onSelect: handleSearchSelect,
			})}
		</>
	);
};
