import { Flex, type FormInstance } from 'antd';

import type { ProgramListFilterForm } from '@/types';
import { FormInput, FormSearchContainer, FormSelect } from '@/components/common/form';
import { useAppTranslate } from '@/hooks';
import { useRoleManagementStore } from '@/stores';

type ProgramFilterProps = {
	form: FormInstance<ProgramListFilterForm>;
};

export const ProgramFilter = ({ form }: ProgramFilterProps) => {
	const { t } = useAppTranslate();

	// Zustand stores
	const searchConditions = useRoleManagementStore((state) => state.search);
	const permissionTableForm = useRoleManagementStore((state) => state.permissionTableForm);
	const setFilter = useRoleManagementStore((state) => state.setProgramFilter);
	const clearSearch = useRoleManagementStore((state) => state.clearPgmSearch);

	async function onFormRefresh() {
		permissionTableForm?.checkUnsavedFormChange(() => clearSearch(form));
	}

	function onFormSearch() {
		permissionTableForm?.checkUnsavedFormChange(() => {
			const conditions = form.getFieldsValue();
			setFilter(conditions);
		});
	}
	return (
		<>
			<FormSearchContainer
				form={form}
				initialValues={searchConditions.programFilter.filter}
				onRefresh={onFormRefresh}
				onSearch={onFormSearch}
			>
				<Flex gap={8} vertical>
					<Flex gap={16}>
					<FormInput
						name="pgmCd"
						label="Program Code"
						placeholder={t('Enter Program Code')}
						width={200}
					/>
					<FormInput
						name="pgmNm"
						label="Program Name"
						placeholder={t('Enter Program Name')}
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
