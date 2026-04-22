import { useAppTranslate } from '@/hooks';
import { Button, type ButtonProps } from 'antd';

export const CancelButton = ({ children, ...props }: ButtonProps) => {
	const { t } = useAppTranslate();
	return <Button {...props}>{t(children as string)}</Button>;
};
