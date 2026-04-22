import React, { useState } from 'react';
import { AutoComplete, Input, type AutoCompleteProps } from 'antd';
import { observer } from 'mobx-react-lite';

import { ROUTES } from '@utils/routes';
import appStore from '@stores/AppStore';
import { authService } from '@services/auth/authJwtService';
import { useGetProgramList } from '@hooks/modules';

const ProgramSearchAutoComplete: React.FC = observer(() => {
	const [options, setOptions] = useState<AutoCompleteProps['options']>([]);
	const { openTab } = appStore;

	// Load the current active menu tree
	const { data: programList } = useGetProgramList({
		coId: authService.getCurrentCompany()!,
		useFlg: 'Y',
	});

	const handleSearch = (value: string) => {
		setOptions(value ? searchResult(value) : []);
	};

	const onSelect = (value: string) => {
		if (!value) return;
		const selectedItem = programList?.programList?.find((item) => {
			const keyMatch = item.pgmCd?.toString() === value || item.pgmId?.toString() === value;
			const labelMatch =
					item.pgmNm && item.pgmNm.trim().toLowerCase() === value.trim().toLowerCase();
				return keyMatch || labelMatch;
			}) || null;

		if (selectedItem) {
			openTab({
				key: selectedItem.pgmCd || selectedItem.pgmId || '',
				label: selectedItem.pgmNm || '',
			});
		} else {
			console.warn(`Program not found for value: ${value}`);
		}
	};

	const searchResult = (query: string) => {
		if (!query) return [];

		const allowedKeys = new Set(
			(programList?.programList || []).filter((p) => p.pgmTpCd === 'UI')
				.map((p) => p.pgmCd)
				.filter(Boolean),
		);

		return ROUTES.filter(
			(item) =>
				allowedKeys.has(item.key) &&
				(item.key.toLowerCase().includes(query.toLowerCase()) ||
					item.label.toLowerCase().includes(query.toLowerCase())),
		).map((item) => ({
			value: item.key,
			label: (
				<div style={{ display: 'flex', justifyContent: 'space-between' }}>
					<span>{item.label}</span>
					<span>{item.key}</span>
				</div>
			),
		}));
	};

	return (
		<AutoComplete
			popupMatchSelectWidth={300}
			style={{ width: 300 }}
			options={options}
			onSelect={onSelect}
			onSearch={handleSearch}
		>
			<Input.Search size="middle" placeholder="Search Program No" enterButton />
		</AutoComplete>
	);
});

export default ProgramSearchAutoComplete;

