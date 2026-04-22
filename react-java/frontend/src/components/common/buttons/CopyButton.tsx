import { Button, type ButtonProps } from 'antd';
import { useAppTranslate } from '@/hooks';
import { CopyOutlined } from '@ant-design/icons';

export const CopyButton = ({ ...props }: ButtonProps) => {
	const { t } = useAppTranslate();
	return (
		<Button icon={<CopyOutlined />} {...props}>
			{t('Make a Copy')}
		</Button>
	);
};
