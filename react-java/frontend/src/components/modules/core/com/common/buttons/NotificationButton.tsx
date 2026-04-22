import { BellOutlined } from '@ant-design/icons';
import { Badge, Button, Popover, Tooltip } from 'antd';
import { useState } from 'react';
import { useAppTranslate } from '@hooks';
import { NotificationList, SAMPLE_NOTIFICATIONS, type NotificationItem } from '../lists';

export const NotificationButton = () => {
	const { t } = useAppTranslate();
	const [notifications, setNotifications] = useState<NotificationItem[]>(SAMPLE_NOTIFICATIONS);
	const [open, setOpen] = useState(false);

	const unreadCount = notifications.filter((n) => !n.read).length;

	const handleMarkAsRead = (id: string) => {
		setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
	};

	const handleMarkAllAsRead = () => {
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
	};

	const handleDelete = (id: string) => {
		setNotifications((prev) => prev.filter((n) => n.id !== id));
	};

	const handleClearAll = () => {
		setNotifications([]);
	};

	return (
		<Popover
			content={
				<NotificationList
					notifications={notifications}
					unreadCount={unreadCount}
					onMarkAsRead={handleMarkAsRead}
					onMarkAllAsRead={handleMarkAllAsRead}
					onDelete={handleDelete}
					onClearAll={handleClearAll}
				/>
			}
			trigger="click"
			open={open}
			onOpenChange={setOpen}
			placement="bottomRight"
			arrow={false}
			styles={{ body: { padding: 0, borderRadius: 12, overflow: 'hidden' } }}
		>
			<Tooltip title={t('Notifications')}>
				<Badge count={unreadCount} size="small" offset={[-2, 2]}>
					<Button shape="circle" icon={<BellOutlined />} style={{ height: 32 }} />
				</Badge>
			</Tooltip>
		</Popover>
	);
};
