import { useToast } from "primevue/usetoast";

export function useAppToast() {
    const { t } = useI18n(); 
    const toast = useToast();

    function showSuccess(message: string) {
        toast.add({ severity: 'success', summary: t('Success'), detail: message, life: 3000 });
    }

    function showError(message: string) {
        toast.add({ severity: 'error', summary: t('Error'), detail: message, life: 3000 });
    }

    function showInfo(message: string) {
        toast.add({ severity: 'info', summary: t('Info'), detail: message, life: 3000 });
    }

    function showWarning(message: string) { 
        toast.add({ severity: 'warn', summary: t('Warning'), detail: message, life: 3000 });
    }

    function showMessage(severity: 'success' | 'error' | 'info' | 'warn', message: string) {
        toast.add({ severity, summary: t(severity.charAt(0).toUpperCase() + severity.slice(1)), detail: message, life: 3000 });
    }

    return {
        showSuccess,
        showError,
        showInfo,
        showWarning,
        showMessage
    };
}