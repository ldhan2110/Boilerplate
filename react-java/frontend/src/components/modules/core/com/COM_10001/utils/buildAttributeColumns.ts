import React from 'react';
import { Tooltip } from 'antd';
import { EDIT_TYPE, type SubCodeDto, type SubTblCfg, type TableColumn } from '@/types';
import type { DefaultOptionType } from 'antd/es/select';

type TranslateFunction = (key: string) => string;
const MAX_ATTRIBUTE_COLUMNS = 20;
/**
 * Builds the attrCtnt1–20 columns for SubCodeTable based on subTblCfg config.
 * Falls back to default INPUT columns when no config is found for a given attribute.
 *
 * @param subTblCfg   - Config object keyed by attrCtntN from the selected master code.
 * @param t           - Translation function.
 * @param commonCodeOptions - Map of master code ID → select options (for string optionConfig).
 */
export function buildAttributeColumns(
	subTblCfg: SubTblCfg | null | undefined,
	t: TranslateFunction,
	commonCodeOptions: Record<string, DefaultOptionType[]>,
): TableColumn<SubCodeDto>[] {
	return Array.from({ length: MAX_ATTRIBUTE_COLUMNS }, (_, i): TableColumn<SubCodeDto> => {
		const attrKey = `attrCtnt${i + 1}`;
		const config = subTblCfg?.[attrKey];

		if (!config) {
			return {
				key: attrKey,
				title: t(`Attribute Content ${i + 1}`),
				dataIndex: attrKey as keyof SubCodeDto,
				width: 190,
				draggable: false,
				sorter: true,
				editType: EDIT_TYPE.INPUT,
				editProps: {
					placeholder: t(`Enter Value ${i + 1}`),
				},
			};
		}

		const isRequired = config.editProps?.required === true;

		const titleNode: React.ReactNode =
			config.headerTooltip && typeof config.headerTooltip === 'string'
				? React.createElement(
						'div',
						{
							style: {
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								width: '100%',
							},
						},
						React.createElement(
							'span',
							{ style: { flex: 1, minWidth: 0, paddingRight: 4 } },
							t(config.headerTitle),
						),
						React.createElement(
							Tooltip,
							{ title: t(config.headerTooltip) },
							React.createElement(
								'span',
								{
									style: {
										display: 'inline-flex',
										justifyContent: 'center',
										alignItems: 'center',
										width: 14,
										height: 14,
										borderRadius: '50%',
										border: '1px solid #d9d9d9',
										fontSize: 9,
										color: '#8c8c8c',
										backgroundColor: '#fafafa',
										cursor: 'pointer',
										lineHeight: 1,
									},
								},
								'?',
							),
						),
					)
				: t(config.headerTitle);

		const baseCol: TableColumn<SubCodeDto> = {
			key: attrKey,
			title: titleNode,
			dataIndex: attrKey as keyof SubCodeDto,
			width: 190,
			draggable: false,
			sorter: true,
		};

		switch (config.inputType) {
			case 'CHECKBOX': {
				const parts =
					typeof config.optionConfig === 'string' ? config.optionConfig.split(',') : ['Y', 'N'];
				const checked = parts[0]?.trim() ?? 'Y';
				const unchecked = parts[1]?.trim() ?? 'N';
				return {
					...baseCol,
					align: 'center' as const,
					editType: EDIT_TYPE.CHECKBOX,
					editProps: {
						required: isRequired,
						checkboxMapping: { checked, unchecked },
					},
				};
			}

			case 'SELECT': {
				const options = resolveSelectOptions(config.optionConfig, commonCodeOptions);
				return {
					...baseCol,
					editType: EDIT_TYPE.SELECT,
					editProps: {
						required: isRequired,
						options,
						placeholder: t(`Select ${config.headerTitle}`),
					},
				};
			}

			case 'INPUT_NUMBER': {
				return {
					...baseCol,
					editType: EDIT_TYPE.INPUT_NUMBER,
					editProps: {
						required: isRequired,
						placeholder: t(`Enter ${config.headerTitle}`),
					},
				};
			}

			case 'INPUT':
			default:
				return {
					...baseCol,
					editType: EDIT_TYPE.INPUT,
					editProps: {
						required: isRequired,
						placeholder: t(`Enter ${config.headerTitle}`),
					},
				};
		}
	});
}

/**
 * Resolves a SELECT column's options from optionConfig.
 *
 * - string  → lookup in commonCodeOptions by master code ID
 * - array of { title, value } → map to { label, value }
 * - array of strings → map to { label: s, value: s }
 */
function resolveSelectOptions(
	optionConfig: SubTblCfg[string]['optionConfig'],
	commonCodeOptions: Record<string, DefaultOptionType[]>,
): DefaultOptionType[] {
	if (!optionConfig) return [];

	if (typeof optionConfig === 'string') {
		return commonCodeOptions[optionConfig] ?? [];
	}

	if (Array.isArray(optionConfig)) {
		if (optionConfig.length === 0) return [];

		const first = optionConfig[0];
		if (typeof first === 'object' && 'title' in first) {
			return (optionConfig as { title: string; value: string }[]).map((item) => ({
				label: item.title,
				value: item.value,
			}));
		}

		return (optionConfig as string[]).map((s) => ({ label: s, value: s }));
	}

	return [];
}
