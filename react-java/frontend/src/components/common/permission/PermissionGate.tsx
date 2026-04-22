import React from 'react';
import { Button, Result, Spin } from 'antd';
import { isFunction } from 'lodash';

import type { ABILITY_ACTION, ABILITY_SUBJECT_TYPE } from '@/constants';
import { useAppTranslate, usePermission } from '@/hooks';
import appStore from '@/stores/AppStore';

type PermissionAbilityType = {
	ability: ABILITY_ACTION;
	entity: ABILITY_SUBJECT_TYPE;
	fields?: string;
};

type PermissionGateProps = {
	children: React.ReactNode | ((allowed: boolean, abilityResult: boolean[]) => React.ReactNode);
	permissions?: PermissionAbilityType[];
	variant?: 'default' | 'hidden' | 'disabled';
};

export const PermissionGate = ({ children, permissions, variant }: PermissionGateProps) => {
	const { hasAbility, hasRuleDefined } = usePermission();

	function renderChildren() {
		if (!hasRuleDefined()) {
			return <Spin className="flex h-full w-full items-center justify-center" size="large" />;
		}
		if (!permissions) return <>{children}</>;

		const hasGranted = permissions.some((permission) =>
			hasAbility(permission.ability, permission.entity),
		);
		const grantedResult = permissions.map((permission) =>
			hasAbility(permission.ability, permission.entity),
		);

		if (!hasGranted)
			switch (variant) {
				case 'hidden':
					return <></>;
				case 'disabled':
					if (React.isValidElement(children)) {
						// safely clone element and add "disabled"
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						return React.cloneElement(children as React.ReactElement<any>, {
							disabled: true,
						});
					}
					return children;
				default:
					return <Unauthorization />;
			}
		return <> {isFunction(children) ? children(true, grantedResult) : children}</>;
	}
	return <> {renderChildren()}</>;
};

const Unauthorization = () => {
	const { t } = useAppTranslate();

	function redirectHome() {
		appStore.redirectHome();
	}

	return (
		<Result
			status="403"
			title={t('Forbidden')}
			subTitle={t('Sorry, you are not authorized to access this page.')}
			extra={
				<Button type="primary" onClick={redirectHome}>
					Back Home
				</Button>
			}
		/>
	);
};
