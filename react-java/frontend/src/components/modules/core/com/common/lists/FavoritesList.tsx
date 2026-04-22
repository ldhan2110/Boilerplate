import { StarFilled } from '@ant-design/icons';
import { Button, Dropdown, Empty, Flex, theme } from 'antd';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { useAppTranslate } from '@hooks';
import appStore from '@stores/AppStore';
import { useFavoritesStore } from '@stores/modules/sys';
import { ROUTES } from '@utils/routes';

export const FavoritesList: React.FC = observer(() => {
	const { t } = useAppTranslate();
	const { token } = theme.useToken();
	const favorites = useFavoritesStore((state) => state.favorites);
	const loading = useFavoritesStore((state) => state.loading);

	const handleFavoriteClick = (pgmCd: string) => {
		appStore.openTabByKey(pgmCd);
	};

	const favoriteItems = favorites.map((favorite) => {
		const route = ROUTES.find((r) => r.key === favorite.pgmCd);
		return {
			key: favorite.pgmCd,
			label: (
				<Flex align="center" gap={8} onClick={() => handleFavoriteClick(favorite.pgmCd)}>
					<StarFilled className="text-yellow-500" />
					<span>{route ? t(route.label) : favorite.pgmCd}</span>
				</Flex>
			),
		};
	});

	const menuItems =
		favoriteItems.length > 0
			? favoriteItems
			: [
					{
						key: 'empty',
						label: (
							<div style={{ padding: '16px', textAlign: 'center' }}>
								<Empty description={t('No favorites yet')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
							</div>
						),
						disabled: true,
					},
				];

	return (
		<Dropdown
			menu={{ items: menuItems }}
			trigger={['click']}
			placement="bottomRight"
			getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
			popupRender={(menu) => (
				<div
					style={{
						maxHeight: '400px',
						overflowY: 'auto',
					}}
				>
					{menu}
				</div>
			)}
		>
			<Button
				type="text"
				icon={<StarFilled style={{ color: token.colorWarning }} />}
				loading={loading}
				title={t('Favorites')}
			>
				{favorites.length > 0 && (
					<span className="ml-1" style={{ color: token.colorText }}>
						({favorites.length})
					</span>
				)}
			</Button>
		</Dropdown>
	);
});

