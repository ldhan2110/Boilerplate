import { Flex, Form } from 'antd';
import { FormInput, FormRangeDatePicker, FormSearchContainer, FormMultiSelect } from '@/components/common/form';
import { useAppTranslate } from '@/hooks';
import type { Dayjs } from 'dayjs';

export interface EmailFilterValues {
	dateRange?: [Dayjs, Dayjs];
	emlSndStsCd?: string;
	emlTo?: string;
	emlSubjVal?: string;
}

interface EmailFilterProps {
	onSearch: (values: EmailFilterValues) => void;
	onRefresh: () => void;
}

export const EmailFilter: React.FC<EmailFilterProps> = ({ onSearch, onRefresh }) => {
	const { t } = useAppTranslate();
	const [filterForm] = Form.useForm<EmailFilterValues>();

	function handleSearch() {
		const values = filterForm.getFieldsValue();
		onSearch(values);
	}

	function handleRefresh() {
		filterForm.resetFields();
		onRefresh();
	}

	return (
		<FormSearchContainer
			form={filterForm}
			onRefresh={handleRefresh}
			onSearch={handleSearch}
			layout='vertical'
		>
			<Flex gap={16}>
				<FormRangeDatePicker
					name="dateRange"
					label={t('Date Range')}
					width={260}
				/>
				<FormMultiSelect
					name="emlSndStsCd"
					label={t('Status')}
					width={130}
					allowSelectAll
					options={[
						{ label: 'PENDING', value: 'PENDING' },
						{ label: 'SUCCESS', value: 'SUCCESS' },
						{ label: 'ERROR', value: 'ERROR' },
					]}
				/>
				<FormInput
					name="emlTo"
					label={t('Recipient')}
					placeholder={t('Enter Recipient')}
					width={200}
				/>
				<FormInput
					name="emlSubjVal"
					label={t('Subject')}
					placeholder={t('Enter Subject')}
					width={250}
				/>
			</Flex>
		</FormSearchContainer>
	);
};
