import { Button, type ButtonProps } from 'antd';
import { ImportOutlined } from '@ant-design/icons';

import { useAppTranslate } from '@/hooks';

export const ImportButton = ({ children, ...props }: ButtonProps) => {
	const { t } = useAppTranslate();
	return (
		<Button type="default" icon={<ImportOutlined />} {...props}>
			{t(children as string)}
		</Button>
	);
};
