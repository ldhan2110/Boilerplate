import React from 'react';
import { ABILITY_ACTION, type ABILITY_SUBJECT_TYPE, AbilityContext } from '@/constants';
import {
	AbilityBuilder,
	createMongoAbility,
	type ExtractSubjectType,
	type MongoQuery,
	type Subject,
	type SubjectRawRule,
} from '@casl/ability';
import { useAbility } from '@casl/react';

export function useAppAbility() {
	const abilityCtx = useAbility(AbilityContext);

	const createAbilities = React.useCallback(() => {
		const { can, cannot, build, rules } = new AbilityBuilder(createMongoAbility);
		return { can, cannot, build, rules };
	}, []);

	const updateAbilities = React.useCallback(
		(rules: SubjectRawRule<string, ExtractSubjectType<Subject>, MongoQuery>[]) => {
			abilityCtx.update(rules);
		},
		[abilityCtx],
	);

	const resetAbilities = React.useCallback(() => {
		abilityCtx.update([]);
	}, [abilityCtx]);

	const hasAbility = (
		action: ABILITY_ACTION,
		subject: ABILITY_SUBJECT_TYPE,
		type: 'can' | 'cannot' = 'can',
		fields?: string,
	) => {
		return type === 'cannot'
			? abilityCtx.cannot(action, subject, fields)
			: abilityCtx.can(action, subject, fields);
	};

	const hasRuleDefined = React.useCallback((): boolean => {
		return abilityCtx.rules.length > 0;
	}, [abilityCtx]);

	return {
		ability: abilityCtx,
		rules: abilityCtx.rules,
		createAbilities,
		updateAbilities,
		hasAbility,
		resetAbilities,
		hasRuleDefined,
	};
}
