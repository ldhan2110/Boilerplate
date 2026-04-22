import React from 'react';
import { Select } from 'antd';
import appStore from '@/stores/AppStore';
import { observer } from 'mobx-react-lite';

const { Option } = Select;

const PRIMARY_COLORS = [
	{ value: '#1890ff', label: 'Blue', color: '#1890ff' },
	{ value: '#52c41a', label: 'Green', color: '#52c41a' },
	{ value: '#faad14', label: 'Gold', color: '#faad14' },
	{ value: '#f5222d', label: 'Red', color: '#f5222d' },
	{ value: '#722ed1', label: 'Purple', color: '#722ed1' },
	{ value: '#13c2c2', label: 'Cyan', color: '#13c2c2' },
	{ value: '#eb2f96', label: 'Magenta', color: '#eb2f96' },
	{ value: '#fa8c16', label: 'Orange', color: '#fa8c16' },
];

const PrimaryColorSelector: React.FC = observer(() => {
	const { primaryColor } = appStore.state;

	const handleChange = (value: string) => {
		appStore.setPrimaryColor(value);
	};

	const renderOption = (colorOption: (typeof PRIMARY_COLORS)[0]) => (
		<Option key={colorOption.value} value={colorOption.value}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
				<div
					style={{
						width: 16,
						height: 16,
						borderRadius: 4,
						backgroundColor: colorOption.color,
						border: '1px solid rgba(0, 0, 0, 0.1)',
						flexShrink: 0,
					}}
				/>
				<span>{colorOption.label}</span>
			</div>
		</Option>
	);

	return (
		<Select value={primaryColor} onChange={handleChange} style={{ width: 150 }}>
			{PRIMARY_COLORS.map(renderOption)}
		</Select>
	);
});

export default PrimaryColorSelector;

