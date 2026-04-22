import type { ReactElement } from 'react';
import { theme } from 'antd';

import { useAppTranslate } from '@/hooks';

type FormFieldsetProps = {
	title: string;
	children?: ReactElement;
};

export const FormFieldset = ({ title, children }: FormFieldsetProps) => {
	const { t } = useAppTranslate();
	const { token } = theme.useToken();
	return (
		<fieldset
			style={{ border: `1px solid ${token.colorBorderSecondary}`, padding: '4px 16px 16px', borderRadius: '4px' }}
		>
			<legend
				style={{
					padding: '0 8px',
					marginLeft: '8px',
					width: 'fit-content',
					border: 'none',
					marginBottom: 0,
					fontSize: '12px',
				}}
			>
				{t(title)}
			</legend>
			<>{children}</>
		</fieldset>
	);
};
