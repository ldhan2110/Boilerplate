import React, { useEffect, useState } from 'react';
import { Tree, type TreeProps } from 'antd';

import type { PermissionDto, ProgramDto, ProgramTree } from '@/types';
import { VIEW_PERMISSION_CODE } from '@/constants';
import { useRoleManagementStore } from '@/stores';

type ProgramTreeListProps = {
	treeData: ProgramTree[];
	programList: ProgramDto[];
	permissionList: PermissionDto[];
};

export const ProgramTreeList = ({
	treeData,
	programList,
	permissionList,
}: ProgramTreeListProps) => {
	const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);

	// Zustand Stores
	const roleAuthList = useRoleManagementStore((state) => state.roleAuthList);
	const setSelectedRoleProgram = useRoleManagementStore((state) => state.setSelectedRoleProgram);
	const addRoleAuth = useRoleManagementStore((state) => state.addRoleAuth);
	const removeRoleAuth = useRoleManagementStore((state) => state.removeRoleAuth);

	useEffect(() => {
		const checked = new Set();
		roleAuthList.forEach((auth) => {
			if (auth.permCd == VIEW_PERMISSION_CODE) {
				const pgm = programList.find((item) => item.pgmId == auth.pgmId);
				checked.add(pgm?.treeKey);
			}
		});
		setCheckedKeys(Array.from(checked) as React.Key[]);
	}, [programList, roleAuthList]);

	const onSelectTree: TreeProps['onSelect'] = (_selectedKeys, { node }) => {
		setSelectedRoleProgram(node as ProgramTree);
	};

	/** Helper: get all child keys recursively */
	const getAllChildKeys = (node: ProgramTree): React.Key[] => {
		if (!node.children) return [];
		return node.children.flatMap((child: ProgramTree) => [child.key, ...getAllChildKeys(child)]);
	};

	/** Helper: find parent key recursively */
	const findAllParentKeys = (
		key: React.Key,
		data = treeData,
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

	const onCheckedTree: TreeProps['onCheck'] = (_checkedKeys, info) => {
		const { node, checked: isChecked } = info;
		const newChecked = new Set(checkedKeys);
		const unchecked = new Set();
		const allChildKeys = getAllChildKeys(node as ProgramTree);

		setSelectedRoleProgram(node as ProgramTree);

		if (isChecked) {
			// ✅ if user checked parent
			newChecked.add(node.key);
			allChildKeys.forEach((k) => newChecked.add(k));

			// ✅ if user checked child, ensure parent checked
			const parentKeys = findAllParentKeys(node.key);
			parentKeys.forEach((item) => newChecked.add(item));

			// Auto ✅ the "VIEW" permission
			const checkedProgram = programList.filter((pgm) => newChecked.has(pgm.treeKey as string));

			checkedProgram.forEach((pgm) => {
				const viewPerm = permissionList.find(
					(perm) => perm.pgmId === pgm.pgmId && perm.permCd === VIEW_PERMISSION_CODE,
				);
				if (viewPerm) {
					addRoleAuth([pgm.pgmId!], { ...viewPerm, activeYn: 'Y' });
				}
			});
		} else {
			// ❌ if user unchecked parent, uncheck all children
			newChecked.delete(node.key);
			unchecked.add(node.key);
			allChildKeys.forEach((k) => {
				newChecked.delete(k);
				unchecked.add(k);
			});
			// ❌ if user unchecked child -> parent unaffected

			// Auto uncheck the "VIEW" permission
			const uncheckedProgram = programList.filter((pgm) => unchecked.has(pgm.treeKey as string));

			uncheckedProgram.forEach((pgm) => {
				const viewPerm = permissionList.find(
					(perm) => perm.pgmId === pgm.pgmId && perm.permCd === VIEW_PERMISSION_CODE,
				);
				if (viewPerm) {
					removeRoleAuth([pgm.pgmId!], { ...viewPerm, activeYn: 'N' });
				}
			});
		}
		setCheckedKeys(Array.from(newChecked));
	};

	return (
		<Tree
			style={{
				backgroundColor: '#F5F4F4',
			}}
			showIcon
			showLine
			checkStrictly
			checkable
			onSelect={onSelectTree}
			onCheck={onCheckedTree}
			treeData={treeData}
			defaultExpandAll={true}
			checkedKeys={checkedKeys}
		/>
	);
};
