import React from 'react';
import { Switch, Spin } from 'antd';

type ToggleWithLabelProps = {
	value: boolean | string | null | undefined; // true/false or 'Y'/'N'
	onChange?: (checked: boolean) => void;
	busy?: boolean;
	disabled?: boolean;
	ariaLabel?: string;
	className?: string;
};

export const ToggleWithLabel: React.FC<ToggleWithLabelProps> = ({ value, onChange, busy, disabled, ariaLabel, className }) => {
	const checked = value === true || value === 'Y' || value === 'y' || value === '1';

	return (
		<div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }} className={className}>
			<Switch
				checked={checked}
				onChange={onChange}
				disabled={disabled}
				aria-label={ariaLabel}
			/>
			{busy ? <Spin size="small" /> : null}
		</div>
	);
};

export default ToggleWithLabel;
