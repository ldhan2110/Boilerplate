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
import { ABILITY_ACTION, ABILITY_SUBJECT, MESSAGE_CODES } from '@/constants';
import { useAppForm, useAppTranslate } from '@/hooks';
import { useGetProgram, useGetProgramList, useUpdateProgram } from '@/hooks/modules';
import { authService } from '@/services/auth/authJwtService';
import { authStore, useRoleManagementStore } from '@/stores';

type ViewProgramModalProps = {
	open: boolean;
	onCancel: () => void;
};

export const ViewProgramModal = ({ open, onCancel }: ViewProgramModalProps) => {
	const { t, m } = useAppTranslate();
	const { message } = App.useApp(); // ✅ use the context-aware version
	const { selectedProgramId } = useRoleManagementStore();
	const { data: programInfo, isPending: isLoading } = useGetProgram({
		coId: authStore.user?.userInfo.coId,
		pgmId: selectedProgramId!,
	});
	const form = useAppForm<Partial<ProgramDto>>({
		formName: 'viewProgram',
		initialValues: programInfo,
	});

	// Update Program Hooks
	const { mutate: updateProgram, isPending: isUpdating } = useUpdateProgram({
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
	const buildProgramTreeOptions = React.useCallback(
		(nodes: ProgramTree[], excludeId: string): ProgramTreeOption[] => {
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

			// Helper: find all descendant ids of the node to exclude
			const getDescendantIds = (node: ProgramTree): string[] => {
				if (!node.children) return [];
				return node.children.reduce<string[]>(
					(acc, child) => [...acc, child.pgmId!, ...getDescendantIds(child)],
					[],
				);
			};

			// Get list of IDs to exclude
			let excludeIds = new Set<string>();
			if (excludeId && map.has(excludeId)) {
				const excludeNode = map.get(excludeId)!;
				excludeIds = new Set([excludeId, ...getDescendantIds(excludeNode)]);
			}

			// Recursive convert, skipping excluded IDs
			const convertToTreeSelect = (data: ProgramTree[]): ProgramTreeOption[] => {
				return data
					.filter((item) => !excludeIds.has(item.pgmId!))
					.map((item) => ({
						title: item.pgmNm!,
						value: item.pgmId!,
						children: item.children ? convertToTreeSelect(item.children) : undefined,
					}));
			};

			return convertToTreeSelect(tree);
		},
		[],
	);

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
			updateProgram({
				pgmId: selectedProgramId!,
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
			title="Program Information"
			onCancel={handleBeforeCloseModal}
			onConfirm={handleSave}
			loading={isLoading}
			confirmLoading={isUpdating}
			destroyOnHidden
			initialValues={programInfo}
			savePermission={{
				action: ABILITY_ACTION.SAVE_PROGRAM,
				subject: ABILITY_SUBJECT.ROLE_MANAGEMENT,
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
							disabled
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
								selectedProgramId!,
							)}
							rules={[
								{
									validator: (_, value) => {
										// If type is UI, required Parent Programs
										const type = form.getFieldValue('pgmTpCd');
										if (type === 'UI' && !value) {
											return Promise.reject(new Error(m(MESSAGE_CODES.COM000002)));
										}
										return Promise.resolve();
									},
								},
							]}
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
