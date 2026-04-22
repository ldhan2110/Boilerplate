import { type ReactNode } from 'react';
import { AppstoreOutlined } from '@ant-design/icons';
import { SYS_BAT_0001_PAGE, SYS_EML_0001_PAGE, SYS_MSG_0001_PAGE } from '../pages';

/**
 * SYS Module Route Keys
 */
export const SYS_ROUTE_KEYS = {
	MESSAGE_MANAGEMENT: 'SYS_MSG_0001',
	BATCH_JOB_MANAGEMENT: 'SYS_BAT_0001',
	EMAIL_MANAGEMENT: 'SYS_EML_0001',
};

/**
 * SYS Module Routes
 */
export const SYS_ROUTES = [
	{
		key: SYS_ROUTE_KEYS.MESSAGE_MANAGEMENT,
		label: 'Message Management',
		content: <SYS_MSG_0001_PAGE />,
	},
	{
		key: SYS_ROUTE_KEYS.BATCH_JOB_MANAGEMENT,
		label: 'Batch Job Management',
		content: <SYS_BAT_0001_PAGE />,
	},
	{
		key: SYS_ROUTE_KEYS.EMAIL_MANAGEMENT,
		label: 'Email Management',
		content: <SYS_EML_0001_PAGE />,
	},
];

/**
 * SYS Module Route Icons
 */
export const SYS_ICON_ROUTES: { [key: string]: ReactNode } = {
	SYS: <AppstoreOutlined />,
};

