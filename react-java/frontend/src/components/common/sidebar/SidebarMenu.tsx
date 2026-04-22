import React from 'react';
import { Button, Flex, Grid, Image, Menu, theme } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, StarFilled } from '@ant-design/icons';
import { observer } from 'mobx-react-lite';

import type { ProgramTree } from '@/types';
import { VIEW_PERMISSION_CODE } from '@/constants';
import { ICON_ROUTES, ROUTES } from '@utils/routes';
import { buildMenuProgramTree, cn } from '@/utils/helper';
import appStore from '@stores/AppStore';
import { authStore, useFavoritesStore } from '@/stores';
import { authService } from '@/services/auth/authJwtService';
import { useAppTranslate } from '@hooks';
import { useGetProgramList } from '@/hooks/modules';


const SideBarMenu: React.FC = observer(() => {
	const { openTab, state, setSidebarVisible: setCollapsed } = appStore;
	const { darkMode, sidebarVisible: collapsed } = state;
	const { t, changeLanguage } = useAppTranslate();
	const { token } = theme.useToken();
	const favorites = useFavoritesStore((state) => state.favorites);
	const breakpoint = Grid.useBreakpoint();
	const isPhone = !breakpoint.sm;

	// Load the current active menu tree
	const { data: programList } = useGetProgramList({
		coId: authService.getCurrentCompany()!,
		useFlg: 'Y',
	});

	// Set the language based on the app state
	React.useEffect(() => {
		changeLanguage(state.lang);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [state.lang]);

	const toggleCollapsed = () => {
		setCollapsed(!collapsed);
	};

	function filterProgramByRoleAuth(nodes: ProgramTree[]) {
		return nodes.filter((node) => {
			const roleAuthList = authStore.role?.roleAuthList || [];
			const isAllow = roleAuthList.findIndex(
				(item) => item.pgmId == node.pgmId && item.permCd == VIEW_PERMISSION_CODE,
			);
			if (isAllow != -1) return true;
			return false;
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function translateMenuItems(items: any[]): any[] {
		return items.map((item) => ({
			...item,
			label: t(item?.label),
			children: item.children ? translateMenuItems(item.children) : undefined,
		}));
	}

	function handleOpenMenu({ key }: { key: string }) {
		const selectedItem = ROUTES.find((item) => item.key === key);
		if (selectedItem) {
			openTab(selectedItem);
		}
	}

	// Build favorites menu items as children - always use star icon for favorites
	const favoritesChildren = favorites.map((favorite) => {
		const route = ROUTES.find((r) => r.key === favorite.pgmCd);
		return {
			key: favorite.pgmCd,
			label: route ? t(route.label) : favorite.pgmCd,
			icon: <StarFilled />,
		};
	});

	// Build main menu items
	const resolvedMainMenuItems = translateMenuItems(
		buildMenuProgramTree(
			filterProgramByRoleAuth(
				programList?.programList?.map((item) => ({
					...item,
					key: item.pgmCd!,
					label: item.pgmNm,
					icon: ICON_ROUTES[item.pgmCd!],
				})) || [],
			),
		),
	);

	// Keep last non-empty menu so sidebar doesn't flash empty when JWT expires
	// (programList or authStore.role can be briefly empty until refetch/refresh)
	const lastValidMainMenuRef = React.useRef<typeof resolvedMainMenuItems>([]);
	if (resolvedMainMenuItems.length > 0) {
		lastValidMainMenuRef.current = resolvedMainMenuItems;
	}
	const mainMenuItems =
		resolvedMainMenuItems.length > 0 ? resolvedMainMenuItems : lastValidMainMenuRef.current;

	// Build favorites menu item (collapsible) - always show, even if empty
	const favoritesMenu = {
		key: 'favorites',
		label: t('Favorites'),
		icon: <StarFilled />,
		children: favoritesChildren.length > 0 ? translateMenuItems(favoritesChildren) : undefined,
	};

	// Combine all menu items with divider before favorites
	const allMenuItems = [
		...mainMenuItems,
		favoritesMenu,
	];

	return (
		<div
			className={cn(
				`h-full`,
				`${isPhone ? 'fixed z-[99]' : ''}`,
				`${isPhone && collapsed && state.sidebarVisible ? 'hidden' : ''}`,
				`${collapsed ? 'w-[80px]' : 'w-64'}`,
				"shadow-lg transition-width duration-300 float-left"
			)}
			style={{ backgroundColor: token.colorBgContainer }}
		>
			<Flex
				align="center"
				justify={collapsed ? 'center' : 'none'}
				gap={16}
				style={{ padding: "16px 16px" }}
			>
				{!collapsed && (
					<Image
						height={40}
						width={"100%"}
						preview={false}
						style={{
							padding: "0 20%"
						}}
						src={darkMode ? "/images/logo_dark.png" : "/images/logo_light.png"}
					/>
				)}
				<Button size="middle" type="primary" onClick={toggleCollapsed}>
					{collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
				</Button>
			</Flex>
			<div className="overflow-y-auto h-[calc(100vh-74px)]">
				<Menu
					mode="inline"
					theme="light"
					selectedKeys={[state.selectedTab.key]}
					inlineCollapsed={collapsed}
					items={allMenuItems}
					onClick={handleOpenMenu}
				/>
			</div>
		</div >
	);
});

export default SideBarMenu;
