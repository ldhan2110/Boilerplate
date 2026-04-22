import { type ReactNode } from 'react';
import {
	ADM_ROUTE_KEYS,
	ADM_ROUTES,
	ADM_ICON_ROUTES,
	SYS_ROUTE_KEYS,
	SYS_ROUTES,
	SYS_ICON_ROUTES,
	COM_ROUTE_KEYS,
	COM_ROUTES,
	COM_ICON_ROUTES,
} from './core';
import { DefaultPage } from './pages';
import { HomeOutlined } from '@ant-design/icons';
import HomePage from '@/pages/HomePage';

/**
 * Route Keys Configuration
 */
export const ROUTE_KEYS = {
	MAIN: 'MAIN',
	ASSISTANT: 'ASSISTANT',
	ADMIN: ADM_ROUTE_KEYS,
	SYS: SYS_ROUTE_KEYS,
	COM: COM_ROUTE_KEYS,
};

/**
 * Routes Configuration for UI Registration
 */
export const ROUTES = [
	{
		key: 'DEFAULT',
		label: 'Default',
		content: <DefaultPage />,
	},
	{
		key: ROUTE_KEYS.MAIN,
		label: 'Main',
		content: <HomePage />,
	},
	...ADM_ROUTES,
	...SYS_ROUTES,
	...COM_ROUTES,
];

/**
 * Icon Routes Configuration
 */
export const ICON_ROUTES: { [key: string]: ReactNode } = {
	MAIN: <HomeOutlined />,
	...ADM_ICON_ROUTES,
	...SYS_ICON_ROUTES,
	...COM_ICON_ROUTES,
};
