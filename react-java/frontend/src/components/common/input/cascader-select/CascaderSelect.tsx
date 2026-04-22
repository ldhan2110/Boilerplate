import React, { useCallback, useMemo, useState, type CSSProperties } from 'react';
import { Cascader, Input, type CascaderProps } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

import './CascaderSelect.scss';
import { useAppTranslate } from '@/hooks';

export interface CascaderOption {
	label: string;
	value: string | number;
	children?: CascaderOption[];
}

export interface CascaderSelectProps
	extends Omit<CascaderProps, 'value' | 'onChange' | 'options' | 'multiple'> {
	/** Current selected values (array of child option values) */
	value?: (string | number)[];

	/** Callback fired when the value changes */
	onChange?: (value: (string | number)[]) => void;

	/** Options data (2 levels: parent -> children) */
	options: CascaderOption[];

	/** Placeholder text */
	placeholder?: string;

	/** Whether the input is disabled */
	disabled?: boolean;

	/** Custom CSS styles */
	style?: CSSProperties;

	/** Additional CSS class name */
	className?: string;

	/** Whether to show clear button */
	allowClear?: boolean;
}

/**
 * CascaderSelect - A cascader component with multiselect support
 * that only allows selecting children and auto-selects all children when parent is selected
 *
 * @component
 * @example
 * const [value, setValue] = useState([]);
 * const options = [
 *   {
 *     label: 'Parent 1',
 *     value: 'parent1',
 *     children: [
 *       { label: 'Option 1', value: 'option1' },
 *       { label: 'Option 2', value: 'option2' },
 *     ],
 *   },
 * ];
 * return <CascaderSelect value={value} onChange={setValue} options={options} />
 */
export const CascaderSelect: React.FC<CascaderSelectProps> = ({
	value = [],
	onChange,
	options,
	placeholder = 'Please select',
	disabled = false,
	style,
	className,
	allowClear = true,
	...restProps
}) => {
    const { t } = useAppTranslate();
	const [searchValue, setSearchValue] = useState('');
	const [open, setOpen] = useState(false);

	// Exclude incompatible props that conflict with multiple mode
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
	const { defaultValue, ...safeRestProps } = restProps as any;

	// Filter options based on search value (only filter children)
	const filteredOptions = useMemo(() => {
		if (!searchValue.trim()) {
			return options;
		}

		const searchLower = searchValue.toLowerCase();
		const filtered: CascaderOption[] = [];

		options.forEach((parent) => {
			if (parent.children) {
				const matchingChildren = parent.children.filter((child) =>
					child.label.toLowerCase().includes(searchLower),
				);

				if (matchingChildren.length > 0) {
					filtered.push({
						...parent,
						children: matchingChildren,
					});
				}
			}
		});

		return filtered;
	}, [options, searchValue]);

	// Get all child values for a given parent value
	const getChildrenValues = useCallback(
		(parentValue: string | number): (string | number)[] => {
			const parent = options.find((opt) => opt.value === parentValue);
			if (parent?.children) {
				return parent.children.map((child) => child.value);
			}
			return [];
		},
		[options],
	);

	// Handle cascader change
	const handleChange = useCallback(
		(selectedPaths: (string | number | null)[][] | (string | number | null)[] | null) => {
			if (!onChange) return;

			// Handle null or empty selection
			if (!selectedPaths || (Array.isArray(selectedPaths) && selectedPaths.length === 0)) {
				onChange([]);
				return;
			}

			// Ensure we have array of arrays format (multiple mode)
			const paths = Array.isArray(selectedPaths[0]) 
				? (selectedPaths as (string | number | null)[][])
				: [selectedPaths as (string | number | null)[]];

			const selectedChildValues = new Set<string | number>();

			paths.forEach((path) => {
				// Filter out null values
				const validPath = path.filter((v): v is string | number => v !== null);
				
				if (validPath.length === 1) {
					// Parent is selected - select ALL its children (not the parent value)
					const [parentValue] = validPath;
					const childrenValues = getChildrenValues(parentValue);
					// Add all children values to the set
					childrenValues.forEach((val) => selectedChildValues.add(val));
				} else if (validPath.length === 2) {
					// Child is selected - add only the child value
					const [, childValue] = validPath;
					selectedChildValues.add(childValue);
				}
				// Ignore any path with length !== 1 or 2 (shouldn't happen in 2-level structure)
			});

			// Get all parent values to filter them out (safety check)
			const parentValues = new Set(options.map((opt) => opt.value));
			
			// Filter out any parent values that might have accidentally been included
			const childValuesOnly = Array.from(selectedChildValues).filter(
				(val) => !parentValues.has(val)
			);

			// Always return array of child values only, never parent values
			onChange(childValuesOnly);
		},
		[onChange, getChildrenValues, options],
	);

	// Convert child values to cascader paths format
	const cascaderValue = useMemo(() => {
		const paths: (string | number)[][] = [];
		const valueSet = new Set(value);

		options.forEach((parent) => {
			if (parent.children) {
				// Always show individual selected children (never show parent)
				parent.children.forEach((child) => {
					if (valueSet.has(child.value)) {
						paths.push([parent.value, child.value]);
					}
				});
			}
		});

		return paths;
	}, [value, options]);

	// Handle search input change
	const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchValue(e.target.value);
	}, []);

	// Clear search when dropdown closes
	const handleOpenChange = useCallback(
		(newOpen: boolean) => {
			setOpen(newOpen);
			if (!newOpen) {
				setSearchValue('');
			}
			restProps.onOpenChange?.(newOpen);
		},
		[restProps],
	);

	// Custom popup render with search
	const popupRender = useCallback(
		(menu: React.ReactElement) => (
			<div className="cascader-select-dropdown">
				<div className="cascader-select-dropdown__search">
					<Input
						prefix={<SearchOutlined />}
						placeholder={t('Search options...')}
						value={searchValue}
						onChange={handleSearchChange}
						allowClear
						// Prevent cascader's own input handlers from receiving events from this search field.
						// Otherwise Backspace/Delete can remove the currently selected cascader values.
						onMouseDown={(e) => e.stopPropagation()}
						onClick={(e) => e.stopPropagation()}
						onKeyDown={(e) => e.stopPropagation()}
						onKeyUp={(e) => e.stopPropagation()}
					/>
				</div>
				<div className="cascader-select-dropdown__menu">{menu}</div>
			</div>
		),
		[searchValue, handleSearchChange, t],
	);

	// Type assertion needed due to Ant Design Cascader's complex generic types with multiple mode
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const cascaderProps: any = {
		multiple: true,
		value: cascaderValue,
		options: filteredOptions,
		placeholder,
		disabled,
		allowClear,
		changeOnSelect: true,
		open,
		style,
		className,
        showCheckedStrategy: 'SHOW_CHILD',
		maxTagCount: 'responsive',
        onOpenChange: handleOpenChange,
		popupRender,
        onChange: handleChange,
		...safeRestProps,
	};

	return <Cascader {...cascaderProps} />;
};
