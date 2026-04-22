import { Select } from 'antd';
import React from 'react';
import appStore from '@/stores/AppStore';
import { DateFormat } from '@/types';
import { observer } from 'mobx-react-lite';
import { FORMAT_TYPE_DATE } from '@/constants';

const { Option } = Select;

const GlobalFormatDateSelector: React.FC = observer(() => {
	const handleChange = (value: string) => {
		appStore.setDateFormat(value as DateFormat);
	};

	const renderOption = (lang: (typeof FORMAT_TYPE_DATE)[0]) => (
		<Option key={lang.code} value={lang.code}>
			{lang.label}
		</Option>
	);

	return (
		<Select value={appStore.state.dateFormat} onChange={handleChange} style={{ width: 150 }}>
			{FORMAT_TYPE_DATE.map(renderOption)}
		</Select>
	);
});

export default GlobalFormatDateSelector;
