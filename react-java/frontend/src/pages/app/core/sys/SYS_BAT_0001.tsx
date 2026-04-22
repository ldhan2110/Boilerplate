import { Flex, Form } from 'antd';
import { observer } from 'mobx-react-lite';

import { PermissionGate } from '@/components/common';
import { BatchJobFilter, BatchJobHistoryTable, BatchJobTable } from '@/components/modules/core/sys';
import { ABILITY_ACTION, ABILITY_SUBJECT } from '@/constants';

const SYS_BAT_0001 = observer(() => {
    const [form] = Form.useForm();

    return <>
        <PermissionGate
            permissions={[
                {
                    ability: ABILITY_ACTION.VIEW,
                    entity: ABILITY_SUBJECT.BATCH_JOB_MANAGEMENT,
                },
            ]}
        >
            <Flex gap={8} vertical>
                <BatchJobFilter form={form} />
                <BatchJobTable />
                <BatchJobHistoryTable />
            </Flex>
        </PermissionGate>

    </>
});

export default SYS_BAT_0001;