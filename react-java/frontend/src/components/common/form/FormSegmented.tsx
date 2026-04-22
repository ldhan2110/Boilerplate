import React from 'react';
import { Segmented } from 'antd';
import type { SegmentedProps } from 'antd';

type FormSegmentedProps<T = string | number> = Omit<
	SegmentedProps<T>,
	'size' | 'block' | 'style'
> & {
	size?: SegmentedProps<T>['size'];
	block?: boolean;
	style?: React.CSSProperties;
	className?: string;
};

const DEFAULT_STYLE: React.CSSProperties = { width: 'fit-content' };

const SEGMENTED_CONTROL_CLASS = 'segmented-control';

/**
 * Common Segmented control (tab-like switcher) with consistent default styling.
 * Wraps Ant Design Segmented with size="middle", block={false}, width: fit-content.
 * Naming follows Form* convention in components/common/form.
 */
export function FormSegmented<T = string | number>({
	options,
	value,
	onChange,
	size = 'middle',
	block = false,
	style,
	className,
	...rest
}: FormSegmentedProps<T>) {
	return (
		<Segmented<T>
			className={className ?? SEGMENTED_CONTROL_CLASS}
			options={options}
			value={value}
			onChange={onChange}
			size={size}
			block={block}
			style={style ?? DEFAULT_STYLE}
			{...rest}
		/>
	);
}
