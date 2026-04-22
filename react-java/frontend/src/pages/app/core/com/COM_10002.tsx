import { Flex } from 'antd';
import { observer } from 'mobx-react-lite';
import { AddReportButton, DeleteReportButton, PermissionGate, ReportFilter, ReportTable } from '@/components';
import { ABILITY_ACTION, ABILITY_SUBJECT } from '@/constants';
import { useReportManagementStore } from '@/stores';
import React from 'react';

const COM_10002 = observer(() => {

	const selectedRows = useReportManagementStore((state) => state.selectedRows);
	const initOptions = useReportManagementStore((state) => state.initOptions);

	React.useEffect(() => {
		initOptions();
	}, []);
	
	return (
		<PermissionGate permissions={[
			{
				ability: ABILITY_ACTION.VIEW,
				entity: ABILITY_SUBJECT.COMMON_CODE_MANAGEMENT,
			},
		]}>
			<Flex vertical gap={8}>
				<ReportFilter />
				<Flex justify="end" gap={8}>
					{selectedRows.length > 0 && <DeleteReportButton />}
					<AddReportButton />
				</Flex>
				<ReportTable />
			</Flex>
		</PermissionGate>
	);
});

export default COM_10002;
