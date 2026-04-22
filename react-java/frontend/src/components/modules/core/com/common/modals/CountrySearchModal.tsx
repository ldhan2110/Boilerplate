import CustomTable from '@/components/common/custom-table/CustomTable';
import { FormInput } from '@/components/common/form';
import { CommonSearchModal } from '@/components/common/modals';
import { useAppForm, useAppTranslate } from '@/hooks';
import type { SearchModalProps, TableColumn, TableData } from '@/types';
import { Flex } from 'antd';
import React from 'react';

type Country = {
	countryCode: string;
	countryName: string;
};

const countries: Country[] = [
	{ countryCode: 'US', countryName: 'United States' },
	{ countryCode: 'CA', countryName: 'Canada' },
	{ countryCode: 'MX', countryName: 'Mexico' },
	{ countryCode: 'BR', countryName: 'Brazil' },
	{ countryCode: 'AR', countryName: 'Argentina' },
	{ countryCode: 'CL', countryName: 'Chile' },
	{ countryCode: 'CO', countryName: 'Colombia' },
	{ countryCode: 'PE', countryName: 'Peru' },
	{ countryCode: 'VE', countryName: 'Venezuela' },
	{ countryCode: 'GB', countryName: 'United Kingdom' },
	{ countryCode: 'FR', countryName: 'France' },
	{ countryCode: 'DE', countryName: 'Germany' },
	{ countryCode: 'IT', countryName: 'Italy' },
	{ countryCode: 'ES', countryName: 'Spain' },
	{ countryCode: 'PT', countryName: 'Portugal' },
	{ countryCode: 'NL', countryName: 'Netherlands' },
	{ countryCode: 'BE', countryName: 'Belgium' },
	{ countryCode: 'CH', countryName: 'Switzerland' },
	{ countryCode: 'AT', countryName: 'Austria' },
	{ countryCode: 'SE', countryName: 'Sweden' },
	{ countryCode: 'NO', countryName: 'Norway' },
	{ countryCode: 'DK', countryName: 'Denmark' },
	{ countryCode: 'FI', countryName: 'Finland' },
	{ countryCode: 'PL', countryName: 'Poland' },
	{ countryCode: 'CZ', countryName: 'Czech Republic' },
	{ countryCode: 'HU', countryName: 'Hungary' },
	{ countryCode: 'RO', countryName: 'Romania' },
	{ countryCode: 'GR', countryName: 'Greece' },
	{ countryCode: 'TR', countryName: 'Turkey' },
	{ countryCode: 'RU', countryName: 'Russia' },
	{ countryCode: 'CN', countryName: 'China' },
	{ countryCode: 'JP', countryName: 'Japan' },
	{ countryCode: 'KR', countryName: 'South Korea' },
	{ countryCode: 'VN', countryName: 'Vietnam' },
	{ countryCode: 'TH', countryName: 'Thailand' },
	{ countryCode: 'MY', countryName: 'Malaysia' },
	{ countryCode: 'SG', countryName: 'Singapore' },
	{ countryCode: 'ID', countryName: 'Indonesia' },
	{ countryCode: 'PH', countryName: 'Philippines' },
	{ countryCode: 'IN', countryName: 'India' },
	{ countryCode: 'PK', countryName: 'Pakistan' },
	{ countryCode: 'BD', countryName: 'Bangladesh' },
	{ countryCode: 'AU', countryName: 'Australia' },
	{ countryCode: 'NZ', countryName: 'New Zealand' },
	{ countryCode: 'EG', countryName: 'Egypt' },
	{ countryCode: 'NG', countryName: 'Nigeria' },
	{ countryCode: 'KE', countryName: 'Kenya' },
	{ countryCode: 'ZA', countryName: 'South Africa' },
	{ countryCode: 'SA', countryName: 'Saudi Arabia' },
	{ countryCode: 'AE', countryName: 'United Arab Emirates' },
	{ countryCode: 'IL', countryName: 'Israel' },
];

type CountrySearchModalProps = Partial<SearchModalProps<Country>>;

export const CountrySearchModal = ({
	open,
	selectType = 'single',
	fieldName,
	fieldValue,
	initialSearchValues,
	onConfirm,
	onCancel,
	onSelect,
	...props
}: CountrySearchModalProps) => {
	const { t } = useAppTranslate();
	const form = useAppForm({ formName: 'searchCountryModal' });
	const [tableData, setTableData] = React.useState<TableData<Country>[]>(
		countries.map((item) => ({ ...item, key: item.countryCode, procFlag: 'S' })),
	);

	const columns: TableColumn<Country>[] = [
		{
			title: 'Code',
			dataIndex: 'countryCode',
			key: 'countryCode',
			width: 100,
			fixed: 'left',
			render: (text: string) => <a>{text}</a>,
		},
		{
			title: 'Name',
			dataIndex: 'countryName',
			key: 'countryName',
			width: 350,
		},
	];

	function handleCloseModal() {
		form.resetFields();
		onCancel?.();
	}

	function handleRowDoubleClick(record: TableData<Country>) {
		if (selectType == 'single') {
			onSelect?.(record);
			handleCloseModal();
		}
		return;
	}

	function handleSearch() {
		const filterValue = form.getFieldsValue();
		setTableData(
			countries
				.map((item) => ({ ...item, key: item.countryCode, procFlag: 'S' }))
				.filter((item) => {
					return Object.entries(filterValue).every(([key, value]) => {
						// Ignore undefined or unknown fields
						if (value === undefined || !(key in item)) return true;

						const itemValue = item[key as keyof Country];
						// Case-insensitive comparison for strings
						if (typeof itemValue === 'string' && typeof value === 'string') {
							return itemValue.toLowerCase() === value.toLowerCase();
						}

						return itemValue === value;
					});
				}) as TableData<Country>[],
		);
	}

	return (
		<CommonSearchModal
			fieldName={fieldName!}
			fieldValue={fieldValue}
			onSearch={handleSearch}
			open={open!}
			form={form}
			title={'Country'}
			initialSearchValues={initialSearchValues}
			selectType={selectType}
			filterNode={
				<Flex gap={8} vertical>
					<Flex gap={16}>
						<FormInput
							name="countryCode"
							label={'Country Code'}
							placeholder={t('Enter Country Code')}
							width={150}
						/>
						<FormInput
							name="countryName"
							label={'Country Name'}
							placeholder={t('Enter Country Name')}
							width={150}
						/>
					</Flex>
				</Flex>
			}
			tableNode={
				<CustomTable<Country>
					columns={columns}
					data={tableData}
					tableState={{}}
					onRowDoubleClick={handleRowDoubleClick}
				/>
			}
			onCancel={handleCloseModal}
			onConfirm={onConfirm!}
			{...props}
		/>
	);
};
