import { Button, type ButtonProps } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

import { useAppTranslate } from '@/hooks';

export const DownloadTemplateButton = ({ children, ...props }: ButtonProps) => {
	const { t } = useAppTranslate();
	return (
		<Button type="default" icon={<DownloadOutlined />} {...props}>
			{t(children as string)}
		</Button>
	);
};
