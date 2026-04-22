import { Flex, type FormInstance } from 'antd';

import type { RoleListFilterForm } from '@/types';
import { FormInput, FormSearchContainer, FormSelect } from '@/components/common/form';
import { useAppTranslate } from '@/hooks';
import { useRoleManagementStore } from '@/stores';

type RoleFilterProps = {
	form: FormInstance<RoleListFilterForm>;
};

export const RoleFilter = ({ form }: RoleFilterProps) => {
	const { t } = useAppTranslate();

	// Zustand Stores
	const searchConditions = useRoleManagementStore((state) => state.search);
	const setFilter = useRoleManagementStore((state) => state.setRoleFilter);
	const clearSearch = useRoleManagementStore((state) => state.clearRoleSearch);

	async function onFormRefresh() {
		clearSearch(form);
	}

	function onFormSearch() {
		const conditions = form.getFieldsValue();
		setFilter(conditions);
	}
	return (
		<>
			<FormSearchContainer
				form={form}
				initialValues={searchConditions.roleFilter.filter}
				onRefresh={onFormRefresh}
				onSearch={onFormSearch}
			>
				<Flex gap={8} vertical>
					<Flex gap={16}>
					<FormInput
						name="roleCd"
						label={t('Role Code')}
						placeholder={t('Enter Role Code')}
						width={200}
					/>

					<FormInput
						name="roleNm"
						label={t('Role Name')}
						placeholder={t('Enter Role Name')}
						width={220}
					/>
					<FormSelect
						name="useFlg"
						label={t('Status')}
						width={100}
						options={[
							{ label: t('All'), value: '' },
							{ label: t('Active'), value: 'Y' },
							{ label: t('Inactive'), value: 'N' },
						]}
					/>
					</Flex>
				</Flex>
			</FormSearchContainer>
		</>
	);
};
