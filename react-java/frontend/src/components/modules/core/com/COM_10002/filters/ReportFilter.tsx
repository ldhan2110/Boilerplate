import { FormSearchContainer, FormInput, FormSelect } from '@/components/common/form';
import { useReportManagementStore } from '@/stores/modules';
import type { ProgramDto } from '@/types';
import { Flex, Form } from 'antd';
import { useTranslation } from 'react-i18next';

export const ReportFilter = () => {
	const [form] = Form.useForm();
	const { t } = useTranslation();

	const programList = useReportManagementStore((state) => state.options.programList);
	const searchConditions = useReportManagementStore((state) => state.search);
	const setFilter = useReportManagementStore((state) => state.setFilter);
	const clearSearch = useReportManagementStore((state) => state.clearSearch);

	function onFormRefresh() {
		clearSearch(form);
	}

	function onFormSearch() {
		const conditions = form.getFieldsValue();
		setFilter(conditions);
	}

	return (
		<FormSearchContainer
			form={form}
			initialValues={searchConditions.filter}
			onRefresh={onFormRefresh}
			onSearch={onFormSearch}
		>
			<Flex gap={16} vertical>
				<Flex gap={16}>
					<FormInput
						name="textSearch"
						label={t('Search')}
						width={200}
						placeholder={t('Search Report Code or Name...')}
					/>
					<div>
						<FormSelect
							name="pgmId"
							label={t('Program')}
							width={200}
							placeholder={t('Select Program')}
							options={programList?.map((program: ProgramDto) => ({
								label: program.pgmNm,
								value: program.pgmId,
							}))}
						/>
					</div>
					<div style={{ marginLeft: '6%' }}>
						<FormSelect
							name="useFlg"
							label={t('Status')}
							width={130}
							options={[
								{ label: t('All'), value: ''},
								{ label: t('Active'), value: 'Y' },
								{ label: t('Inactive'), value: 'N' },
							]}
						/>
					</div>
				</Flex>
			</Flex>
		</FormSearchContainer>
	);
};
