import React from 'react';
import { Flex, message, type FormInstance } from 'antd';

import {
	EDIT_TYPE,
	type MessageTranslationDto,
	type EditTableHandler,
	type TableColumn,
	type TableData,
} from '@/types';
import { AddButton, DeleteButton } from '@/components/common/buttons';
import EditCustomTable from '@/components/common/custom-table/EditCustomTable';
import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';
import { useMessageManagementStore } from '@/stores';

type TranslationTableProps = {
	form: FormInstance<{ [key: string]: MessageTranslationDto[] }>;
	tableRef: React.RefObject<EditTableHandler<MessageTranslationDto> | null>;
};

export const TranslationTable = ({ form, tableRef }: TranslationTableProps) => {
	const { t, m } = useAppTranslate();
	const formTableName = React.useMemo(() => 'translationTable', []);

	// Zustands
	const selectedRows = useMessageManagementStore((state) => state.selectedRows);
	const setSelectedRows = useMessageManagementStore((state) => state.setSelectedRows);

	const columns: TableColumn<MessageTranslationDto>[] = [
		{
			key: 'langVal',
			title: t('Language'),
			dataIndex: 'langVal',
			width: 120,
			draggable: false,
			sorter: false,
			editType: EDIT_TYPE.SELECT,
			editProps: {
				required: true,
				placeholder: t('Select Language'),
				options: [
					{ label: t('English'), value: 'en' },
					{ label: t('Korean'), value: 'kr' },
					{ label: t('Vietnamese'), value: 'vn' },
				],
				rules: [
					{
						validator: (_, value) => {
							const translationList = form.getFieldValue(formTableName) || [];
							const languages = translationList
								.map((trans: MessageTranslationDto) => trans?.langVal)
								.filter(Boolean);
							const duplicateCount = languages.filter((l: string) => l === value).length;
							if (duplicateCount > 1) {
								return Promise.reject(new Error(t('Duplicate Language')));
							}
							return Promise.resolve();
						},
					},
				],
			},
		},
		{
			key: 'transMsgVal',
			title: t('Translation'),
			dataIndex: 'transMsgVal',
			width: 350,
			draggable: false,
			sorter: false,
			editType: EDIT_TYPE.INPUT,
			editProps: {
				required: true,
				maxLength: 1000,
				placeholder: t('Enter Translation'),
			},
		},
	];

	function handleSelectChange(_selectedKey: React.Key[], selectedRows: TableData<MessageTranslationDto>[]) {
		setSelectedRows(selectedRows);
	}

	function handleAddTranslation() {
		tableRef.current?.onAddRow({});
	}

	function handleDeleteTranslation() {
		if (selectedRows.length === 0) {
			message.warning(m(MESSAGE_CODES.COM000005));
		} else {
			tableRef.current?.onRemoveRow?.(selectedRows.map((item) => item.key) as number[]);
			setSelectedRows([]);
		}
	}

	return (
		<Flex vertical>
			<Flex
				justify="end"
				gap={8}
				style={{
					paddingBottom: '8px',
				}}
			>
				<DeleteButton hidden={selectedRows.length == 0} onClick={handleDeleteTranslation}>
					{t('Delete Translation')}
				</DeleteButton>
				<AddButton type="default" onClick={handleAddTranslation}>
					{t('Add Translation')}
				</AddButton>
			</Flex>
			<EditCustomTable<MessageTranslationDto>
				form={form}
				formTableName={formTableName}
				ref={tableRef}
				columns={columns}
				headerOffset={440}
				data={[]}
				tableState={{
					rowSelection: selectedRows,
				}}
				onSelectChange={handleSelectChange}
			/>
		</Flex>
	);
};

