// PGM_ID: ADM_001 - What's news page ?
import React, { useState } from 'react';
import { Button, Flex, Form, Space, Tag } from 'antd';
import { isEqual } from 'lodash';
import { observer } from 'mobx-react-lite';
import axios from 'axios';
import dayjs from 'dayjs';

import type {
	CompanyInfoDto,
	CrossPageSelectionInfo,
	CustomRuleObject,
	DynamicFilterDto,
	EditTableHandler,
	GetCommonCodeRequestDto,
	MultiSort,
	SubCodeResponseDto,
	TableColumn,
	TableData,
} from '@/types';
import {
	AGGERATE_TYPE,
	EDIT_TYPE,
	TABLE_FILTER_TYPE,
} from '@/types';
import {
	AddButton,
	DeleteButton,
	RefreshButton,
	SaveButton,
	UploadButton,
} from '@/components/common/buttons';
import CustomTable from '@/components/common/custom-table/CustomTable';
import EditCustomTable from '@/components/common/custom-table/EditCustomTable';
import {
	FormCheckbox,
	FormCascaderSelect,
	FormDatePicker,
	FormFieldset,
	FormInput,
	FormMultiSelect,
	FormNumberInput,
	FormRadioGroup,
	FormRangeNumberInput,
	FormRichEditor,
	FormSearchContainer,
	FormSelect,
	FormTextArea,
	FormTimePicker,
} from '@/components/common/form';
import { ImageViewer } from '@/components/common/input';
import { CascaderSelect } from '@/components/common/input/cascader-select';
import { CountrySearchModal, FormCountrySearch } from '@/components/modules/core/com';
import { MESSAGE_CODES } from '@/constants';
import { useShowMessage } from '@/hooks';
import { useGetCommonCode } from '@/hooks/modules/com/code';
import { getApiUrl } from '@/configs';
import { downloadFileAndSave } from '@/services/api';
import { authService } from '@/services/auth/authJwtService';
import appStore from '@/stores/AppStore';
import { formatNumberAmount } from '@/utils/helper';
import { ROUTE_KEYS } from '@/utils/routes';

// Generate 50 rows to simulate backend-paginated data
const NAMES = ['John Brown', 'Jim Green', 'Anh Le', 'Sarah Kim', 'Mike Chen', 'Lisa Park', 'David Tran', 'Emma Nguyen', 'Tom Wilson', 'Jane Smith'];
const COUNTRIES = [
	{ code: 'US', name: 'United States' },
	{ code: 'VN', name: 'Viet Nam' },
	{ code: 'KR', name: 'South Korea' },
	{ code: 'JP', name: 'Japan' },
	{ code: 'SG', name: 'Singapore' },
];
const ROLES = ['PM', 'DEV', 'QA', 'BA', 'DEVOPS'];
const TAG_OPTIONS = ['LEAD', 'SUB-LEAD', 'WD', 'DEVOPS', 'QA', 'BE', 'FE'];

const allData: DataType[] = Array.from({ length: 50 }, (_, i) => {
	const country = COUNTRIES[i % COUNTRIES.length];
	return {
		name: `${NAMES[i % NAMES.length]} ${i + 1}`,
		age: 25 + (i % 30),
		countryCode: country.code,
		countryName: country.name,
		salary: 40000 + i * 1000,
		vatAmount: 4000 + i * 100,
		address: `${country.name} Street No. ${i + 1}`,
		tags: [TAG_OPTIONS[i % TAG_OPTIONS.length], TAG_OPTIONS[(i + 3) % TAG_OPTIONS.length]],
		role: ROLES[i % ROLES.length],
		activeYn: i % 3 === 0 ? 'N' : 'Y',
	};
});

// Original 3-row data used by EditCustomTable
const data: DataType[] = allData.slice(0, 3);

const invoiceData: Invoice[] = [
	{
		invoiceNo: 'INV-2025-001',
		invoiceStatus: 'Pending',
		customerName: 'ABC Trading Co.',
		customerNumber: 'CUST-1001',
		invoiceAmount: 5000.0,
		invoiceVatAmount: 500.0,
		invoicePayAmount: 5500.0,
		invoiceDate: '2025-10-01',
		invoiceDueDate: '2025-10-31',
	},
	{
		invoiceNo: 'INV-2025-002',
		invoiceStatus: 'Paid',
		customerName: 'Global Solutions Ltd.',
		customerNumber: 'CUST-1002',
		invoiceAmount: 12000.0,
		invoiceVatAmount: 1200.0,
		invoicePayAmount: 13200.0,
		invoiceDate: '2025-09-15',
		invoiceDueDate: '2025-10-15',
	},
	{
		invoiceNo: 'INV-2025-003',
		invoiceStatus: 'Overdue',
		customerName: 'Sunrise Electronics',
		customerNumber: 'CUST-1003',
		invoiceAmount: 7500.0,
		invoiceVatAmount: 750.0,
		invoicePayAmount: 8250.0,
		invoiceDate: '2025-08-20',
		invoiceDueDate: '2025-09-20',
	},
	{
		invoiceNo: 'INV-2025-004',
		invoiceStatus: 'Cancelled',
		customerName: 'Bright Future Corp.',
		customerNumber: 'CUST-1004',
		invoiceAmount: 3000.0,
		invoiceVatAmount: 300.0,
		invoicePayAmount: 3300.0,
		invoiceDate: '2025-10-05',
		invoiceDueDate: '2025-11-05',
	},
	{
		invoiceNo: 'INV-2025-005',
		invoiceStatus: 'Pending',
		customerName: 'NextGen Textiles',
		customerNumber: 'CUST-1005',
		invoiceAmount: 9800.0,
		invoiceVatAmount: 980.0,
		invoicePayAmount: 10780.0,
		invoiceDate: '2025-10-10',
		invoiceDueDate: '2025-11-10',
	},
];

interface DataType {
	name: string;
	age: number;
	countryCode: string;
	countryName: string;
	salary: number;
	vatAmount: number;
	receivableAmount?: number;
	startDate?: string;
	endDate?: string;
	address: string;
	tags: string[];
	role: string;
	activeYn: string;
	checkInTime?: string;
}

interface Invoice {
	invoiceNo: string;
	invoiceStatus: string;
	customerName: string;
	customerNumber: string;
	invoiceAmount: number;
	invoiceVatAmount: number;
	invoicePayAmount: number;
	invoiceDate: string;
	invoiceDueDate: string;
}

interface MyFormValue {
	username: string;
	password: string;
	status: string;
	remark: string;
	sellSoulYn: boolean;
	countryCode: string;
}

interface ContractFormValue {
	ctrtTp: string;
	salary: number;
	quantity: number;
	employee: string;
}

interface SearchFormValue {
	userId: string;
	username: string;
	office: string;
	status: string;
}

const groupColumns: TableColumn<Invoice>[] = [
	{
		title: 'Invoice Number',
		dataIndex: 'invoiceNo',
		key: 'invoiceNo',
		width: 50,
		fixed: 'left',
		sorter: true,
		resizable: false,
		draggable: false,
		excelProps: {
			exportType: 'string',
		},
	},
	{
		title: 'Invoice Status',
		dataIndex: 'invoiceStatus',
		key: 'invoiceStatus',
		width: 50,
		fixed: 'left',
		sorter: true,
		render: (text: string) => {
			let color: string = '';
			switch (text) {
				case 'Paid':
					color = 'success';
					break;
				case 'Pending':
					color = 'warning';
					break;
				case 'Overdue':
					color = 'error';
					break;
				default:
					color = 'default';
			}
			return <Tag color={color}>{text.toUpperCase()}</Tag>;
		},
	},
	{
		title: 'Customer',
		children: [
			{
				title: 'Code',
				dataIndex: 'customerNumber',
				sorter: true,
				width: 50,
				excelProps: {
					exportType: 'string',
				},
			},
			{
				title: 'Name',
				dataIndex: 'customerName',
				sorter: true,
				width: 50,
				summary: () => <>Total</>,
			},
		],
	},
	{
		title: 'Invoice',
		children: [
			{
				title: 'Incurred Amount',
				dataIndex: 'invoiceAmount',
				valueType: 'amount',
				width: 50,
				align: 'right',
				sorter: true,
				summary: AGGERATE_TYPE.SUM,
				excelProps: {
					exportType: 'number',
					exportFormat: '#,##0.00',
				},
				render: (value: number) => formatNumberAmount(value),
			},
			{
				title: 'VAT',
				dataIndex: 'invoiceVatAmount',
				valueType: 'amount',
				width: 50,
				align: 'right',
				sorter: true,
				summary: AGGERATE_TYPE.SUM,
				excelProps: {
					exportType: 'number',
					exportFormat: '#,##0.00',
				},
				render: (value: number) => formatNumberAmount(value),
			},
			{
				title: 'Total Amount',
				dataIndex: 'invoicePayAmount',
				valueType: 'amount',
				width: 50,
				align: 'right',
				sorter: true,
				summary: AGGERATE_TYPE.MIN,
				excelProps: {
					exportType: 'number',
					exportFormat: '#,##0.00',
				},
				render: (value: number) => formatNumberAmount(value),
			},
		],
	},
];

const columns: TableColumn<DataType>[] = [
	{
		title: 'Name',
		dataIndex: 'name',
		key: 'name',
		width: 100,
		fixed: 'left',
		sorter: true,
		filterProps: {
			showFilter: true,
			filterType: TABLE_FILTER_TYPE.TEXT,
			filterName: 'name',
		},
		excelProps: {
			exportType: 'string',
			hideInExport: true,
		},
		render: (text: string) => <a>{text}</a>,
		// Tooltip sample: function returning JSX with record data
		tooltip: (value: string, record: DataType) => (
			<div>
				<strong>{value}</strong>
				<br />
				<span>Age: {record.age} | Role: {record.role}</span>
			</div>
		),
	},
	{
		title: 'Age',
		dataIndex: 'age',
		key: 'age',
		width: 50,
		resizable: true,
		sorter: true,
		filterProps: {
			showFilter: true,
			filterType: TABLE_FILTER_TYPE.NUMBER,
			filterName: 'age',
			filterNumberType: 'amount',
		},
		excelProps: {
			exportType: 'number',
			exportFormat: '#,##0',
		},
		// Tooltip sample: static string
		tooltip: 'This is the employee age',
	},
	{
		title: 'Address',
		dataIndex: 'address',
		key: 'address',
		width: 100,
		sorter: true,
		filterProps: {
			showFilter: true,
			filterType: TABLE_FILTER_TYPE.DATEPICKER,
			filterName: 'address',
		},
		// Tooltip sample: function returning plain string from value
		tooltip: (value: string) => `Full address: ${value}`,
	},
	{
		title: 'Tags',
		key: 'tags',
		dataIndex: 'tags',
		width: 100,
		sorter: true,
		filterProps: {
			showFilter: true,
			filterType: TABLE_FILTER_TYPE.MULTI_SELECT,
			filterName: 'tags',
			filterOptions: [
				{ label: 'Lead', value: 'LEAD' },
				{ label: 'Sub-Lead', value: 'SUBLEAD' },
			],
		},
		render: (_, { tags }) => (
			<>
				{tags.map((tag) => {
					let color = tag.length > 5 ? 'geekblue' : 'green';
					if (tag === 'loser') {
						color = 'volcano';
					}
					return (
						<Tag color={color} key={tag}>
							{tag.toUpperCase()}
						</Tag>
					);
				})}
			</>
		),
	},
	{
		title: 'Role',
		key: 'role',
		dataIndex: 'role',
		width: 150,
		sorter: true,
		filterProps: {
			showFilter: true,
			filterType: TABLE_FILTER_TYPE.TIMEPICKER,
			filterName: 'role',
		},
		render: (text) => (
			<>
				<Tag color={'blue'}>{text.toUpperCase()}</Tag>
			</>
		),
	},
	{
		title: 'Action',
		key: 'action',
		width: 100,
		fixed: 'right',
		sorter: true,
		render: (_, record) => (
			<Space size="middle">
				<a>Invite {record.name}</a>
				<a>Delete</a>
			</Space>
		),
	},
];

type DefaultPageProps = {
	params?: { content: string };
};

const DefaultPage: React.FC = observer(({ params }: DefaultPageProps) => {
	const [selectionRows, setSelectionRows] = useState<TableData<DataType>[]>([]);
	const [basicTableSelectionRows, setBasicTableSelectionRows] = useState<TableData<DataType>[]>([]);
	const [crossPageInfo, setCrossPageInfo] = useState<CrossPageSelectionInfo | null>(null);
	// Simulated backend pagination for cross-page selection demo
	const [demoPagination, setDemoPagination] = useState({ current: 1, pageSize: 15 });
	const demoPageData = React.useMemo(() => {
		const start = (demoPagination.current - 1) * demoPagination.pageSize;
		const end = start + demoPagination.pageSize;
		return allData.slice(start, end);
	}, [demoPagination.current, demoPagination.pageSize]);
	const [pagination] = useState({
		total: 0,
		current: 1,
		pageSize: 15,
	});
	const [, setUserInfoData] = React.useState<DataType[]>(data);
	const [myForm] = Form.useForm<MyFormValue>();
	const [contractForm] = Form.useForm<ContractFormValue>();
	const [searchForm] = Form.useForm<SearchFormValue>();
	const [tableFilterForm] = Form.useForm();
	const [editTableFilterForm] = Form.useForm();
	const [tableForm] = Form.useForm();
	const [companyForm] = Form.useForm<CompanyInfoDto>();
	const [commonCodeForm] = Form.useForm<GetCommonCodeRequestDto & { cdListString: string }>();
	const [imageValue, setImageValue] = useState<string | File | null>(null);
	const [cascaderValue, setCascaderValue] = useState<(string | number)[]>([]);
	const [shouldFetchCommonCode, setShouldFetchCommonCode] = useState<boolean>(false);
	const {
		showConfirmMessage,
		showErrorMessage,
		showWarningMessage,
		showInfoMessage,
		showSuccessMessage,
	} = useShowMessage();

	React.useEffect(()=> {
		console.log(crossPageInfo?.getEffectiveKeys());
	}, [crossPageInfo, basicTableSelectionRows])

	
	// Get common code hook - example usage
	const commonCodeCoId = commonCodeForm.getFieldValue('coId');
	const commonCodeCdListString = commonCodeForm.getFieldValue('cdListString');
	const commonCodeCdList = commonCodeCdListString
		? commonCodeCdListString.split(',').map((cd: string) => cd.trim()).filter((cd: string) => cd.length > 0)
		: [];
	const commonCodeRequest: GetCommonCodeRequestDto | null = shouldFetchCommonCode && commonCodeCoId && commonCodeCdList.length > 0
		? { coId: commonCodeCoId, cdList: commonCodeCdList }
		: null;
	const { data: commonCodeData, isLoading: isLoadingCommonCode } = useGetCommonCode(
		commonCodeRequest || { coId: '', cdList: [] },
		!!commonCodeRequest
	);


	React.useEffect(() => {
		console.log(params?.content);
	}, [params]);

	// Refs
	const editTableHandlerRef = React.useRef<EditTableHandler<DataType> | null>(null);

	function onFormSubmit(values: MyFormValue) {
		console.log('Form submitted with values:', values);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		console.log('CascaderCategories selected:', (values as any).cascaderCategories);
	}

	function onContractFormSubmit(values: ContractFormValue) {
		console.log(values);
	}

	async function onCompanyFormSubmit(values: CompanyInfoDto) {
		try {
			// Convert date fields from dayjs to YYYY-MM-DD format for backend
			const formData: CompanyInfoDto = {
				...values,
				logoFile: values.logoFile || undefined,
				// Convert date fields to YYYY-MM-DD string format
				coAnvDt: values.coAnvDt && dayjs.isDayjs(values.coAnvDt)
					? values.coAnvDt.format('YYYY-MM-DD')
					: values.coAnvDt,
				estbDt: values.estbDt && dayjs.isDayjs(values.estbDt)
					? values.estbDt.format('YYYY-MM-DD')
					: values.estbDt,
				// estbDt: values.estbDt && dayjs.isDayjs(values.estbDt) 
				// 	? values.estbDt.format('YYYY-MM-DD') 
				// 	: values.estbDt,
			};

			// Validate required fields
			if (!formData.coId || formData.coId.trim() === '') {
				showWarningMessage(MESSAGE_CODES.COM000005);
				return;
			}

			
		} catch (error) {
			
		}
	}

	function onFormRefresh() {
		searchForm.resetFields();
	}

	async function onFormSearch() {
		try {
			await searchForm.validateFields();
			console.log(searchForm.getFieldsValue());
		} catch {
			return;
		}
	}

	const initFormVal: MyFormValue = {
		sellSoulYn: true,
		remark: 'Hello World',
		status: 'Y',
		username: 'admin',
		password: '@Gfa123',
		countryCode: 'VN',
	};

	function reloadOptionBasedOnRole(role: string) {
		switch (role) {
			case 'PM':
				return [
					{ label: 'Leader', value: 'LEAD' },
					{ label: 'Sub-Lead', value: 'SUB-LEAD' },
				];
			case 'QC':
				return [
					{ label: 'Quality Control', value: 'QC' },
					{ label: 'Quality Assurance', value: 'QA' },
				];
			case 'DEV':
				return [
					{ label: 'Web-Developer', value: 'WD' },
					{ label: 'DevOps', value: 'DEVOPS' },
				];
		}
	}

	const editColumns: TableColumn<DataType>[] = [
		{
			title: 'Name',
			dataIndex: 'name',
			key: 'name',
			editType: EDIT_TYPE.INPUT,
			width: 100,
			resizable: true,
			draggable: true,
			sorter: true,
			filterProps: {
				showFilter: true,
				filterType: TABLE_FILTER_TYPE.TEXT,
				filterName: 'name',
			},
			editProps: {
				required: true,
				disabled: true,
				maxLength: 10,
				placeholder: 'Enter Username',
				shouldUpdate: (prev, curr, rowIndex) => {
					return !isEqual(prev['user'][rowIndex], curr['user'][rowIndex]);
				},
				overrideEditProps(curVal, rowIdx) {
					const dataTable = (curVal['user'] || []) as TableData<DataType>[];
					return {
						disabled: dataTable[rowIdx].activeYn === 'N',
					};
				},
			},
			// Tooltip sample in EditCustomTable: function returning JSX
			tooltip: (value: string, record: DataType) => (
				<div>
					<strong>{value}</strong>
					<br />
					<span>Role: {record.role} | Active: {record.activeYn}</span>
				</div>
			),
		},
		{
			title: 'Age',
			dataIndex: 'age',
			key: 'age',
			width: 100,
			align: 'right',
			summary: AGGERATE_TYPE.SUM,
			resizable: true,
			draggable: true,
			sorter: true,
			editType: EDIT_TYPE.INPUT_NUMBER,
			filterProps: {
				showFilter: true,
				filterType: TABLE_FILTER_TYPE.NUMBER,
				filterName: 'age',
				filterNumberType: 'number',
			},
			editProps: {
				maxLength: 10,
				placeholder: 'Enter Age',
				numberType: 'amount',
				shouldUpdate: (prev, curr, rowIndex) => {
					return !isEqual(prev['user'][rowIndex], curr['user'][rowIndex]);
				},
				overrideEditProps(curVal, rowIndex) {
					const dataTable = (curVal['user'] || []) as TableData<DataType>[];
					return {
						disabled: dataTable[rowIndex].activeYn === 'N',
						rules: [],
					};
				},
			},
		},
		{
			title: 'Check-in Time',
			dataIndex: 'checkInTime',
			key: 'checkInTime',
			width: 140,
			resizable: true,
			draggable: true,
			sorter: true,
			editType: EDIT_TYPE.TIMEPICKER,
			editProps: {
				placeholder: 'Enter Check-in Time',
			},
			filterProps: {
				showFilter: true,
				filterType: TABLE_FILTER_TYPE.TIMEPICKER,
				filterName: 'checkInTime',
			},
		},
		{
			title: 'Country',
			children: [
				{
					title: 'Code',
					dataIndex: 'countryCode',
					key: 'countryCode',
					width: 100,
					resizable: true,
					draggable: true,
					sorter: true,
					editType: EDIT_TYPE.SEARCH,
					editProps: {
						placeholder: 'Search Country',
						searchModal: <CountrySearchModal />,
						onSearchSelect: (record, rowIdx, form) => {
							form.setFieldValue(['user', rowIdx, 'countryName'], record['countryName']);
							console.log(record, rowIdx, form);
						},
					},
				},
				{
					title: 'Name',
					dataIndex: 'countryName',
					key: 'countryName',
					width: 100,
					resizable: true,
					draggable: true,
					sorter: true,
					editProps: {
						shouldUpdate: (prev, curr, rowIndex) => {
							return !isEqual(prev['user'][rowIndex], curr['user'][rowIndex]);
						},
					},
				},
			],
		},
		{
			title: 'Start Date',
			dataIndex: 'startDate',
			key: 'startDate',
			width: 150,
			resizable: true,
			draggable: true,
			sorter: true,
			filterProps: {
				showFilter: true,
				filterType: TABLE_FILTER_TYPE.DATEPICKER,
				filterName: 'startDate',
			},
			editType: EDIT_TYPE.DATEPICKER,
			editProps: {
				placeholder: 'Enter Start Date',
				required: true,
				// rules: [
				// 	({ getFieldValue }) => ({
				// 		validator(ruleObject: CustomRuleObject, value) {
				// 			const fields = ruleObject.field?.split('.') ?? [];
				// 			const formName = fields[0];
				// 			const rowKey = fields[1];
				// 			const endDate =
				// 				formName && rowKey ? getFieldValue([formName, rowKey, 'endDate']) : undefined;
				// 			if (!value || !endDate || !value.isBefore(endDate)) {
				// 				return Promise.reject(new Error('Start date must be before end date!'));
				// 			}
				// 			return Promise.resolve();
				// 		},
				// 	}),
				// ],
				onChange: (_value, _event, form, name) => {
					form.validateFields([['user', name[0], 'endDate']]);
				},
			},
			excelProps: {
				exportType: 'date',
				exportFormat: 'DD/MM/YYYY',
			},
		},
		{
			title: 'End Date',
			dataIndex: 'endDate',
			key: 'endDate',
			width: 150,
			resizable: true,
			draggable: true,
			sorter: true,
			filterProps: {
				showFilter: true,
				filterType: TABLE_FILTER_TYPE.MULTI_SELECT,
				filterName: 'endDate',
				filterOptions: [
					{ label: 'End Date', value: 'END_DATE' },
					{ label: 'Start Date', value: 'START_DATE' },
				],
			},
			editType: EDIT_TYPE.DATEPICKER,
			editProps: {
				placeholder: 'Enter End Date',
				required: true,
				rules: [
					({ getFieldValue }) => ({
						validator(ruleObject: CustomRuleObject, value) {
							const fields = ruleObject.field?.split('.') ?? [];
							const formName = fields[0];
							const rowKey = fields[1];
							const startDate =
								formName && rowKey ? getFieldValue([formName, rowKey, 'startDate']) : undefined;
							if (!value || !startDate || value.isBefore(startDate)) {
								return Promise.reject(new Error('End date must be after start date!'));
							}
							return Promise.resolve();
						},
					}),
				],
				onChange: (_value, _event, form, name) => {
					form.validateFields([['user', name[0], 'startDate']]);
				},
			},
			excelProps: {
				exportType: 'date',
				exportFormat: 'DD/MM/YYYY',
			},
		},
		{
			title: 'Salary',
			dataIndex: 'salary',
			key: 'salary',
			width: 100,
			valueType: 'amount',
			align: 'right',
			resizable: true,
			draggable: true,
			sorter: true,
			summary: AGGERATE_TYPE.SUM,
			editType: EDIT_TYPE.INPUT_NUMBER,
			editProps: {
				required: true,
				maxLength: 10,
				placeholder: 'Enter Age',
				numberType: 'amount',
				onChange(_value, _event, form, name) {
					const receivableAmount =
						(form.getFieldValue(['user', name[0], 'salary']) ?? 0) -
						(form.getFieldValue(['user', name[0], 'vatAmount']) ?? 0);
					form.setFieldValue(['user', name[0], 'receivableAmount'], receivableAmount);
				},
			},
			// Tooltip sample in EditCustomTable: static string
			tooltip: 'Monthly gross salary (before tax)',
		},
		{
			title: 'VAT Amount',
			dataIndex: 'vatAmount',
			key: 'vatAmount',
			width: 100,
			valueType: 'amount',
			align: 'right',
			resizable: true,
			draggable: true,
			sorter: true,
			summary: AGGERATE_TYPE.SUM,
			editType: EDIT_TYPE.INPUT_NUMBER,
			editProps: {
				required: true,
				maxLength: 10,
				placeholder: 'Enter VAT',
				numberType: 'amount',
				onChange(_value, _event, form, name) {
					const receivableAmount =
						(form.getFieldValue(['user', name[0], 'salary']) ?? 0) -
						(form.getFieldValue(['user', name[0], 'vatAmount']) ?? 0);
					form.setFieldValue(['user', name[0], 'receivableAmount'], receivableAmount);
				},
			},
		},
		{
			title: 'Receivable Amount',
			dataIndex: 'receivableAmount',
			key: 'receivableAmount',
			valueType: 'amount',
			width: 125,
			align: 'right',
			resizable: true,
			draggable: true,
			sorter: true,
			summary: AGGERATE_TYPE.SUM,
			editType: EDIT_TYPE.INPUT_NUMBER,
			editProps: {
				disabled: true,
				numberType: 'amount',
			},
		},
		{
			title: 'Address',
			dataIndex: 'address',
			key: 'address',
			resizable: true,
			draggable: true,
			sorter: true,
			width: 250,
			editType: EDIT_TYPE.INPUT,
		},
		{
			title: 'Tags',
			key: 'tags',
			dataIndex: 'tags',
			width: 200,
			resizable: true,
			draggable: true,
			sorter: true,
			editType: EDIT_TYPE.MULTI_SELECT,
			editProps: {
				required: true,
				placeholder: 'Enter Tag',
				options: [
					{ label: 'cool', value: 'cool' },
					{ label: 'teacher', value: 'teacher' },
					{ label: 'loser', value: 'loser' },
					{ label: 'developer', value: 'developer' },
				],
				shouldUpdate: (prev, curr, rowIndex) => {
					return !isEqual(prev['user'][rowIndex], curr['user'][rowIndex]);
				},
				overrideEditProps(curVal, rowIndex) {
					const dataTable = (curVal['user'] || []) as TableData<DataType>[];
					return {
						disabled: dataTable[rowIndex].role == null,
						options: reloadOptionBasedOnRole(dataTable[rowIndex].role),
					};
				},
			},
		},
		{
			title: 'Role',
			key: 'role',
			dataIndex: 'role',
			width: 150,
			resizable: true,
			draggable: true,
			sorter: true,
			editType: EDIT_TYPE.SELECT,
			filterProps: {
				showFilter: true,
				filterType: TABLE_FILTER_TYPE.SELECT,
				filterName: 'role',
				filterOptions: [
					{ label: 'Project Manager', value: 'PM' },
					{ label: 'Quality Control', value: 'QC' },
					{ label: 'Developer', value: 'DEV' },
				],
			},
			editProps: {
				required: true,
				placeholder: 'Enter Role',
				options: [
					{ label: 'Project Manager', value: 'PM' },
					{ label: 'Quality Control', value: 'QC' },
					{ label: 'Developer', value: 'DEV' },
				],
				onChange(_value, _event, form, name) {
					form.setFieldValue(['user', name[0], 'tags'], []); // Clear tags when role changes
				},
			},
		},
		{
			title: 'Active',
			align: 'center',
			key: 'activeYn',
			dataIndex: 'activeYn',
			width: 50,
			resizable: true,
			draggable: true,
			sorter: true,
			editType: EDIT_TYPE.CHECKBOX,
			editProps: {
				checkboxMapping: {
					checked: 'Y',
					unchecked: 'N',
				},
			},
		},
	];

	// Edit Tables Methods
	async function handleGetTableData() {
		try {
			const values = await editTableHandlerRef.current?.validateAllFields();
			console.log('Table Data:', values);
		} catch (error) {
			console.error('Error:', error);
		}
	}

	function handleAddRow() {
		editTableHandlerRef.current?.onAddRow?.({ activeYn: 'N' });
	}

	function handleDeleteRow() {
		console.log('Selected Rows:', selectionRows);
		if (selectionRows.length === 0) {
			showWarningMessage(MESSAGE_CODES.COM000005);
		} else {
			editTableHandlerRef.current?.onRemoveRow?.(selectionRows.map((item) => item.key) as number[]);
			showSuccessMessage(MESSAGE_CODES.COM000007);
			setSelectionRows([]);
		}
	}

	function handleSelectChange(
		_selectedRowKeys: React.Key[],
		selectedRows: TableData<DataType>[],
	): void {
		setSelectionRows(selectedRows);
	}

	function handleFilterChange(filterValue: DynamicFilterDto[]) {
		console.log(filterValue);
		setUserInfoData(
			data.filter((item) => {
				return Object.entries(filterValue).every(([key, value]) => {
					if (value.value === undefined || value.value === null || value.value === '') return true; // ignore empty filter

					const field = item[key as keyof DataType];

					// handle array (e.g., tags)
					if (Array.isArray(field)) {
						return field.some((v) => String(v).toLowerCase().includes(String(value).toLowerCase()));
					}

					// handle string/number
					return String(field).toLowerCase().includes(String(value).toLowerCase());
				});
			}),
		);
	}

	function handleEditFilterChange(filterValue: DynamicFilterDto[]) {
		console.log('[EditCustomTable] Filter changed:', filterValue);
	}

	function handleOpenNewTab() {
		appStore.openNewTabByKey(ROUTE_KEYS.MAIN, {
			label: 'MAIN-2021',
			params: {
				content: 'this is the config param',
			},
		});
	}

	// function handleSortChange(_sortField: string | undefined, _sortType: SORT | undefined) {
	// 	// single sort callback (unused in multi-sort demo)
	// }

	function handleMultiSortChange(sorts: MultiSort) {
		console.log('multi sort:', sorts);
	}

	return (
		<div className="p-4">
			<Flex vertical gap={8}>
				<Flex gap={4}>
					<Button onClick={() => showConfirmMessage(MESSAGE_CODES.COM000001)}>Show Confirm</Button>
					<Button onClick={() => showErrorMessage(MESSAGE_CODES.COM000001)}>Show Error</Button>
					<Button onClick={() => showInfoMessage(MESSAGE_CODES.COM000001)}>Show Info</Button>
					<Button onClick={() => showWarningMessage(MESSAGE_CODES.COM000001)}>Show Warning</Button>
					<Button onClick={() => showSuccessMessage(MESSAGE_CODES.COM000001)}>Show Success</Button>
				</Flex>

				<Flex gap={4}>
					<Button type="primary">Submit</Button>
					<Button>Click me</Button>
					<Button danger>Cancel</Button>
					<AddButton>Add Row</AddButton>
					<DeleteButton>Delete Row</DeleteButton>
					<SaveButton />
					<RefreshButton />
					<UploadButton title="Click to Upload" />
					<Button type="primary" onClick={handleOpenNewTab}>
						Open New Tab
					</Button>
					<Button onClick={async () => {
						await downloadFileAndSave('FILE202511210003')
					}}>Dowload File</Button>
					<Button type="primary" onClick={async () => {
						try {
							const url = getApiUrl('/com/reports/downloadTestExcel');
							const resp = await axios.post(url, {}, {
								responseType: 'blob',
								headers: {
									'Content-Type': 'application/json',
									Authorization: `Bearer ${authService.getAccessToken()}`,
								},
							});
							const blob = new Blob([resp.data], {
								type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
							});
							const link = document.createElement('a');
							link.href = URL.createObjectURL(blob);
							link.download = 'Sample_Employee_Report.xlsx';
							link.click();
							URL.revokeObjectURL(link.href);
						} catch (err) {
							console.error('Failed to download test Excel:', err);
						}
					}}>Test Excel Download</Button>
				</Flex>

				<Flex gap={8}>
					<Form form={myForm} layout="vertical" initialValues={initFormVal} onFinish={onFormSubmit}>
						<FormFieldset title="User Information">
							<Flex gap={8} vertical>
								<Flex gap={4}>
									<FormInput name="username" label={'Username'} max={20} required />
									<FormInput name="password" label={'Password'} type="password" max={20} required />
									<FormCountrySearch />
									<FormSelect
										name="status"
										label={'Status'}
										required
										width={150}
										options={[
											{ label: 'Active', value: 'Y' },
											{ label: 'Inactive', value: 'N' },
										]}
									/>
								</Flex>
								<FormRangeNumberInput
									name="range"
									label="Cost"
									type="amount"
									precision={2}
									placeholder={['From', 'To'] as [string, string]}
								/>
								<FormCascaderSelect
									name="cascaderCategories"
									label="Categories"
									placeholder="Select categories"
									options={[
										{
											label: 'Technology',
											value: 'tech',
											children: [
												{ label: 'Frontend', value: 'frontend' },
											],
										},
										{
											label: 'Design',
											value: 'design',
											children: [
												{ label: 'UI Design', value: 'ui' },
												{ label: 'UX Design', value: 'ux' },
												{ label: 'Graphic Design', value: 'graphic' },
											],
										},
										{
											label: 'Business',
											value: 'business',
											children: [
												{ label: 'Marketing', value: 'marketing' },
												{ label: 'Sales', value: 'sales' },
												{ label: 'Finance', value: 'finance' },
											],
										},
									]}
								/>
								<FormTextArea name="remark" label="Remark" />
								<FormCheckbox name="sellSoulYn" title="I agree to sell my soul to LBU" />
								<Flex gap={4} align="end">
									<Button type="primary" htmlType="submit">
										Submit Form
									</Button>
								</Flex>
							</Flex>
						</FormFieldset>
					</Form>
					<Form form={contractForm} layout="vertical" onFinish={onContractFormSubmit}>
						<FormFieldset title="Contract Information">
							<Flex vertical gap={8}>
								<FormRadioGroup
									name="ctrtTp"
									options={[
										{ label: 'Exempted', value: 'EXP' },
										{ label: 'Probation', value: 'PRB' },
										{ label: 'Global Service Desk', value: 'GSD' },
									]}
								/>
								<Flex gap={8}>
									<FormNumberInput name="salary" label="Salary" required type="amount" />
									<FormNumberInput
										name="quantity"
										label="Quantity"
										required
										type="number"
										max={100}
									/>
								</Flex>
								<Flex gap={8}>
									<FormMultiSelect
										name="apprSts"
										label="Approval Status"
										options={[
											{ label: 'Exempted', value: 'EXP' },
											{ label: 'Probation', value: 'PRB' },
											{ label: 'Global Service Desk', value: 'GSD' },
										]}
									/>
									<FormMultiSelect
										name="businessTpCd"
										allowSelectAll
										label="Business Type"
										options={[
											{ label: 'Private Contract', value: 'PCT' },
											{ label: 'Complex Business', value: 'CBS' },
											{ label: 'SOC', value: 'SOC' },
										]}
									/>
									<FormTimePicker name="time" label={'Time'} width={150} placeholder="HH:mm" />
								</Flex>
								<Flex gap={8}>
									<FormDatePicker name="efcDt" label="Effective Date" />
									<FormDatePicker name="pkcUpDt" label="Pick-up Date" showTime />
								</Flex>
								<FormRichEditor name="richEditor" width={970} minHeight={20} height={100} buttonType='full' />
								<Flex gap={4} align="end">
									<Button type="primary" htmlType="submit">
										Submit Form
									</Button>
								</Flex>
							</Flex>
						</FormFieldset>
					</Form>
				</Flex>

				{/* CascaderSelect Example */}
				<Flex gap={8} vertical>
					<h3>CascaderSelect Component</h3>
					<Flex gap={16} vertical>
						<Flex gap={16} align="start">
							<Flex vertical gap={8} style={{ minWidth: 400 }}>
								<CascaderSelect
									value={cascaderValue}
									onChange={(value) => {
										setCascaderValue(value);
										console.log('CascaderSelect changed:', value);
									}}
									options={[
										{
											label: 'Department A',
											value: 'dept-a',
											children: [
												{ label: 'Team 1', value: 'team-1' },
												{ label: 'Team 2', value: 'team-2' },
												{ label: 'Team 3', value: 'team-3' },
											],
										},
										{
											label: 'Department B',
											value: 'dept-b',
											children: [
												{ label: 'Team 4', value: 'team-4' },
												{ label: 'Team 5', value: 'team-5' },
											],
										},
										{
											label: 'Department C',
											value: 'dept-c',
											children: [
												{ label: 'Team 6', value: 'team-6' },
												{ label: 'Team 7', value: 'team-7' },
												{ label: 'Team 8', value: 'team-8' },
												{ label: 'Team 9', value: 'team-9' },
											],
										},
									]}
									placeholder="Select teams"
									style={{ width: 400 }}
									allowClear
								/>
								<div style={{ fontSize: 12, color: '#666' }}>
									<strong>Selected values:</strong>{' '}
									{cascaderValue.length > 0 ? cascaderValue.join(', ') : 'None'}
								</div>
							</Flex>
							<Flex vertical gap={8} style={{ maxWidth: 400 }}>
								<div>
									<strong>Features:</strong>
									<ul style={{ marginTop: 8, paddingLeft: 20 }}>
										<li>Multi-select support (only children can be selected)</li>
										<li>Auto-selects all children when parent is selected</li>
										<li>Search functionality to filter children</li>
										<li>Shows parent as selected when all children are selected</li>
										<li>Clear button to reset selection</li>
									</ul>
								</div>
							</Flex>
						</Flex>
					</Flex>
				</Flex>

				{/* Image Viewer Example */}
				<Flex gap={8} vertical>
					<h3>Image Viewer Component</h3>
					<Flex gap={16}>
						<ImageViewer
							value={imageValue}
							onChange={(value) => {
								setImageValue(value);
								console.log('Image changed:', value);
							}}
							width={180}
							height={220}
							showUpload
							showReset
							showView
							showZoomControls
						/>
						<Flex vertical gap={8} style={{ maxWidth: 300 }}>
							<div>
								<strong>Features:</strong>
								<ul style={{ marginTop: 8, paddingLeft: 20 }}>
									<li>Upload image (drag & drop supported)</li>
									<li>Reset to clear image</li>
									<li>View button for full-screen preview</li>
									<li>Zoom in/out buttons</li>
									<li>Mouse wheel zoom</li>
									<li>Pinch-to-zoom on touch devices</li>
									<li>Drag to pan when zoomed</li>
								</ul>
							</div>
							<div>
								<strong>Current value:</strong>
								<div style={{ marginTop: 4, fontSize: 12, color: '#666', wordBreak: 'break-all' }}>
									{imageValue
										? (typeof imageValue === 'string'
											? (imageValue.length > 50 ? `${imageValue.substring(0, 50)}...` : imageValue)
											: imageValue.name)
										: 'No image selected'}
								</div>
							</div>
						</Flex>
					</Flex>
				</Flex>

				{/* Create Company Test Form */}
				<Flex>
					<Form form={companyForm} layout="vertical" onFinish={onCompanyFormSubmit} style={{ width: '100%' }}>
						<FormFieldset title="Create/View Company (Test Form)">
							<Flex gap={16} vertical>
								{/* Search Company Section */}
								

								<Flex gap={16}>
									{/* Left Panel - Logo Upload Section */}
									<Flex gap={8} vertical style={{ minWidth: 320 }}>
										<div style={{ fontSize: 14, fontWeight: 'bold' }}>Company Logo</div>
									</Flex>

									{/* Right Panel - Form Fields Section */}
									<Flex gap={16} vertical style={{ flex: 1 }}>
										{/* Basic Information Section */}
										<Flex gap={16} vertical>
											<Flex gap={16}>
												<FormInput name="coId" label="Company ID" required max={20} width={250} />
												<FormInput name="coNm" label="Company Name" max={200} width={350} />
											</Flex>
											<Flex gap={16}>
												<FormInput name="loclNm" label="Local Name" max={200} width={300} />
												<FormInput name="frgnNm" label="Foreign Name" max={200} width={300} />
												<FormInput name="coTpCd" label="Company Type Code" max={20} width={200} />
											</Flex>
										</Flex>

										{/* Tax Information Section */}
										<Flex gap={16}>
											<FormInput name="taxCd" label="Tax Code" max={50} width={250} />
											<FormInput name="taxOfc" label="Tax Office" max={200} width={350} />
										</Flex>

										{/* Address Section */}
										<Flex gap={16} vertical>
											<FormInput name="coAddrVal1" label="Address Line 1" max={200} />
											<FormInput name="coAddrVal2" label="Address Line 2" max={200} />
											<FormInput name="coAddrVal3" label="Address Line 3" max={200} />
										</Flex>

										{/* Contact Information Section */}
										<Flex gap={16} vertical>
											<Flex gap={16}>
												<FormInput name="emlAddr" label="Email Address" max={200} width={300} />
												<FormInput name="phnNo" label="Phone Number" max={50} width={250} />
												<FormInput name="faxNo" label="Fax Number" max={50} width={250} />
											</Flex>
											<Flex gap={16}>
												<FormInput name="webAddr" label="Website" max={200} width={300} />
												<FormInput name="slRep" label="Sales Representative" max={200} width={300} />
											</Flex>
										</Flex>

										{/* Dates Section */}
										<Flex gap={16}>
											<FormDatePicker name="coAnvDt" label="Anniversary Date" width={250} />
											<FormDatePicker name="vldFmDt" label="Valid From Date" width={250} />
											<FormDatePicker name="vldToDt" label="Valid To Date" width={250} />
										</Flex>

										{/* Additional Information Section */}
										<Flex gap={16} vertical>
											<Flex gap={16}>
												<FormInput name="coSz" label="Company Size" max={50} width={200} />
												<FormInput name="coNtn" label="Nation/Country" max={50} width={200} />
												<FormNumberInput name="empeSz" label="Employee Size" type="number" width={200} />
												<FormInput name="currCd" label="Currency Code" max={10} width={150} />
											</Flex>
											<Flex gap={16}>
												<FormInput name="coIndusZn" label="Company Industry Zone" max={100} width={300} />
												<FormInput name="coProd" label="Company Product" max={200} width={300} />
												<FormInput name="tmZn" label="Time Zone" max={50} width={200} />
											</Flex>
										</Flex>

										{/* Company Description */}
										<FormTextArea name="coDesc" label="Company Description" rows={4} />

										{/* Action Buttons */}
										<Flex gap={8} justify="flex-end" style={{ marginTop: 8 }}>
											<Button
												onClick={() => {
													companyForm.resetFields();
												}}
											>
												Reset
											</Button>
										</Flex>
									</Flex>
								</Flex>
							</Flex>
						</FormFieldset>
					</Form>
				</Flex>

				{/* Get Common Code Example */}
				<Flex>
					<Form form={commonCodeForm} layout="vertical" style={{ width: '100%' }}>
						<FormFieldset title="Get Common Code Example (useGetCommonCode Hook)">
							<Flex gap={16} vertical>
								<Flex gap={16}>
									<FormInput
										name="coId"
										label="Company ID"
										required
										placeholder="Enter Company ID (e.g., CO001)"
										width={300}
										onChange={() => {
											setShouldFetchCommonCode(false);
										}}
									/>
									<FormInput
										name="cdListString"
										label="Master Code List"
										required
										placeholder="Enter comma-separated master codes (e.g., MST001, MST002, MST003)"
										width={400}
										onChange={() => {
											setShouldFetchCommonCode(false);
										}}
									/>
									<Flex align="end" gap={8}>
										<Button
											type="primary"
											onClick={async () => {
												try {
													const values = await commonCodeForm.validateFields(['coId', 'cdListString']);
													if (values.coId && values.cdListString) {
														setShouldFetchCommonCode(true);
													}
												} catch {
													showWarningMessage('Please enter Company ID and Master Code List');
												}
											}}
											loading={isLoadingCommonCode}
										>
											Load Common Codes
										</Button>
										<Button
											onClick={() => {
												commonCodeForm.resetFields();
												setShouldFetchCommonCode(false);
											}}
										>
											Clear
										</Button>
									</Flex>
								</Flex>

								{/* Display Results */}
								{commonCodeData && commonCodeData.length > 0 && (
									<Flex gap={16} vertical style={{ marginTop: 16 }}>
										<div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
											Results ({commonCodeData.length} master code(s)):
										</div>
										<Flex gap={16} vertical>
											{commonCodeData.map((subCodeList, index) => {
												const masterCode = commonCodeCdList[index];
												return (
													<div
														key={index}
														style={{
															padding: 16,
															border: '1px solid #d9d9d9',
															borderRadius: 4,
															background: '#fafafa',
														}}
													>
														<div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
															Master Code: <Tag color="blue">{masterCode}</Tag> ({subCodeList.length} sub code(s))
														</div>
														{subCodeList.length > 0 ? (
															<Flex gap={8} wrap>
																{subCodeList.map((subCode: SubCodeResponseDto, subIndex: number) => (
																	<Tag key={subIndex} color="green">
																		{subCode.subCd} - {subCode.subNm}
																	</Tag>
																))}
															</Flex>
														) : (
															<div style={{ color: '#999', fontStyle: 'italic' }}>
																No sub codes found for this master code
															</div>
														)}
													</div>
												);
											})}
										</Flex>
									</Flex>
								)}

								{commonCodeData && commonCodeData.length === 0 && shouldFetchCommonCode && !isLoadingCommonCode && (
									<div style={{ padding: 16, color: '#999', fontStyle: 'italic' }}>
										No common codes found for the provided master codes.
									</div>
								)}
							</Flex>
						</FormFieldset>
					</Form>
				</Flex>

				<Flex>
					<FormSearchContainer
						form={searchForm}
						onRefresh={onFormRefresh}
						onSearch={onFormSearch}
						collapsible
						collapsedSections={[1, 2, 3]}
					>
						<Flex gap={8} vertical>
							<Flex gap={16}>
								<FormInput name="userId" label={'User ID'} max={20} width={250} />
								<FormInput name="username" label={'User Name'} max={20} width={250} />
								<FormInput name="office" label={'Office'} max={20} width={250} />
								<FormSelect
									name="status"
									label={'Status'}
									width={150}
									options={[
										{ label: 'Active', value: 'Y' },
										{ label: 'Inactive', value: 'N' },
									]}
								/>
							</Flex>
						</Flex>
						<Flex gap={8} vertical>
							<Flex gap={16}>
								<FormInput name="userId" label={'User ID'} max={20} width={250} />
								<FormInput name="username" label={'User Name'} max={20} width={250} />
								<FormInput name="office" label={'Office'} max={20} width={250} />
								<FormSelect
									name="status"
									label={'Status'}
									width={150}
									options={[
										{ label: 'Active', value: 'Y' },
										{ label: 'Inactive', value: 'N' },
									]}
								/>
							</Flex>
						</Flex>
						<Flex gap={8} vertical>
							<Flex gap={16}>
								<FormInput name="userId" label={'User ID'} max={20} width={250} />
								<FormInput name="username" label={'User Name'} max={20} width={250} />
								<FormInput name="office" label={'Office'} max={20} width={250} />
								<FormSelect
									name="status"
									label={'Status'}
									width={150}
									options={[
										{ label: 'Active', value: 'Y' },
										{ label: 'Inactive', value: 'N' },
									]}
								/>
							</Flex>
						</Flex>
						<Flex gap={8} vertical>
							<Flex gap={16}>
								<FormInput name="userId" label={'User ID'} max={20} width={250} />
								<FormInput name="username" label={'User Name'} max={20} width={250} />
								<FormInput name="office" label={'Office'} max={20} width={250} />
								<FormSelect
									name="status"
									label={'Status'}
									width={150}
									options={[
										{ label: 'Active', value: 'Y' },
										{ label: 'Inactive', value: 'N' },
									]}
								/>
							</Flex>
						</Flex>
					</FormSearchContainer>
				</Flex>

				{/* Basic Table — with Cross-Page Selection demo (simulated backend pagination, 50 rows) */}
				{crossPageInfo && (
					<div style={{ padding: '8px 16px', background: '#f0f5ff', borderRadius: 4 }}>
						<strong>Cross-Page Selection Debug:</strong>{' '}
						{crossPageInfo.totalSelected} selected, {crossPageInfo.deselectedKeys.length} deselected
					</div>
				)}
				<CustomTable<DataType>
					columns={columns}
					tableFilterForm={tableFilterForm}
					onFilterTableChange={handleFilterChange}
					data={demoPageData.map((item, index) => {
						// Use a global stable key: page offset + index
						const globalIndex = (demoPagination.current - 1) * demoPagination.pageSize + index;
						return { ...item, key: String(globalIndex) };
					})}
					tableState={{
						pagination: {
							current: demoPagination.current,
							pageSize: demoPagination.pageSize,
							total: allData.length,
						},
						rowSelection: basicTableSelectionRows,
					}}
					onPaginationChange={(current, pageSize) => setDemoPagination({ current, pageSize })}
					onSelectChange={(_keys, rows) => setBasicTableSelectionRows(rows)}
					crossPageSelection={{
						enabled: true,
						allKeys: allData.map((_, i) => String(i)),
						onSelectionChange: (info) => {
							setCrossPageInfo(info);
							console.log('Cross-page selection:', info.totalSelected, 'selected');
						},
					}}
					onMultiSortChange={handleMultiSortChange}
				/>

				{/* Editable Table */}
				<Flex justify="end" gap={8}>
					<Button type="primary" onClick={handleGetTableData}>
						Get Table Data
					</Button>
					<AddButton onClick={handleAddRow}>Add User</AddButton>
					<DeleteButton onClick={handleDeleteRow}>Delete User</DeleteButton>
				</Flex>
			<EditCustomTable<DataType>
				form={tableForm}
				columns={editColumns}
				formTableName={'user'}
				data={data.map((item, index) => ({ ...item, key: index }))}
				ref={editTableHandlerRef}
				tableState={{
					rowSelection: selectionRows,
					pagination
				}}
				onSelectChange={handleSelectChange}
			onMultiSortChange={handleMultiSortChange}
			onFilterTableChange={handleEditFilterChange}
			tableFilterForm={editTableFilterForm}
		//noFooter
		/>

				{/* Advanced Table with Header Groups */}
				<CustomTable<Invoice>
					columns={groupColumns}
					data={invoiceData.map((item, index) => ({ ...item, key: index }))}
					tableState={{
						pagination,
					}}
				/>
			</Flex>
		</div >
	);
});

export default DefaultPage;
