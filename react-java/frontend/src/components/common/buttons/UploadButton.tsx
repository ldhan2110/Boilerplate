import { Button, Upload, type ButtonProps, type UploadProps } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

import { useAppTranslate } from '@/hooks';

type UploadButtonProps = ButtonProps & UploadProps;

export const UploadButton = ({ title, ...props }: UploadButtonProps) => {
	const { t } = useAppTranslate();
	return (
		<Upload {...props}>
			<Button icon={<UploadOutlined />}>{t(title || 'Upload')}</Button>
		</Upload>
	);
};
