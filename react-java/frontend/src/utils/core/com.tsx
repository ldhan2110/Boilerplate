import { type ReactNode } from 'react';
import { SettingOutlined } from '@ant-design/icons';
import {
	COM_10001_PAGE,
	COM_10002_PAGE,
} from '../pages';

/**
 * ADM Module Route Keys
 */
export const COM_ROUTE_KEYS = {
	COMMON_CODE_MANAGEMENT: 'COM_10001',
	REPORT_MANAGEMENT: 'COM_10002',
};

/**
 * ADM Module Routes
 */
export const COM_ROUTES = [
	{
		key: COM_ROUTE_KEYS.COMMON_CODE_MANAGEMENT,
		label: 'Common Code Management',
		content: <COM_10001_PAGE />,
	},
	{
		key: COM_ROUTE_KEYS.REPORT_MANAGEMENT,
		label: 'Report Management',
		content: <COM_10002_PAGE />,
	},
];

/**
 * ADM Module Route Icons
 */
export const COM_ICON_ROUTES: { [key: string]: ReactNode } = {
	COM: <SettingOutlined />,
};
