import { ability, AbilityContext } from '@/constants';
import { usePermission } from '@/hooks';
import { authStore } from '@/stores';
import { observer } from 'mobx-react-lite';
import React from 'react';

export const PermissionProvider = observer(({ children }: { children: React.ReactNode }) => {
	const { initAbilities } = usePermission();

	React.useEffect(() => {
		if (authStore.isAuthenticated) {
			initAbilities();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>;
});
