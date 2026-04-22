import { Flex } from 'antd';

import { AddButton } from '@/components/common/buttons';
import { useAppTranslate, useToggle } from '@/hooks';
import { useGetRoleList } from '@/hooks/modules';
import { authStore, useRoleManagementStore } from '@/stores';
import { AddRoleModal, ViewRoleModal } from '../modals';
import { RoleTable } from '../tables';

export const RoleView = () => {
	const { t } = useAppTranslate();
	const { isToggle: isOpenAddModal, toggle: toggleAddModal } = useToggle(false);
	const { isToggle: isOpenViewModal, toggle: toggleViewModal } = useToggle(false);
	const searchConditions = useRoleManagementStore((state) => state.search.roleFilter);

	//=========================ZUSTAND STORES===============================
	const setSelectedRoleId = useRoleManagementStore((state) => state.setSelectedRoleId);

	const { data: roleList, isLoading } = useGetRoleList({
		...searchConditions.filter,
		coId: authStore.user?.userInfo.coId,
		pagination: searchConditions.pagination,
		sort: searchConditions.sort,
	});

	function handleSelectRoleId(value: string) {
		setSelectedRoleId(value);
		toggleViewModal();
	}

	return (
		<>
			<Flex
				justify="end"
				gap={8}
				style={{
					paddingBottom: '8px',
				}}
			>
				<AddButton onClick={toggleAddModal}>
					{t('Add New')}
				</AddButton>
			</Flex>
			<RoleTable data={roleList!} isLoading={isLoading} onSelectRole={handleSelectRoleId} />

			{/* Modals */}
			<AddRoleModal open={isOpenAddModal} onCancel={toggleAddModal} />
			<ViewRoleModal open={isOpenViewModal} onCancel={toggleViewModal} />
		</>
	);
};
