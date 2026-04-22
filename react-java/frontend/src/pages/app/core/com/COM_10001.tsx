import React from 'react';
import { Flex, Form } from 'antd';
import { observer } from 'mobx-react-lite';
import { MasterCodeFilter, MasterCodeTable, type MasterCodeTableRef, SubCodeTable, type SubCodeTableRef } from '@/components/modules/core';
import { PermissionGate } from '@/components';
import { ABILITY_ACTION, ABILITY_SUBJECT } from '@/constants';

const COM_10001 = observer(() => {
	// Forms
	const [masterCodeFilterForm] = Form.useForm();

	// Table Refs
	const masterCodeTableRef = React.useRef<MasterCodeTableRef>(null);
	const subCodeTableRef = React.useRef<SubCodeTableRef>(null);

	return (
		<PermissionGate permissions={[
			{
				ability: ABILITY_ACTION.VIEW,
				entity: ABILITY_SUBJECT.COMMON_CODE_MANAGEMENT,
			},
		]}>
			<Flex vertical gap={16}>
				{/* Master Code Section */}
				<MasterCodeFilter form={masterCodeFilterForm} />
				<MasterCodeTable ref={masterCodeTableRef} />

				{/* Detail Code Section */}
				<SubCodeTable ref={subCodeTableRef} />
			</Flex>
		</PermissionGate>
	);
});

export default COM_10001;
