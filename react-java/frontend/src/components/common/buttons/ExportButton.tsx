import { Button, type ButtonProps } from 'antd';

import { useAppTranslate } from '@/hooks';
import { ExportOutlined } from '@ant-design/icons';

export const ExportButton = ({ children, ...props }: ButtonProps) => {
	const { t } = useAppTranslate();

	return (
		<Button icon={<ExportOutlined />} {...props}>
			{children ?? t('Export')}
		</Button>
	);
};
