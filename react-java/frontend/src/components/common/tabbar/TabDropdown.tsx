import type { HTMLAttributes, ReactElement } from 'react';
import { Dropdown } from 'antd';

import { TAB_ACTIONS } from '@/constants';
import { useAppTranslate } from '@/hooks';
import { useFavoritesStore } from '@/stores';

type TabDropdownProps = {
	tabKey: string;
	node: ReactElement;
	handleItemClick: ({ key }: { key: string }) => void;
	onOpenCallback: () => void;
	dragProps?: HTMLAttributes<HTMLDivElement>;
};

export const TabDropdown = ({
	tabKey,
	node,
	handleItemClick,
	onOpenCallback,
	dragProps,
}: TabDropdownProps) => {
	const { t } = useAppTranslate();
	const isFavorite = useFavoritesStore((state) => state.isFavorite(tabKey));

	return (
		<Dropdown
			key={tabKey}
			menu={{
				items: [
					{ key: TAB_ACTIONS.REFRESH, label: t('Refresh') },
					{
						type: 'divider' as const,
					},
					{
						key: isFavorite ? TAB_ACTIONS.REMOVE_FAVORITE : TAB_ACTIONS.ADD_FAVORITE,
						label: isFavorite ? t('Remove from Favorites') : t('Add to Favorites'),
					},
					{
						type: 'divider' as const,
					},
					{ key: TAB_ACTIONS.CLOSE, label: t('Close') },
					{ key: TAB_ACTIONS.CLOSE_OTHER, label: t('Close others') },
				],
				onClick: handleItemClick,
			}}
			trigger={['contextMenu']}
			onOpenChange={onOpenCallback}
		>
			<div {...dragProps}>{node}</div>
		</Dropdown>
	);
};
