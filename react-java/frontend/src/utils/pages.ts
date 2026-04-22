import React from 'react';

export const DefaultPage = React.lazy(() => import('@/pages/app/DefaultPage'));

// COM
export const COM_10001_PAGE = React.lazy(() => import('@/pages/app/core/com/COM_10001'));
export const COM_10002_PAGE = React.lazy(() => import('@/pages/app/core/com/COM_10002'));

// ADM
export const ADM_10001_PAGE = React.lazy(() => import('@/pages/app/core/adm/ADM_10001'));
export const ADM_10002_PAGE = React.lazy(() => import('@/pages/app/core/adm/ADM_10002'));

// SYS
export const SYS_BAT_0001_PAGE = React.lazy(() => import('@/pages/app/core/sys/SYS_BAT_0001'));
export const SYS_EML_0001_PAGE = React.lazy(() => import('@/pages/app/core/sys/SYS_EML_0001'));
export const SYS_MSG_0001_PAGE = React.lazy(() => import('@/pages/app/core/sys/SYS_MSG_0001'));
