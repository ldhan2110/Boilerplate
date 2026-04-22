import React from 'react';
import { Flex, Typography } from 'antd';
import styled from 'styled-components';
import { useAppTranslate } from '@/hooks';

const { Text, Link } = Typography;

type SelectionBannerProps = {
	/** Cross-page selection is active */
	isAllSelected: boolean;
	/** Total matching results */
	totalCount: number;
	/** Current effective selected count */
	effectiveCount: number;
	/** Whether there is any cross-page selection (select-all or individual picks) */
	hasSelection: boolean;
	/** Click "Clear selection" */
	onClear: () => void;
};

const SelectionBanner: React.FC<SelectionBannerProps> = React.memo(
	({
		isAllSelected,
		totalCount,
		effectiveCount,
		hasSelection,
		onClear,
	}) => {
		const { t } = useAppTranslate();

		if (isAllSelected) {
			return (
				<BannerWrapper>
					<Flex align="center" justify="center" gap={4}>
						<Text>
							{effectiveCount === totalCount
								? t('{{count}} selected across all pages').replace(
										'{{count}}',
										String(effectiveCount),
									)
								: t('{{effective}} of {{total}} selected across all pages')
										.replace('{{effective}}', String(effectiveCount))
										.replace('{{total}}', String(totalCount))}
						</Text>
						<Link onClick={onClear}>{t('Clear selection')}</Link>
					</Flex>
				</BannerWrapper>
			);
		}

		if (hasSelection) {
			return (
				<BannerWrapper>
					<Flex align="center" justify="center" gap={4}>
						<Text>
							{t('{{count}} selected across pages').replace(
								'{{count}}',
								String(effectiveCount),
							)}
						</Text>
						<Link onClick={onClear}>{t('Clear selection')}</Link>
					</Flex>
				</BannerWrapper>
			);
		}

		return null;
	},
);

SelectionBanner.displayName = 'SelectionBanner';

const BannerWrapper = styled.div`
	background: var(--ant-color-info-bg);
	border: 1px solid var(--ant-color-info-border);
	border-bottom: none;
	padding: 6px 16px;
	text-align: center;
	font-size: 13px;
`;

export { SelectionBanner };
export type { SelectionBannerProps };
