import { Button, Modal } from 'antd';
import { RedoOutlined } from '@ant-design/icons';
import { useAppTranslate } from '@/hooks';
import { useAppMessage } from '@/hooks/modules';
import { useResendEmail } from '@/hooks/modules';
import { authStore } from '@/stores';

interface ResendEmailButtonProps {
	emlId: string;
}

export const ResendEmailButton: React.FC<ResendEmailButtonProps> = ({ emlId }) => {
	const { t } = useAppTranslate();
	const { message } = useAppMessage();

	const resendMutation = useResendEmail({
		onSuccess: () => {
			message.success(t('Email resent successfully'));
		},
		onError: (err) => {
			message.error(err?.errorMessage || t('Failed to resend email'));
		},
	});

	function handleResend() {
		Modal.confirm({
			title: t('Confirm'),
			content: t('Resend Confirmation'),
			okText: t('Confirm'),
			cancelText: t('Cancel'),
			centered: true,
			onOk: () => {
				resendMutation.mutate({
					coId: authStore.user?.userInfo.coId,
					emlId,
				});
			},
		});
	}

	return (
		<Button
			type="link"
			size="small"
			icon={<RedoOutlined />}
			loading={resendMutation.isPending}
			onClick={handleResend}
		/>
	);
};
