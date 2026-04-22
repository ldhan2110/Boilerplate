import { AddButton } from '@/components/common/buttons';
import { PermissionGate } from '@/components/common';
import { ABILITY_ACTION, ABILITY_SUBJECT } from '@/constants';
import { useAppTranslate, useToggle } from '@/hooks';
import { AddMessageDrawer } from '../drawers';

export const AddMessageButton = () => {
	const { t } = useAppTranslate();
	const { isToggle: isOpenAddDrawer, toggle: toggleAddDrawer } = useToggle(false);

	return (
		<PermissionGate
			permissions={[
				{ ability: ABILITY_ACTION.ADD, entity: ABILITY_SUBJECT.MESSAGE_MANAGEMENT },
			]}
			variant="hidden"
		>
			<AddButton onClick={toggleAddDrawer}>
				{t('Add New')}
			</AddButton>

			<AddMessageDrawer open={isOpenAddDrawer} onClose={toggleAddDrawer} />
		</PermissionGate>
	);
};

