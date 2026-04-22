/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { type ReactNode } from 'react';
import { Button, Modal, type ModalProps } from 'antd';
import type { Store } from 'antd/es/form/interface';
import type { FormInstance } from 'antd/lib';

import type { SearchModalProps } from '@/types';
import { FormSearchContainer } from '../form';
import { useAppTranslate } from '@/hooks';

type CommonSearchModalProps<T> = ModalProps &
	Partial<SearchModalProps<T>> & {
		title: string;
		open: boolean;
		form: FormInstance<T>;
		initialValues?: Store;
		fieldName: string;
		fieldValue: unknown;
		filterNode: ReactNode;
		tableNode: ReactNode;
		onSearch: (value: unknown) => void;
		onReset?: () => void;
		onConfirm: () => void;
		onCancel: () => void;
	};

export const CommonSearchModal = <T,>({
	open,
	title,
	width,
	selectType,
	form,
	initialSearchValues,
	fieldName,
	fieldValue,
	filterNode,
	tableNode,
	onSearch,
	onConfirm,
	onCancel,
	onReset,
	...props
}: CommonSearchModalProps<T>) => {
	const { t } = useAppTranslate();

	// Only trigger search if modal is single
	React.useEffect(() => {
		if (fieldValue && selectType == 'single') {
			form.setFieldValue(fieldName as any, fieldValue);
			setTimeout(handleSearch, 300);
		}
	}, [open]);

	function handleCloseModal() {
		form.resetFields();
		onCancel?.();
	}

	function handleReset() {
		form.resetFields();
		setTimeout(onSearch, 100);
		onReset?.();
	}

	function handleSearch() {
		const filterValue = form.getFieldsValue();
		onSearch(filterValue);
	}

	return (
		<Modal
			title={t(title)}
			open={open}
			onOk={onConfirm}
			onCancel={handleCloseModal}
			okText="Select"
			cancelText="Close"
			centered
			width={width || '65%'}
			destroyOnHidden
			footer={
				selectType == 'single'
					? null
					: [
						<Button key="close" onClick={handleCloseModal}>
							Close
						</Button>,
						<Button key="submit" type="primary" onClick={onConfirm}>
							Select
						</Button>,
					]
			}
			{...props}
		>
			<>
				<FormSearchContainer
					form={form}
					initialValues={initialSearchValues}
					visible={open}
					timeOut={300}
					onRefresh={handleReset}
					onSearch={handleSearch}
				>
					{filterNode}
				</FormSearchContainer>

				{tableNode}
			</>
		</Modal>
	);
};
