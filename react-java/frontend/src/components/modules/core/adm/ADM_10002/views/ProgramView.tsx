import { Col, Row } from 'antd';

import { PermissionTable, ProgramTable } from '../tables';

export const ProgramView = () => {
	return (
		<>
			<Row gutter={[16, 16]}>
				<Col span={14}>
					<ProgramTable />
				</Col>
				<Col span={10}>
					<PermissionTable />
				</Col>
			</Row>
		</>
	);
};
