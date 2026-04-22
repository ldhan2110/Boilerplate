import { Button, Flex, Modal } from 'antd';
import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';
import { DeleteOutlined, RedoOutlined } from '@ant-design/icons';

import { PermissionGate } from '@/components/common';
import { DeleteButton } from '@/components/common/buttons';
import { EmailFilter, EmailTable, SendEmailButton } from '@/components/modules/core/sys';
import { ABILITY_ACTION, ABILITY_SUBJECT } from '@/constants';
import { useAppTranslate } from '@/hooks';
import { useAppMessage, useDeleteEmails, useResendEmails } from '@/hooks/modules';
import type { EmailFilterValues } from '@/components/modules/core/sys/SYS_EML_0001/filters/EmailFilter';
import type { EmailListDto } from '@/services/api/core/sys/email/getEmailList.service';

const SYS_EML_0001 = observer(() => {
	const { t } = useAppTranslate();
	const { message } = useAppMessage();
	const [filterValues, setFilterValues] = useState<EmailFilterValues>({});
	const [selectedRows, setSelectedRows] = useState<EmailListDto[]>([]);

	const tableFilterValues = useMemo(() => {
		const { dateRange, ...rest } = filterValues;
		return {
			...rest,
			fromDate: dateRange?.[0]?.format('YYYY-MM-DD'),
			toDate: dateRange?.[1]?.format('YYYY-MM-DD'),
		};
	}, [filterValues]);

	const deleteMutation = useDeleteEmails({
		onSuccess: () => {
			message.success(t('Emails deleted successfully'));
			setSelectedRows([]);
		},
		onError: () => {
			message.error(t('Failed to delete emails'));
		},
	});

	const resendMutation = useResendEmails({
		onSuccess: () => {
			message.success(t('Emails resent successfully'));
			setSelectedRows([]);
		},
		onError: () => {
			message.error(t('Failed to resend emails'));
		},
	});

	const selectedErrorRows = selectedRows.filter((row) => row.emlSndStsCd === 'ERROR');

	function handleDelete() {
		Modal.confirm({
			title: t('Confirm'),
			content: t('Are you sure you want to delete the selected emails?'),
			okText: t('Confirm'),
			cancelText: t('Cancel'),
			centered: true,
			onOk: () => {
				const emlIds = selectedRows.map((row) => row.emlId);
				deleteMutation.mutate(emlIds);
			},
		});
	}

	function handleBulkResend() {
		Modal.confirm({
			title: t('Confirm'),
			content: t('Are you sure you want to resend the selected failed emails?'),
			okText: t('Confirm'),
			cancelText: t('Cancel'),
			centered: true,
			onOk: () => {
				const emlIds = selectedErrorRows.map((row) => row.emlId);
				resendMutation.mutate(emlIds);
			},
		});
	}

	function handleSelectChange(_selectedRowKeys: React.Key[], rows: EmailListDto[]) {
		setSelectedRows(rows);
	}

	return (
		<PermissionGate
			permissions={[
				{
					ability: ABILITY_ACTION.VIEW,
					entity: ABILITY_SUBJECT.EMAIL_MANAGEMENT,
				},
			]}
		>
			<Flex vertical gap={8}>
				<EmailFilter
					onSearch={(values) => setFilterValues(values)}
					onRefresh={() => setFilterValues({})}
				/>
				<Flex justify="end">
					<Flex gap={8}>
						<DeleteButton
							icon={<DeleteOutlined />}
							hidden={selectedRows.length === 0}
							loading={deleteMutation.isPending}
							onClick={handleDelete}
						>
							{t('Delete')}
						</DeleteButton>
						<Button
							icon={<RedoOutlined />}
							hidden={selectedErrorRows.length === 0}
							loading={resendMutation.isPending}
							onClick={handleBulkResend}
						>
							{t('Resend')} ({selectedErrorRows.length})
						</Button>
						<SendEmailButton />
					</Flex>
				</Flex>
				<EmailTable
					filterValues={tableFilterValues}
					selectedRows={selectedRows}
					onSelectChange={handleSelectChange}
				/>
			</Flex>
		</PermissionGate>
	);
});

export default SYS_EML_0001;
