import { useConfirm } from "primevue/useconfirm";

export type DialogType = 'success' | 'info' | 'warning' | 'error';

export interface DialogButton {
    label?: string;
    severity?: 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast';
    outlined?: boolean;
    icon?: string;
}

export interface DialogOptions {
    header?: string;
    message: string;
    icon?: string;
    acceptButton?: DialogButton;
    rejectButton?: DialogButton | false;
    onAccept?: () => void;
    onReject?: () => void;
}

const DIALOG_CONFIG: Record<DialogType, { icon: string; severity: DialogButton['severity'] }> = {
    success: { icon: 'pi pi-check-circle', severity: 'success' },
    info: { icon: 'pi pi-info-circle', severity: 'info' },
    warning: { icon: 'pi pi-exclamation-triangle', severity: 'warn' },
    error: { icon: 'pi pi-times-circle', severity: 'danger' },
};

export function useAppDialog() {
    const { t } = useI18n();
    const confirm = useConfirm();

    function show(type: DialogType, options: DialogOptions) {
        const config = DIALOG_CONFIG[type];
        const hideReject = options.rejectButton === false;
        const rejectButton = hideReject ? undefined : options.rejectButton;

        confirm.require({
            group: 'app-dialog',
            header: options.header ?? t(`dialog.${type}`),
            message: options.message,
            icon: options.icon ?? config.icon,
            acceptLabel: options.acceptButton?.label ?? t('dialog.ok'),
            rejectLabel: hideReject ? ' ' : ((options.rejectButton as any)?.label ?? t('dialog.cancel')),
            acceptProps: {
                severity: options.acceptButton?.severity ?? config.severity,
                outlined: options.acceptButton?.outlined,
                icon: options.acceptButton?.icon,
            },
            rejectProps: {
                severity: options.rejectButton ? options.rejectButton.severity ?? 'secondary' : 'secondary',
                outlined: options.rejectButton ? options.rejectButton.outlined ?? true : true,
                icon: options.rejectButton ? options.rejectButton.icon : undefined,
                style: hideReject ? 'display: none' : undefined,
            },
            accept: () => options.onAccept?.(),
            reject: () => options.onReject?.(),
        });
    }

    function success(options: DialogOptions) {
        show('success', { rejectButton: false, ...options });
    }

    function info(options: DialogOptions) {
        show('info', { rejectButton: false, ...options });
    }

    function warning(options: DialogOptions) {
        show('warning', { rejectButton: false, ...options });
    }

    function error(options: DialogOptions) {
        show('error', { rejectButton: false, ...options });
    }

    function confirm_(options: Omit<DialogOptions, 'rejectButton'> & { rejectButton?: DialogButton }) {
        show('warning', {
            header: options.header ?? t('common.confirmHeader'),
            message: options.message,
            icon: options.icon ?? 'pi pi-exclamation-triangle',
            acceptButton: {
                label: options.acceptButton?.label ?? t('common.continue'),
                severity: options.acceptButton?.severity ?? 'danger',
                ...options.acceptButton,
            },
            rejectButton: {
                label: options.rejectButton?.label ?? t('common.cancel'),
                severity: 'secondary',
                outlined: true,
                ...options.rejectButton,
            },
            onAccept: options.onAccept,
            onReject: options.onReject,
        });
    }

    function confirmAsync(options: Omit<DialogOptions, 'onAccept' | 'onReject' | 'rejectButton'> & { rejectButton?: DialogButton }): Promise<boolean> {
        return new Promise((resolve) => {
            confirm_({
                ...options,
                onAccept: () => resolve(true),
                onReject: () => resolve(false),
            });
        });
    }

    return {
        show,
        success,
        info,
        warning,
        error,
        confirm: confirm_,
        confirmAsync,
    };
}
