import React from 'react';
import { Form } from 'antd';
import { useShowMessage } from './useShowMessage';
import { deepEqual } from '@/utils/helper';
import type { AppForm, Loose } from '@/types';
import { useTabsStore } from '@/stores';

type AppFormProps<T> = {
	formName: string;
	initialValues?: Loose<T>;
	tabKey?: string;
	isWatching?: boolean;
};

export function useAppForm<T>({
	formName,
	initialValues,
	tabKey,
	isWatching,
}: AppFormProps<T>): AppForm {
	const [form] = Form.useForm();
	const initialValuesRef = React.useRef<Loose<T>>(initialValues);
	const { showUnsaveChangeMessage } = useShowMessage();

	// merge your helpers into form instance
	const appForm = Object.assign(form, {
		formName: formName,
		resetInitialFieldsValue,
		setInitialFieldsValue,
		snapshotCurrentAsInitial,
		getInitFormValues,
		checkUnsavedFormChange,
		checkFormChange,
	});

	// Zustand Stores
	const addWatchFormList = useTabsStore((state) => state.addWatchFormList);

	React.useEffect(() => {
		if (isWatching) {
			addWatchFormList(tabKey!, appForm);
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isWatching]);

	React.useEffect(() => {
		form.setFieldsValue(initialValues);
		initialValuesRef.current = initialValues;

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initialValues]);

	function setInitialFieldsValue(initialValues: Loose<T>) {
		form.setFieldsValue(initialValues);
		initialValuesRef.current = initialValues;
	}

	/**
	 * Returns the initial form values (snapshot when form was set).
	 * Use with form.getFieldsValue(true) for comparison to detect changes.
	 */
	function getInitFormValues(): Loose<T> {
		return { ...initialValuesRef.current } as Loose<T>;
	}

	function snapshotCurrentAsInitial() {
		initialValuesRef.current = form.getFieldsValue();
	}

	function checkUnsavedFormChange(callback?: () => void) {
		const currentValue = form.getFieldsValue() as Loose<T>;
		if (!deepEqual(currentValue, initialValuesRef.current) && form.isFieldsTouched()) {
			showUnsaveChangeMessage(callback);
			return false;
		}
		callback?.();
		return true;
	}

	function checkFormChange(): boolean {
		const currentValue = form.getFieldsValue() as Loose<T>;
		// Only return true if values actually changed (not just touched)
		if (!deepEqual(currentValue, initialValuesRef.current)) {
			return true;
		}
		return false;
	}

	function resetInitialFieldsValue() {
		form.setFieldsValue(initialValuesRef.current);
	}

	return appForm;
}
