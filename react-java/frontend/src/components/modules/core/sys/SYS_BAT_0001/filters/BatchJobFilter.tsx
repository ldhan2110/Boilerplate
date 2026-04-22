import { Flex, type FormInstance } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import type { SearchBatchJobConfigDto } from '@/types';
import { FormInput, FormSearchContainer, FormSelect } from '@/components/common/form';
import { QUERY_KEY } from '@/constants';
import { useAppTranslate } from '@/hooks';
import { useBatchJobStore } from '@/stores';

type BatchJobFilterProps = {
    form: FormInstance<SearchBatchJobConfigDto>;
};

export const BatchJobFilter = ({ form }: BatchJobFilterProps) => {
    const { t } = useAppTranslate();
    const queryClient = useQueryClient();

    // Zustand Stores
    const searchConditions = useBatchJobStore((state) => state.search);
    const setFilter = useBatchJobStore((state) => state.setFilter);
    const clearSearch = useBatchJobStore((state) => state.clearSearch);

    async function onFormRefresh() {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY.COMMON.GET_BATCH_JOB_LIST] });
        clearSearch(form);
    }

    function onFormSearch() {
        const conditions = form.getFieldsValue();
        setFilter(conditions);
    }

    return <>
        <FormSearchContainer
            form={form}
            initialValues={searchConditions.filter}
            onRefresh={onFormRefresh}
            onSearch={onFormSearch}
        >
            <Flex gap={16} vertical>
                <Flex gap={32}>
                    <FormInput
                        name="jbBatId"
                        label={'Batch Job ID'}
                        placeholder={t('Enter Batch Job ID')}
                        width={250}
                    />
                    <FormInput
                        name="jbBatNm"
                        label={'Batch Job Name'}
                        placeholder={t('Enter Batch Job Name')}
                        width={250}
                    />
                    <FormSelect
                        name="useFlg"
                        label={'Status'}
                        width={100}
                        options={[
                            { label: 'All', value: '' },
                            { label: 'Active', value: 'Y' },
                            { label: 'Inactive', value: 'N' },
                        ]}
                    />
                </Flex>
            </Flex>
        </FormSearchContainer>
    </>
}