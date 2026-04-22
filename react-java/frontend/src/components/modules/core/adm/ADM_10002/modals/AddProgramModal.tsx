import React from 'react';
import { App, Col, Flex, Row } from 'antd';

import type { ProgramDto, ProgramTree, ProgramTreeOption } from '@/types';
import {
	FormCheckbox,
	FormInput,
	FormNumberInput,
	FormSelect,
	FormTextArea,
	FormTreeSelect,
} from '@/components/common/form';
import { CommonFormModal } from '@/components/common/modals';
import { MESSAGE_CODES } from '@/constants';
import { useAppForm, useAppTranslate } from '@/hooks';
import { useAddProgram, useGetProgramList } from '@/hooks/modules';
import { authService } from '@/services/auth/authJwtService';
import { authStore } from '@/stores';

type AddProgramModalProps = {
	open: boolean;
	onCancel: () => void;
};

export const AddProgramModal = ({ open, onCancel }: AddProgramModalProps) => {
	const { t, m } = useAppTranslate();
	const form = useAppForm<ProgramDto>({ formName: 'addProgram' });
	const { message } = App.useApp(); // ✅ use the context-aware version

	// Add Program Hooks
	const { mutate: addNewProgram, isPending: isCreating } = useAddProgram({
		onSuccess: () => {
			message.success(m(MESSAGE_CODES.COM000004));
			handleCloseModal();
		},
		onError: (err) => {
			console.log(err);
			message.error(m(err.errorCode || MESSAGE_CODES.SYSMESSAGE));
		},
	});

	// Load Tree Data Options
	const { data: programOptions, isPending: isLoadingOptions } = useGetProgramList({
		pgmTpCd: 'MENU',
		coId: authStore.user?.userInfo.coId,
	});

	// Build Program Tree Options
	const buildProgramTreeOptions = React.useCallback((nodes: ProgramTree[]): ProgramTreeOption[] => {
		const map = new Map<string, ProgramTree>();
		const tree: ProgramTree[] = [];

		// 1. Map all nodes
		nodes.forEach((node) => map.set(node.pgmId!, { ...node }));

		// 2. Build tree
		nodes.forEach((node) => {
			const parentId = node.prntPgmId;
			if (parentId && map.has(parentId)) {
				const parent = map.get(parentId)!;
				// Only create children array if parent has children
				if (!parent.children) parent.children = [];
				parent.children.push(map.get(node.pgmId!)!);
			} else {
				tree.push(map.get(node.pgmId!)!);
			}
		});

		const convertToTreeSelect = (data: ProgramTree[]): ProgramTreeOption[] => {
			return data.map((item) => ({
				title: item.pgmNm!, // what you display
				value: item.pgmId!, // what you store
				children: item.children ? convertToTreeSelect(item.children) : undefined,
			}));
		};

		return convertToTreeSelect(tree);
	}, []);

	// Modals Events
	function handleCloseModal() {
		form.resetFields();
		onCancel();
	}

	function handleBeforeCloseModal() {
		form.checkUnsavedFormChange(handleCloseModal);
	}

	async function handleSave() {
		try {
			const formValues = await form.validateFields();
			addNewProgram({
				coId: authService.getCurrentCompany()!,
				...formValues,
			});
		} catch {
			return;
		}
	}

	return (
		<CommonFormModal
			form={form}
			open={open}
			title="Add Program"
			onCancel={handleBeforeCloseModal}
			onConfirm={handleSave}
			confirmLoading={isCreating}
			destroyOnHidden
			initialValues={{
				dspOrder: 99,
				pgmTpCd: 'UI',
				useFlg: 'Y',
			}}
		>
			<Flex gap={12} className="!mt-4" vertical>
				<Row gutter={[16, 16]}>
					<Col span={19}>
						<FormInput
							name="pgmCd"
							label="Program Code"
							placeholder={t('Input Program Code')}
							required
							maxLength={20}
						/>
					</Col>
					<Col span={4}>
						<Flex align="end" className="h-full">
							<FormCheckbox
								name="useFlg"
								title="Active"
								checkboxMapping={{
									checked: 'Y',
									unchecked: 'N',
								}}
							/>
						</Flex>
					</Col>
				</Row>
				<FormInput
					name="pgmNm"
					label="Program Name"
					placeholder={t('Input Program Name')}
					required
					maxLength={100}
				/>
				<Row gutter={[8, 8]}>
					<Col span={8}>
						<FormSelect
							name="pgmTpCd"
							label="Type"
							placeholder={t('Select Type')}
							allowClear={false}
							options={[
								{ label: 'MENU', value: 'MENU' },
								{ label: 'UI', value: 'UI' },
							]}
						/>
					</Col>
					<Col span={8}>
						<FormTreeSelect
							name="prntPgmId"
							label="Parent Program"
							placeholder={t('Select Parent Program')}
							loading={isLoadingOptions}
							treeData={buildProgramTreeOptions(
								programOptions?.programList?.map((item) => ({ ...item, key: item.treePath! })) ||
									[],
							)}
						/>
					</Col>
					<Col span={8}>
						<FormNumberInput
							name="dspOrder"
							label="Display Order"
							type="number"
							min={1}
							max={9999}
						/>
					</Col>
				</Row>
				<FormTextArea name="pgmRmk" maxLength={500} label="Remark" />
			</Flex>
		</CommonFormModal>
	);
};
