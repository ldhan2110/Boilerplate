import { useState } from 'react';
import { Flex, Form, Tabs, type TabsProps } from 'antd';
import { observer } from 'mobx-react-lite';

import type { ProgramListFilterForm, RoleListFilterForm } from '@/types';
import { PermissionGate } from '@/components/common';
import { ProgramFilter, ProgramView, RoleFilter, RoleView } from '@/components/modules/core/adm';
import { ABILITY_ACTION, ABILITY_SUBJECT } from '@/constants';
import { useAppTranslate, usePermission } from '@/hooks';

const TAB_KEY = {
	ROLE: 'ROLE',
	PGM: 'PGM',
};

const ADM_M0002 = observer(() => {
	const { t } = useAppTranslate();
	const [activeKey, setActiveKey] = useState(TAB_KEY.ROLE);
	const { hasAbility } = usePermission();

	const TAB_ITEMS: TabsProps['items'] = [
		{
			key: TAB_KEY.ROLE,
			id: TAB_KEY.ROLE,
			label: t('Role'),
			children: <RoleView />,
		},
		{
			key: TAB_KEY.PGM,
			id: TAB_KEY.PGM,
			label: t('Program'),
			children: <ProgramView />,
		},
	];

	// Filters
	const [roleFilterForm] = Form.useForm<RoleListFilterForm>();
	const [pgmFilterForm] = Form.useForm<ProgramListFilterForm>();

	function onTabChange(activeKey: string) {
		setActiveKey(activeKey);
	}

	return (
		<>
			<PermissionGate
				permissions={[
					{
						ability: ABILITY_ACTION.VIEW,
						entity: ABILITY_SUBJECT.ROLE_MANAGEMENT,
					},
				]}
			>
				<Flex vertical>
					{activeKey == 'ROLE' ? (
						<RoleFilter form={roleFilterForm} />
					) : (
						<ProgramFilter form={pgmFilterForm} />
					)}
					<Tabs
						tabBarGutter={8}
						activeKey={activeKey}
						type="card"
						items={TAB_ITEMS.filter((item) => {
							switch (item.key) {
								case TAB_KEY.PGM:
									if (hasAbility(ABILITY_ACTION.VIEW_PROGRAM, ABILITY_SUBJECT.ROLE_MANAGEMENT)) {
										return true;
									}
									return false;
								case TAB_KEY.ROLE:
									if (hasAbility(ABILITY_ACTION.VIEW, ABILITY_SUBJECT.ROLE_MANAGEMENT)) {
										return true;
									}
									return false;
							}
						})}
						onChange={onTabChange}
					/>
				</Flex>
			</PermissionGate>
		</>
	);
});

export default ADM_M0002;
