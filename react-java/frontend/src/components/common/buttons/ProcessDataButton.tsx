import { Button, type ButtonProps } from 'antd';

import { useAppTranslate } from '@/hooks';

export type ProcessDataButtonProps = ButtonProps & {
	label?: string;
};

/**
 * Shared "Process Data" toolbar action. Override `icon` or `type` for screen-specific styling.
 */
export const ProcessDataButton = ({
	children,
	label,
	icon,
	...props
}: ProcessDataButtonProps) => {
	const { t } = useAppTranslate();

	return (
		<Button icon={icon} {...props}>
			{children ?? label ?? t('Process Data')}
		</Button>
	);
};
