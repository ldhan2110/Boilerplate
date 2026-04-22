import { Flex, Form } from 'antd';

import type { MessageListFilterForm } from '@/types';
import { FormInput, FormSearchContainer, FormSelect } from '@/components/common/form';
import { useAppTranslate } from '@/hooks';
import { useMessageManagementStore } from '@/stores';

export const MessageFilter = () => {
	const { t } = useAppTranslate();
	const [filterForm] = Form.useForm<MessageListFilterForm>();

	// Zustand Store
	const searchConditions = useMessageManagementStore((state) => state.search);
	const setFilter = useMessageManagementStore((state) => state.setFilter);
	const clearSearch = useMessageManagementStore((state) => state.clearSearch);

	async function onFormRefresh() {
		clearSearch(filterForm);
	}

	function onFormSearch() {
		const conditions = filterForm.getFieldsValue();
		setFilter(conditions);
	}

	return (
		<>
			<FormSearchContainer
				form={filterForm}
				initialValues={searchConditions.filter}
				onRefresh={onFormRefresh}
				onSearch={onFormSearch}
			>
				<Flex gap={8} vertical>
					<Flex gap={24}>
						<FormInput
							name="msgId"
							label={'Message ID'}
							placeholder={t('Enter Message ID')}
							width={200}
						/>
						<FormInput
							name="dfltMsgVal"
							label={'Default Message'}
							placeholder={t('Enter Default Message')}
							width={300}
						/>
						<div className='w-[180px]'>
							<FormSelect
								name="mdlNm"
								label={'Module'}
								width={130}
								options={[
									{ label: 'All', value: '' },
									{ label: 'Common', value: 'COM' },
									{ label: 'Admin', value: 'ADM' },
									{ label: 'Master Data', value: 'MST' },
									{ label: 'Employee Management', value: 'EMP' },
									{ label: 'System Configuration', value: 'SYS' },
								]}
							/>
						</div>
						<div className='w-2/5'>
							<FormSelect
								name="msgTpVal"
								label={'Type'}
								width={130}
								options={[
									{ label: 'All', value: '' },
									{ label: 'Info', value: 'INFO' },
									{ label: 'Warning', value: 'WARN' },
									{ label: 'Error', value: 'ERROR' },
									{ label: 'Success', value: 'SUCCESS' },
									]}
								/>
						</div>
					</Flex>
				</Flex>
			</FormSearchContainer>
		</>
	);
};

