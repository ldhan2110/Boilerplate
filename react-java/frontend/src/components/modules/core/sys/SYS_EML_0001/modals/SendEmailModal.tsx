import { useState } from 'react';
import { Button, Form, Modal, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';

import { FormInput, FormRichEditor } from '@/components/common';
import { useAppForm, useAppTranslate } from '@/hooks';
import { useAppMessage, useSendEmail } from '@/hooks/modules';

interface SendEmailModalProps {
	open: boolean;
	onClose: () => void;
}

export const SendEmailModal: React.FC<SendEmailModalProps> = ({ open, onClose }) => {
	const { t } = useAppTranslate();
	const { message } = useAppMessage();
	const form = useAppForm({ formName: 'sendEmail' });
	const [fileList, setFileList] = useState<UploadFile[]>([]);

	const sendMutation = useSendEmail({
		onSuccess: () => {
			message.success(t('Email sent successfully'));
			handleClose();
		},
		onError: (err) => {
			message.error(err?.errorMessage || t('Failed to send email'));
		},
	});

	function handleClose() {
		form.resetFields();
		setFileList([]);
		onClose();
	}

	async function handleSend() {
		try {
			const values = await form.validateFields();
			const attachments = fileList.map((f) => f.originFileObj as File);
			sendMutation.mutate({
				to: values.to,
				cc: values.cc,
				bcc: values.bcc,
				subject: values.subject,
				htmlContent: values.htmlContent,
				attachments,
			});
		} catch {
			// validation failed
		}
	}

	return (
		<Modal
			title={t('New Email')}
			open={open}
			onCancel={handleClose}
			width={800}
			destroyOnHidden
			footer={[
				<Button key="cancel" onClick={handleClose}>
					{t('Cancel')}
				</Button>,
				<Button
					key="send"
					type="primary"
					loading={sendMutation.isPending}
					onClick={handleSend}
				>
					{t('Send')}
				</Button>,
			]}
		>
			<Form form={form} layout="vertical" validateTrigger="onBlur">
				<FormInput
					name="to"
					label={t('To')}
					required
					placeholder={t('Enter recipient email addresses, separated by commas')}
				/>
				<FormInput name="cc" label={t('CC')} placeholder={t('CC')} />
				<FormInput name="bcc" label={t('BCC')} placeholder={t('BCC')} />
				<FormInput name="subject" label={t('Subject')} placeholder={t('Subject')} />

				<Form.Item label={t('Attachments')}>
					<Upload
						fileList={fileList}
						onChange={({ fileList: newFileList }) => setFileList(newFileList)}
						beforeUpload={() => false}
						multiple
					>
						<Button icon={<UploadOutlined />}>{t('Upload')}</Button>
					</Upload>
				</Form.Item>

				<FormRichEditor
					name="htmlContent"
					label={t('Content')}
					buttonType="full"
					height={300}
				/>
			</Form>
		</Modal>
	);
};
