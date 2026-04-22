import { useState } from 'react';
import { Button, Empty, List, Tooltip, Typography } from 'antd';
import { CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import styled from 'styled-components';

import { useAppTranslate } from '@hooks';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationItem {
	id: string;
	title: string;
	message: string;
	type: NotificationType;
	time: string;
	read: boolean;
	avatar?: string;
}

// Sample notification data
export const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
	{
		id: '1',
		title: 'New Order Received',
		message: 'Order #12345 has been placed successfully.',
		type: 'success',
		time: '2 minutes ago',
		read: false,
	},
	{
		id: '2',
		title: 'System Update',
		message: 'System maintenance scheduled for tonight at 11 PM.',
		type: 'warning',
		time: '15 minutes ago',
		read: false,
	},
	{
		id: '3',
		title: 'Payment Failed',
		message: 'Payment for invoice #INV-2024-001 has failed.',
		type: 'error',
		time: '1 hour ago',
		read: false,
	},
	{
		id: '4',
		title: 'New User Registered',
		message: 'John Doe has registered a new account.',
		type: 'info',
		time: '2 hours ago',
		read: true,
	},
	{
		id: '5',
		title: 'Report Generated',
		message: 'Monthly sales report is ready for download.',
		type: 'success',
		time: '3 hours ago',
		read: true,
	},
	{
		id: '6',
		title: 'Low Stock Alert',
		message: 'Product SKU-001 is running low on stock.',
		type: 'warning',
		time: '5 hours ago',
		read: true,
	},
];

const getTypeColor = (type: NotificationType) => {
	switch (type) {
		case 'success':
			return '#52c41a';
		case 'warning':
			return '#faad14';
		case 'error':
			return '#ff4d4f';
		default:
			return '#1890ff';
	}
};

const getTypeIcon = (type: NotificationType) => {
	switch (type) {
		case 'success':
			return '✓';
		case 'warning':
			return '⚠';
		case 'error':
			return '✕';
		default:
			return 'ℹ';
	}
};

interface NotificationListProps {
	notifications: NotificationItem[];
	unreadCount: number;
	onMarkAsRead: (id: string) => void;
	onMarkAllAsRead: () => void;
	onDelete: (id: string) => void;
	onClearAll: () => void;
}

type TabKey = 'all' | 'unread' | 'read';

export const NotificationList = ({
	notifications,
	unreadCount,
	onMarkAsRead,
	onMarkAllAsRead,
	onDelete,
	onClearAll,
}: NotificationListProps) => {
	const { t } = useAppTranslate();
	const [activeTab, setActiveTab] = useState<TabKey>('all');

	const unreadNotifications = notifications.filter((n) => !n.read);
	const readNotifications = notifications.filter((n) => n.read);

	const getFilteredNotifications = () => {
		switch (activeTab) {
			case 'unread':
				return unreadNotifications;
			case 'read':
				return readNotifications;
			default:
				return notifications;
		}
	};

	const getEmptyMessage = () => {
		switch (activeTab) {
			case 'unread':
				return t('No unread notifications');
			case 'read':
				return t('No read notifications');
			default:
				return t('No notifications');
		}
	};

	const filteredNotifications = getFilteredNotifications();

	const renderNotificationItem = (item: NotificationItem) => (
		<NotificationItemWrapper key={item.id} $read={item.read}>
			<NotificationIcon $color={getTypeColor(item.type)}>
				{getTypeIcon(item.type)}
			</NotificationIcon>
			<NotificationContent>
				<NotificationTitle $read={item.read}>{item.title}</NotificationTitle>
				<NotificationMessage>{item.message}</NotificationMessage>
				<NotificationTime>{item.time}</NotificationTime>
			</NotificationContent>
			<NotificationActions>
				{!item.read && (
					<Tooltip title={t('Mark as read')}>
						<ActionButton onClick={() => onMarkAsRead(item.id)}>
							<CheckOutlined />
						</ActionButton>
					</Tooltip>
				)}
				<Tooltip title={t('Delete')}>
					<ActionButton onClick={() => onDelete(item.id)} $danger>
						<DeleteOutlined />
					</ActionButton>
				</Tooltip>
			</NotificationActions>
		</NotificationItemWrapper>
	);

	const tabs: { key: TabKey; label: string; count: number }[] = [
		{ key: 'all', label: t('All'), count: notifications.length },
		{ key: 'unread', label: t('Unread'), count: unreadNotifications.length },
		{ key: 'read', label: t('Read'), count: readNotifications.length },
	];

	return (
		<NotificationContainer>
			<NotificationHeader>
				<Typography.Title level={5} style={{ margin: 0, fontWeight: 600 }}>
					{t('Notifications')}
				</Typography.Title>
				{unreadCount > 0 && (
					<MarkAllButton type="link" onClick={onMarkAllAsRead}>
						{t('Mark all as read')}
					</MarkAllButton>
				)}
			</NotificationHeader>

			<TabContainer>
				{tabs.map((tab) => (
					<TabItem
						key={tab.key}
						$active={activeTab === tab.key}
						onClick={() => setActiveTab(tab.key)}
					>
						<TabLabel $active={activeTab === tab.key}>{tab.label}</TabLabel>
						<TabBadge $active={activeTab === tab.key} $hasItems={tab.count > 0}>
							{tab.count}
						</TabBadge>
					</TabItem>
				))}
				<TabIndicator $activeIndex={tabs.findIndex((t) => t.key === activeTab)} />
			</TabContainer>

			<NotificationListWrapper>
				{filteredNotifications.length > 0 ? (
					<List
						dataSource={filteredNotifications}
						renderItem={renderNotificationItem}
						split={false}
					/>
				) : (
					<EmptyWrapper>
						<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={getEmptyMessage()} />
					</EmptyWrapper>
				)}
			</NotificationListWrapper>

			{notifications.length > 0 && (
				<NotificationFooter>
					<Button type="link" danger onClick={onClearAll} size="small" icon={<DeleteOutlined />}>
						{t('Clear all notifications')}
					</Button>
				</NotificationFooter>
			)}
		</NotificationContainer>
	);
};



// Styled Components
const NotificationContainer = styled.div`
	width: 400px;
	max-height: 520px;
	display: flex;
	flex-direction: column;
	background: #fff;
	border-radius: 12px;
	overflow: hidden;
`;

const NotificationHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px 20px 12px;
	background: linear-gradient(135deg, var(--ant-color-primary) 0%, var(--ant-color-primary-active) 100%);

	h5.ant-typography {
		color: #fff !important;
	}
`;

const MarkAllButton = styled(Button)`
	font-size: 12px;
	padding: 0;
	height: auto;
	color:rgba(235, 235, 235, 0.91) !important;

	&:hover {
		color: #fff !important;
	}
`;

const TabContainer = styled.div`
	display: flex;
	position: relative;
	padding: 0 8px;
	background: var(--ant-color-bg-container);
	border-bottom: 1px solid var(--ant-color-border);
`;

const TabItem = styled.div<{ $active: boolean }>`
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 14px 12px;
	cursor: pointer;
	transition: all 0.3s ease;
	position: relative;
	z-index: 1;

	&:hover {
		background: rgba(102, 126, 234, 0.05);
	}
`;

const TabLabel = styled.span<{ $active: boolean }>`
	font-size: 13px;
	font-weight: ${(props) => (props.$active ? 600 : 400)};
	color: ${(props) => (props.$active ? 'var(--ant-color-primary-active)' : 'var(--ant-color-text-secondary)')};
	transition: all 0.3s ease;
`;

const TabBadge = styled.span<{ $active: boolean; $hasItems: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 20px;
	height: 20px;
	padding: 0 6px;
	font-size: 11px;
	font-weight: 600;
	border-radius: 10px;
	background: ${(props) =>
		props.$active
			? 'linear-gradient(135deg, var(--ant-color-primary) 0%, var(--ant-color-primary-active) 100%)'
			: props.$hasItems
				? '#e6e6e6'
				: '#f5f5f5'};
	color: ${(props) => (props.$active ? '#fff' : props.$hasItems ? '#595959' : '#bfbfbf')};
	transition: all 0.3s ease;
`;

const TabIndicator = styled.div<{ $activeIndex: number }>`
	position: absolute;
	bottom: 0;
	left: ${(props) => `calc(${props.$activeIndex * 33.33}% + 8px)`};
	width: calc(33.33% - 16px);
	height: 3px;
	background: linear-gradient(135deg, var(--ant-color-primary) 0%, var(--ant-color-primary-active) 100%);
	border-radius: 3px 3px 0 0;
	transition: left 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
`;

const NotificationListWrapper = styled.div`
	flex: 1;
	max-height: 340px;
	overflow-y: auto;

	&::-webkit-scrollbar {
		width: 6px;
	}

	&::-webkit-scrollbar-thumb {
		background: linear-gradient(135deg, var(--ant-color-primary) 0%, var(--ant-color-primary-active) 100%);
		border-radius: 3px;
	}

	&::-webkit-scrollbar-track {
		background-color: var(--ant-color-fill-secondary);
	}
`;

const EmptyWrapper = styled.div`
	padding: 40px 20px;
	background: var(--ant-color-bg-container);
`;

const NotificationItemWrapper = styled.div<{ $read: boolean }>`
	display: flex;
	gap: 12px;
	padding: 14px 20px;
	background-color: ${(props) => (props.$read ? 'var(--ant-color-bg-layout)' : 'var(--ant-color-bg-container)')};
	border-bottom: 1px solid var(--ant-color-border);
	transition: all 0.2s ease;

	&:hover {
		background-color:  ${(props) => (props.$read ? 'var(--ant-color-bg-layout)' : 'var(--ant-color-bg-elevated)')};
	}

	&:last-child {
		border-bottom: none;
	}
`;

const NotificationIcon = styled.div<{ $color: string }>`
	width: 40px;
	height: 40px;
	border-radius: 12px;
	background-color: ${(props) => props.$color}15;
	color: ${(props) => props.$color};
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	font-weight: bold;
	flex-shrink: 0;
`;

const NotificationContent = styled.div`
	flex: 1;
	min-width: 0;
`;

const NotificationTitle = styled.div<{ $read: boolean }>`
	font-weight: ${(props) => (props.$read ? 400 : 600)};
	font-size: 13px;
	color: var(--ant-color-text-primary);
	margin-bottom: 4px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const NotificationMessage = styled.div`
	font-size: 12px;
	color: var(--ant-color-text-secondary);
	line-height: 1.5;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
`;

const NotificationTime = styled.div`
	font-size: 11px;
	color: var(--ant-color-text-secondary);
	margin-top: 6px;
`;

const NotificationActions = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	opacity: 0;
	transition: opacity 0.2s ease;

	${NotificationItemWrapper}:hover & {
		opacity: 1;
	}
`;

const ActionButton = styled.button<{ $danger?: boolean }>`
	width: 28px;
	height: 28px;
	border: none;
	background-color: transparent;
	border-radius: 8px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${(props) => (props.$danger ? '#ff4d4f' : '#595959')};
	transition: all 0.2s ease;

	&:hover {
		background-color: ${(props) => (props.$danger ? 'rgb(255, 241, 240, 0.2)' : 'rgba(102, 126, 234, 0.1)')};
		color: ${(props) => (props.$danger ? '#ff4d4f' : '#667eea')};
	}
`;

const NotificationFooter = styled.div`
	padding: 10px 20px;
	border-top: 1px solid var(--ant-color-border);
	text-align: center;
	background: var(--ant-color-bg-container);
`;

