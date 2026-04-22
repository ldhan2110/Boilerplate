import { Button, type ButtonProps } from 'antd';
import { EditOutlined} from '@ant-design/icons';
import { useAppTranslate } from '@/hooks';

type BatchUpdateButtonProps = ButtonProps & {
	label?: string;
};

export const BatchUpdateButton: React.FC<BatchUpdateButtonProps> = ({
	children,
	label,
	icon,
	...props
}) => {
	const { t } = useAppTranslate();

	return (
		<Button type="default" icon={icon ?? <EditOutlined />} {...props}>
			{children ?? label ?? t('Batch Update')}
		</Button>
	);
};
