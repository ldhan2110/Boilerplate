
import { TeamOutlined } from '@ant-design/icons';
import { type ReactNode } from 'react';
import { ADM_10001_PAGE, ADM_10002_PAGE } from '../pages';

/**
 * ADM Module Route Keys
 */
export const ADM_ROUTE_KEYS = {
	USER_MANAGEMENT: 'ADM_10001',
	ROLE_MANAGEMENT: 'ADM_10002',
};

/**
 * ADM Module Routes
 */
export const ADM_ROUTES = [
	{
		key: ADM_ROUTE_KEYS.USER_MANAGEMENT,
		label: 'User Management',
		content: <ADM_10001_PAGE />,
	},
	{
		key: ADM_ROUTE_KEYS.ROLE_MANAGEMENT,
		label: 'Role Management',
		content: <ADM_10002_PAGE />,
	}
];

/**
 * ADM Module Route Icons
 */
export const ADM_ICON_ROUTES: { [key: string]: ReactNode } = {
	ADM: <TeamOutlined />,
};
