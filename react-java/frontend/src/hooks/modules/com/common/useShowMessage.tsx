import { App } from 'antd';
import { useAppTranslate } from './useAppTranslate';
import { MESSAGE_CODES } from '@/constants';

export function useShowMessage() {
	const { modal } = App.useApp();
	const { t, m } = useAppTranslate();

	const DEFAULT_MODAL_OPTIONS = {
		centered: true,
		closable: true,
		okText: t('Confirm'),
		cancelText: t('Cancel'),
	};

	function showWarningMessage(
		message: string,
		onConfirmCallback?: () => void,
		onCancelCallback?: () => void,
	) {
		modal.warning({
			...DEFAULT_MODAL_OPTIONS,
			title: t('Warning'),
			content: m(message),
			onOk: () => onConfirmCallback?.(),
			onCancel: () => onCancelCallback?.(),
		});
	}

	function showErrorMessage(
		message: string,
		onConfirmCallback?: () => void,
		onCancelCallback?: () => void,
	) {
		modal.error({
			...DEFAULT_MODAL_OPTIONS,
			title: t('Error'),
			content: m(message),
			onOk: () => onConfirmCallback?.(),
			onCancel: () => onCancelCallback?.(),
		});
	}

	function showInfoMessage(
		message: string,
		onConfirmCallback?: () => void,
		onCancelCallback?: () => void,
	) {
		modal.info({
			...DEFAULT_MODAL_OPTIONS,
			title: t('Info'),
			content: m(message),
			onOk: () => onConfirmCallback?.(),
			onCancel: () => onCancelCallback?.(),
		});
	}

	function showConfirmMessage(
		message: string,
		onConfirmCallback?: () => void,
		onCancelCallback?: () => void,
	) {
		modal.confirm({
			...DEFAULT_MODAL_OPTIONS,
			title: t('Confirm'),
			content: <span style={{ whiteSpace: 'pre-line' }}>{m(message)}</span>,
			onOk: () => onConfirmCallback?.(),
			onCancel: () => onCancelCallback?.(),
		});
	}

	function showSuccessMessage(
		message: string,
		onConfirmCallback?: () => void,
		onCancelCallback?: () => void,
	) {
		modal.success({
			...DEFAULT_MODAL_OPTIONS,
			title: t('Success'),
			content: m(message),
			onOk: () => onConfirmCallback?.(),
			onCancel: () => onCancelCallback?.(),
		});
	}

	function showUnsaveChangeMessage(onConfirmCallback?: () => void, onCancelCallback?: () => void) {
		modal.confirm({
			...DEFAULT_MODAL_OPTIONS,
			title: t('Warning'),
			content: m(MESSAGE_CODES.COM000003),
			cancelText: t('Cancel'),
			okText: t('Confirm'),
			onOk: () => onConfirmCallback?.(),
			onCancel: () => onCancelCallback?.(),
		});
	}

	return {
		showWarningMessage,
		showErrorMessage,
		showInfoMessage,
		showConfirmMessage,
		showSuccessMessage,
		showUnsaveChangeMessage,
	};
}
