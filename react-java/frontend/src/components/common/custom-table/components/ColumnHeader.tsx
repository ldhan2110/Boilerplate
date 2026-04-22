import { type ReactNode } from 'react';
import type { ColumnTitle } from 'antd/es/table/interface';
import { useAppTranslate } from '@/hooks';
import { observer } from 'mobx-react-lite';

interface ColumnHeaderProps<T> {
	title: ColumnTitle<T>;
	required?: boolean;
}

export const ColumnHeader = observer(<T,>({ title, required = false }: ColumnHeaderProps<T>) => {
	const { t } = useAppTranslate();
	const translatedTitle = typeof title === 'string' ? t(title) : title;
	
	if (required) {
		return (
			<span>
				{translatedTitle as ReactNode} <span style={{ color: 'red' }}>*</span>
			</span>
		);
	}
	return translatedTitle as ReactNode;
});

export default ColumnHeader;
