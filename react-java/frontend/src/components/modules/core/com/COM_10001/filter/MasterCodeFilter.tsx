import { Flex, type FormInstance } from 'antd';

import type { MasterCodeFilterForm } from '@/types';
import { FormInput, FormSearchContainer, FormSelect } from '@/components/common/form';
import { useAppTranslate } from '@/hooks';
import { useCommonCodeManagementStore } from '@/stores';

type MasterCodeFilterProps = {
	form: FormInstance<MasterCodeFilterForm>;
};

export const MasterCodeFilter = ({ form }: MasterCodeFilterProps) => {
	const { t } = useAppTranslate();

	// Zustand stores
	const searchConditions = useCommonCodeManagementStore((state) => state.masterCodeSearch);
	const masterCodeTableForm = useCommonCodeManagementStore((state) => state.masterCodeTableForm);
	const subCodeTableForm = useCommonCodeManagementStore((state) => state.subCodeTableForm);
	const setFilter = useCommonCodeManagementStore((state) => state.setMasterCodeFilter);
	const clearSearch = useCommonCodeManagementStore((state) => state.clearMasterCodeSearch);

	async function onFormRefresh() {
		const isUnsaved = await masterCodeTableForm?.checkUnsavedFormChange(()=> {
			clearSearch(form);
			masterCodeTableForm?.resetInitialFieldsValue();
		});
		if (isUnsaved) {
			subCodeTableForm?.checkUnsavedFormChange(() => {
				clearSearch(form);
				masterCodeTableForm?.resetInitialFieldsValue();
			});
		}
	}

	async function onFormSearch() {
		const isUnsaved = await masterCodeTableForm?.checkUnsavedFormChange(()=> {
			const conditions = form.getFieldsValue();
				setFilter(conditions);
		});
		if (isUnsaved) {
			subCodeTableForm?.checkUnsavedFormChange(() => {
				const conditions = form.getFieldsValue();
				setFilter(conditions);
			});
		}
	}

	return (
		<>
			<FormSearchContainer
				form={form}
				initialValues={searchConditions.filter}
				onRefresh={onFormRefresh}
				onSearch={onFormSearch}
			>
				<Flex gap={8} vertical>
					<Flex gap={16}>
						<FormInput
							name="mstCd"
							label={t('Master Code')}
							placeholder={t('Enter Master Code')}
							width={200}
						/>
						<FormInput
							name="mstNm"
							label={t('Master Name')}
							placeholder={t('Enter Master Name')}
							width={220}
						/>
						<FormSelect
							name="useFlg"
							label={t('Active')}
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