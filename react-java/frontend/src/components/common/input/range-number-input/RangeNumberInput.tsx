import React, { type CSSProperties, useCallback, useRef, useState } from 'react';
import { InputNumber, type InputNumberProps } from 'antd';
import { SwapRightOutlined } from '@ant-design/icons';

import type { RangeValue } from '@/types';
import './RangeNumberInput.scss';

export interface RangeNumberInputProps
	extends Omit<InputNumberProps, 'value' | 'onChange' | 'placeholder'> {
	/** Current value of the range input as [min, max] */
	value?: RangeValue;

	/** Callback fired when the value changes. Receives new [min, max] array */
	onChange?: (value: RangeValue) => void;

	/** Placeholder text for both inputs [minPlaceholder, maxPlaceholder] */
	placeholder?: [string, string];

	/** Whether the input is disabled */
	disabled?: boolean;

	/** Minimum value allowed for both inputs */
	min?: number;

	/** Maximum value allowed for both inputs */
	max?: number;

	/** Step increment for number input */
	step?: number;

	/** Precision (decimal places) for number input */
	precision?: number;

	/** Custom CSS styles for the container */
	style?: CSSProperties;

	/** Additional CSS class name for the container */
	className?: string;

	/** Whether to show clear button on hover */
	allowClear?: boolean;
}

/**
 * RangeNumberInput - A number range input component that behaves like Ant Design's RangePicker
 *
 * @component
 * @example
 * const [range, setRange] = useState<RangeValue>([10, 50]);
 * return <RangeNumberInput value={range} onChange={setRange} />
 */
export const RangeNumberInput: React.FC<RangeNumberInputProps> = ({
	value,
	onChange,
	placeholder = ['Min', 'Max'],
	disabled = false,
	step = 1,
	precision,
	style,
	className,
	allowClear = true,
	prefix,
	...restProps
}) => {
	const [focused, setFocused] = useState(false);
	const [hovered, setHovered] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const currentValue = value || [null, null];

	const handleClear = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onChange?.([null, null]);
		},
		[onChange],
	);

	const handleChange = useCallback(
		(index: number, val: number | null) => {
			// Update internal state immediately for responsive UI
			const newValue: RangeValue = [...currentValue];
			newValue[index] = val;
			onChange?.(newValue);
		},
		[onChange],
	);

	const handleFocus = useCallback(() => setFocused(true), []);
	const handleBlur = useCallback(() => setFocused(false), []);
	const handleMouseEnter = useCallback(() => setHovered(true), []);
	const handleMouseLeave = useCallback(() => setHovered(false), []);

	const showClear =
		allowClear && hovered && !disabled && (currentValue[0] !== null || currentValue[1] !== null);

	const containerClassName = [
		'range-number-input',
		focused && 'range-number-input--focused',
		disabled && 'range-number-input--disabled',
		className,
	]
		.filter(Boolean)
		.join(' ');

	return (
		<div
			ref={containerRef}
			className={containerClassName}
			style={style}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onBlur={handleBlur}
		>
			<InputNumber
				value={currentValue[0]}
				onChange={(val) => handleChange(0, val as number)}
				placeholder={placeholder[0]}
				disabled={disabled}
				step={step}
				precision={precision}
				onFocus={handleFocus}
				controls={false}
				className="range-number-input__input clickable-prefix-input"
				prefix={prefix}
				{...restProps}
			/>

			<span className="range-number-input__separator">
				<SwapRightOutlined />
			</span>

			<InputNumber
				value={currentValue[1]}
				onChange={(val) => handleChange(1, val as number)}
				placeholder={placeholder[1]}
				disabled={disabled}
				precision={precision}
				onFocus={handleFocus}
				controls={false}
				className="range-number-input__input"
				{...restProps}
			/>

			{showClear && (
				<span className="range-number-input__clear" onClick={handleClear}>
					×
				</span>
			)}
		</div>
	);
};
