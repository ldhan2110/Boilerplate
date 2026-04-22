import { Button, Descriptions, List, Modal, Tag, Typography } from 'antd';
import { useAppTranslate } from '@/hooks';
import { useGetEmail } from '@/hooks/modules';
import { downloadFileAndSave } from '@/services/api/core';
import { authStore } from '@/stores';
import { formatDate } from '@/utils/helper';
import { ResendEmailButton } from '../buttons';

interface EmailDetailModalProps {
	open: boolean;
	emlId: string;
	onClose: () => void;
}

export const EmailDetailModal: React.FC<EmailDetailModalProps> = ({ open, emlId, onClose }) => {
	const { t } = useAppTranslate();

	const { data: emailDetail, isLoading } = useGetEmail(
		{ coId: authStore.user?.userInfo.coId, emlId },
		open && !!emlId,
	);

	const statusColorMap: Record<string, string> = {
		SUCCESS: 'green',
		ERROR: 'red',
		PENDING: 'orange',
	};

	return (
		<Modal
			title={t('Email Detail')}
			open={open}
			onCancel={onClose}
			width={800}
			loading={isLoading}
			footer={[
				emailDetail?.emlSndStsCd === 'ERROR' && (
					<ResendEmailButton key="resend" emlId={emlId} />
				),
				<Button key="close" onClick={onClose}>
					{t('Close')}
				</Button>,
			].filter(Boolean)}
		>
			{emailDetail && (
				<>
					<Descriptions column={2} bordered size="small">
						<Descriptions.Item label={t('To')} span={2}>
							{emailDetail.emlTo}
						</Descriptions.Item>
						<Descriptions.Item label={t('CC')} span={2}>
							{emailDetail.emlCc}
						</Descriptions.Item>
						<Descriptions.Item label={t('BCC')} span={2}>
							{emailDetail.emlBcc}
						</Descriptions.Item>
						<Descriptions.Item label={t('Subject')} span={2}>
							{emailDetail.emlSubjVal || <i>{t('No Subject')}</i>}
						</Descriptions.Item>
						<Descriptions.Item label={t('Status')}>
							<Tag color={statusColorMap[emailDetail.emlSndStsCd] || 'default'}>
								{emailDetail.emlSndStsCd}
							</Tag>
						</Descriptions.Item>
						<Descriptions.Item label={t('Sent Date')}>
							{formatDate(emailDetail.creDt, true)}
						</Descriptions.Item>
						<Descriptions.Item label={t('Created By')}>
							{emailDetail.creUsrId}
						</Descriptions.Item>
						{emailDetail.emlSysMsg && (
							<Descriptions.Item label={t('Error Message')} span={2}>
								<Typography.Text type="danger">{emailDetail.emlSysMsg}</Typography.Text>
							</Descriptions.Item>
						)}
					</Descriptions>

					<div style={{ marginTop: 16 }}>
						<Typography.Text strong>{t('Attachments')}</Typography.Text>
						{emailDetail.attachments && emailDetail.attachments.length > 0 ? (
							<List
								size="small"
								dataSource={emailDetail.attachments}
								renderItem={(item) => (
									<List.Item>
										<Typography.Link
											onClick={() =>
												downloadFileAndSave(
													item.fileId,
													item.fileNm,
													authStore.user?.userInfo.coId,
												)
											}
										>
											{item.fileNm} ({item.fileTp?.toUpperCase()})
										</Typography.Link>
									</List.Item>
								)}
							/>
						) : (
							<div style={{ marginTop: 8, fontStyle: 'italic', color: '#999' }}>
								{t('No Attachments')}
							</div>
						)}
					</div>

					<div style={{ marginTop: 16 }}>
						<Typography.Text strong>{t('Content Preview')}</Typography.Text>
						{emailDetail.emlCntnVal ? (
							<iframe
								sandbox="allow-same-origin"
								srcDoc={emailDetail.emlCntnVal}
								style={{
									width: '100%',
									minHeight: 200,
									maxHeight: 400,
									border: '1px solid #d9d9d9',
									marginTop: 8,
								}}
							/>
						) : (
							<div style={{ marginTop: 8, fontStyle: 'italic', color: '#999' }}>
								{t('No Content')}
							</div>
						)}
					</div>
				</>
			)}
		</Modal>
	);
};
