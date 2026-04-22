import { Flex } from 'antd';
import { observer } from 'mobx-react-lite';

import { PermissionGate } from '@/components/common';
import { MessageFilter, MessageTable } from '@/components/modules/core/sys';
import { ABILITY_ACTION, ABILITY_SUBJECT } from '@/constants';

const SYS_MSG_0001 = observer(() => {
	return (
		<PermissionGate
			permissions={[
				{
					ability: ABILITY_ACTION.VIEW,
					entity: ABILITY_SUBJECT.MESSAGE_MANAGEMENT,
				},
			]}
		>
			<Flex vertical gap={8}>
				<MessageFilter />
				<MessageTable />
			</Flex>
		</PermissionGate>
	);
});

export default SYS_MSG_0001;

