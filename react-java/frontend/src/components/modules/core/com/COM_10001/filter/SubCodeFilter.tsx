import { Input } from 'antd';
import { useAppTranslate } from '@/hooks';
import { useCommonCodeManagementStore } from '@/stores';

export const SubCodeFilter = () => {
	const { t } = useAppTranslate();

	// Zustand stores
	const searchConditions = useCommonCodeManagementStore((state) => state.detailCodeSearch);
	const setFilter = useCommonCodeManagementStore((state) => state.setDetailCodeFilter);

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		setFilter({ subCd: e.target.value });
	}

	return (
		<Input
			placeholder={t('Enter Code/Name')}
			value={searchConditions.filter.subCd || ''}
			onChange={handleChange}
			allowClear
			style={{ width: 200 }}
		/>
	);
};

