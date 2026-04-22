import { useAppAbility } from './useAppAbility';
import { authStore } from '@/stores';

export function usePermission() {
	const { createAbilities, updateAbilities, hasAbility, hasRuleDefined } = useAppAbility();

	const permissions = authStore.role?.roleAuthList || [];

	function initAbilities() {
		const { can, rules } = createAbilities();
		for (const perm of permissions) {
			can(perm.permCd!, perm.pgmCd!);
		}
		updateAbilities(rules);
	}

	return {
		initAbilities,
		hasAbility,
		hasRuleDefined,
	};
}
