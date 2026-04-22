import { Button, type ButtonProps } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';

import { useAppTranslate } from '@/hooks';

export const PrintButton = ({ children, ...props }: ButtonProps) => {
	const { t } = useAppTranslate();
	return (
		<Button type="default" icon={<PrinterOutlined />} {...props}>
			{t(children as string)}
		</Button>
	);
};
