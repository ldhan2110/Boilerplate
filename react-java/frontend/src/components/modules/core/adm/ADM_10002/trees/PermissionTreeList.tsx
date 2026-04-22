import React, { type ReactNode, useCallback, useEffect, useState } from 'react';
import { Tree, type TreeProps } from 'antd';

import type { PermissionDto, ProgramDto, ProgramTree, RoleAuthDto } from '@/types';
import { VIEW_PERMISSION_CODE } from '@/constants';
import { useRoleManagementStore } from '@/stores';

type PermissionTreeListProps = {
	treeData: PermissionDto[];
	programList: ProgramDto[];
	treeProgramData: ProgramTree[];
};

type PermissionTree = PermissionDto & {
	key: React.Key | string;
	title?: string;
	children?: PermissionTree[];
	icon?: ReactNode;
};

export const PermissionTreeList = ({
	treeData,
	programList,
	treeProgramData,
}: PermissionTreeListProps) => {
	const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);

	// ===================== ZUSTAND ===================
	const selectedRoleProgram = useRoleManagementStore((state) => state.selectedRoleProgram);
	const roleAuthList = useRoleManagementStore((state) => state.roleAuthList);
	const addRoleAuth = useRoleManagementStore((state) => state.addRoleAuth);
	const removeRoleAuth = useRoleManagementStore((state) => state.removeRoleAuth);

	useEffect(() => {
		if (treeData.length != 0) {
			const checkedItem = ((treeData as PermissionTree[]) ?? [])
				.filter((item) => {
					const index = roleAuthList.findIndex(
						(auth) => auth.pgmId == item.pgmId && auth.permCd == item.permCd,
					);
					return index != -1;
				})
				.map((item: PermissionTree) => item.permId as React.Key);

			// 🔒 Ensure only visible permission keys remain
			setCheckedKeys(checkedItem);
		}
	}, [roleAuthList, selectedRoleProgram, treeData]);

	function cleanUpCheckedKeys(checkedKeys: React.Key[]) {
		const pgmPermList = treeData.filter((item) => item.pgmId == selectedRoleProgram?.pgmId);
		return checkedKeys.filter((key) => pgmPermList.findIndex((pgm) => pgm.permId == key) != -1);
	}

	/** Helper: get all child keys recursively */
	const getAllChildKeys = (node: ProgramTree): React.Key[] => {
		if (!node.children) return [];
		return node.children.flatMap((child: ProgramTree) => [child.key, ...getAllChildKeys(child)]);
	};

	/** Helper: find parent key recursively */
	const findAllParentKeys = (
		key: React.Key,
		data = treeProgramData,
		parents: React.Key[] = [],
	): React.Key[] => {
		for (const item of data) {
			// If found, return accumulated parent keys
			if (item.key === key) return parents;

			if (item.children) {
				// Recursively search in children
				const found = findAllParentKeys(key, item.children, [...parents, item.key]);
				if (found.length) return found;
			}
		}
		return [];
	};

	/** Helper: find parent key recursively */
	function findNodeByPgmId(treeList: ProgramTree[], targetPgmId: string): ProgramTree | undefined {
		for (const node of treeList) {
			if (node.pgmId === targetPgmId) return node;

			if (node.children?.length) {
				const found = findNodeByPgmId(node.children, targetPgmId);
				if (found) return found;
			}
		}
		return undefined;
	}

	const onCheck: TreeProps['onCheck'] = (_checkedKeys, info) => {
		const { node, checked: isChecked } = info;

		if (isChecked) {
			const perm = node as PermissionDto;
			const program = findNodeByPgmId(treeProgramData, perm.pgmId!);

			// Add the checked permission for the selected program
			addRoleAuth([perm.pgmId!], { ...node } as RoleAuthDto);

			// Ensure parent programs have VIEW permission checked
			const parentKeys = findAllParentKeys(program?.treeKey as React.Key);
			const parentPrograms = programList.filter((pgm) => parentKeys.includes(pgm.treeKey as string));
			parentPrograms.forEach((pgm) => {
				const viewPerm = treeData.find(
					(p) => p.pgmId === pgm.pgmId && p.permCd === VIEW_PERMISSION_CODE,
				);
				if (viewPerm) {
					addRoleAuth([pgm.pgmId!], { ...viewPerm, activeYn: 'Y' } as RoleAuthDto);
				}
			});
		} else {
			const perm = node as PermissionDto;
			const program = findNodeByPgmId(treeProgramData, perm.pgmId!);
			const allChildKeys = getAllChildKeys(program as ProgramTree);

			// Remove the unchecked permission for the selected program and its children
			const uncheckedKeys = new Set([program!.treeKey, ...allChildKeys]);
			const uncheckedProgram = programList.filter((pgm) =>
				uncheckedKeys.has(pgm.treeKey as string),
			);
			uncheckedProgram.forEach((pgm) => {
				const matchPerm = treeData.find(
					(p) => p.pgmId === pgm.pgmId && p.permCd === perm.permCd,
				);
				if (matchPerm) {
					removeRoleAuth([pgm.pgmId!], { ...matchPerm, activeYn: 'N' });
				}
			});
		}
	};

	const buildPermissionTree = useCallback(
		(nodes: PermissionDto[]): PermissionTree[] => {
			const map = new Map<string, PermissionTree>();
			const tree: PermissionTree[] = [];

			// 1. Map all nodes
			nodes.forEach((node) =>
				map.set(node.permId!, { ...node, key: node.permId as string, title: node.permNm }),
			);

			// 2. Build tree
			nodes.forEach((node) => {
				tree.push(map.get(node.permId!)!);
			});

			return tree.filter((leaf) => leaf.pgmId == selectedRoleProgram?.pgmId);
		},
		[selectedRoleProgram?.pgmId],
	);

	return (
		<Tree
			checkable
			// style={{
			// 	backgroundColor: '#F5F4F4',
			// }}
			treeData={buildPermissionTree(
				treeData.map((item) => ({
					...item,
					key: item.permId,
				})),
			)}
			checkedKeys={cleanUpCheckedKeys(checkedKeys)}
			onCheck={onCheck}
			defaultExpandAll
		/>
	);
};
