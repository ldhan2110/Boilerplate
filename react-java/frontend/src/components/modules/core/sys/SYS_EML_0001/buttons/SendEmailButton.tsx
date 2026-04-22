import { useState } from 'react';
import { Button } from 'antd';
import { MailOutlined } from '@ant-design/icons';

import { useAppTranslate } from '@/hooks';
import { SendEmailModal } from '../modals';

export const SendEmailButton: React.FC = () => {
	const { t } = useAppTranslate();
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button type="primary" icon={<MailOutlined />} onClick={() => setOpen(true)}>
				{t('New Email')}
			</Button>
			<SendEmailModal open={open} onClose={() => setOpen(false)} />
		</>
	);
};
