import { Suspense } from 'react';
import { ConfigProvider, Skeleton, theme } from 'antd';

import { Header, MainScreen } from '@components/common';
import SidebarMenu from '@components/common/sidebar/SidebarMenu';
import appStore from '@/stores/AppStore';

export const App = () => {
	const { darkMode } = appStore.state;
	const { token } = theme.useToken();

	return (
		<div className="h-screen" style={{ backgroundColor: darkMode ? token.colorBgLayout : 'transparent' }}>
			<SidebarMenu  />
			<Header />
			<Suspense fallback={<Skeleton active />}>
				<ConfigProvider componentSize="small">
					<MainScreen />
				</ConfigProvider>
			</Suspense>
		</div>
	);
};
