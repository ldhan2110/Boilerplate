import React, { useMemo, useState } from 'react';
import { Avatar, Button, Divider, Dropdown, Flex, Grid, theme } from 'antd';
import { LogoutOutlined, MenuOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react-lite';

import { useAppTranslate, useFavorites } from '@hooks';
import { useGetUserInfo } from '@/hooks/modules';
import { authStore } from '@stores/AuthStore';
import { authService } from '@/services/auth/authJwtService';
import { ImageViewer } from '@/components/common/input';
import { CacheClearButton, DebugButton, ExportHistoryButton, MessageHistoryButton, NotificationButton } from './buttons';
import { FavoritesList } from './lists';
import { SettingModal } from './modals/setting-modals';
import { UserProfileModal } from './modals';
import ProgramSearchAutoComplete from './ProgramSearchAutoComplete';
import appStore from '@/stores/AppStore';

const Header: React.FC = observer(() => {
	const { t } = useAppTranslate();
	const [settingModalVisible, setSettingModalVisible] = useState(false);
	const [profileModalVisible, setProfileModalVisible] = useState(false);
	const { token } = theme.useToken();
	const breakpoint = Grid.useBreakpoint();
	const isPhone = !breakpoint.sm;
	
	// Load favorites on mount
	useFavorites();

	// Get current user ID and company ID
	const currentUserId = authStore.user?.userInfo?.usrId;
	const currentCompanyId = authService.getCurrentCompany();

	// Fetch user info to get avatar
	const { data: userInfo } = useGetUserInfo({
		usrId: currentUserId || '',
		coId: currentCompanyId || '',
	});

	// Check if the URL has the mode=DEBUG parameter
	const isDebugMode = () => {
		return new URLSearchParams(window.location.search).get('mode') === 'debug';
	};

	let rawSub = authStore.user?.sub;

	// Try reading from localStorage if store is empty
	if (!rawSub) {
		rawSub = localStorage.getItem('userSub') || 'Unknown User';
	} else {
		// Store it for later use
		localStorage.setItem('userSub', rawSub);
	}
	const userId = rawSub.includes('::') ? rawSub.split('::')[1] : rawSub;
	const avatarLetter = userId.charAt(0).toUpperCase();
	const userName = authStore.user?.userInfo?.usrNm;

	// Random background color using useMemo so it doesn't change every render
	const randomBgColor = useMemo(() => {
		const randomColor = () =>
			'#' +
			Math.floor(Math.random() * 16777215)
				.toString(16)
				.padStart(6, '0');
		return randomColor();
	}, []);

	const onMenuClick = ({ key }: { key: string }) => {
		if (key === 'profile') return setProfileModalVisible(true);
		if (key === 'settings') return setSettingModalVisible(true);
		if (key === 'logout') return authStore.logout();
	};

	const userMenuItems = [
		{ key: 'profile', icon: <UserOutlined />, label: t('Profile') },
		{ key: 'settings', icon: <SettingOutlined />, label: t('Setting') },
		{ type: 'divider' as const },
		{
			key: 'logout',
			icon: <LogoutOutlined />,
			label: t('Logout'),
			danger: true,
		},
	];

	return (
		<>
			<div className="shadow-md h-16 px-4 flex items-center justify-between" style={{ backgroundColor: token.colorBgContainer }}>
				<Flex gap={8} style={{ alignItems: 'center' }}>
					{isPhone && (
						<Button
							type="text"
							icon={<MenuOutlined />}
							onClick={() => appStore.setSidebarVisible(!appStore.state.sidebarVisible)}
							style={{ fontSize: '18px' }}
						/>
					)}
					{!isPhone && <ProgramSearchAutoComplete />}
				</Flex>
				<Flex justify="end" gap={4}>
					<Flex gap={8} style={{ alignItems: 'center' }}>
						{/* Debug Icon cho mobile - chỉ hiển thị khi có param mode=DEBUG */}
						{isDebugMode() && <DebugButton />}
						<FavoritesList />
						{!isPhone && <ExportHistoryButton />}
						{!isPhone && <MessageHistoryButton />}
						{!isPhone && <CacheClearButton />}
						{!isPhone && <NotificationButton />}
					</Flex>
					<Flex justify="center" align="center" gap={2}>
						<Divider type="vertical" size="middle" />
					</Flex>
					<Dropdown
						menu={{ items: userMenuItems, onClick: onMenuClick }}
						trigger={['click']}
						placement="bottomRight"
						getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
					>
						<div
							className="flex items-center text-gray-700 cursor-pointer select-none self-center"
							tabIndex={0}
						>
							{userInfo?.usrFileDto?.fileId || userInfo?.usrFileId ? (
								<ImageViewer
									fileId={userInfo?.usrFileDto?.fileId ?? userInfo?.usrFileId}
									fileCoId={userInfo?.usrFileDto?.coId ?? (currentCompanyId || undefined)}
									width={32}
									height={32}
									showUpload={false}
									showReset={false}
									showView={false}
									showZoomControls={false}
									style={{
										borderRadius: '50%',
										overflow: 'hidden',
									}}
								/>
							) : (
								<Avatar style={{ backgroundColor: randomBgColor, cursor: 'pointer' }}>
									{avatarLetter}
								</Avatar>
							)}
							<span className="ml-2" style={{ color: token.colorText }}>
								{t('Hi')}, <span className="font-bold" >{userName}</span>
							</span>
						</div>
					</Dropdown>
				</Flex>
			</div>

			<SettingModal
				isOpen={settingModalVisible}
				handleClose={() => {
					setSettingModalVisible(false);
				}}
			/>

			<UserProfileModal
				open={profileModalVisible}
				onClose={() => {
					setProfileModalVisible(false);
				}}
			/>
		</>
	);
});

export default Header;
