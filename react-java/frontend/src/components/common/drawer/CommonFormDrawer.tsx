import React, { type ReactNode } from 'react';
import { Drawer, Flex, Form, type FormInstance } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { Store } from 'antd/es/form/interface';

export interface CommonDrawerProps<T> {
	open: boolean;
	title: string | React.ReactNode;
	width?: number;
	height?: number;
	footer?: React.ReactNode;
	children: React.ReactNode;
	form: FormInstance<T>;
	initialValues?: Store;
	loading?: boolean;
	tableNode?: ReactNode;
	placement?: 'left' | 'right' | 'top' | 'bottom';
	extra?: React.ReactNode;
	onClose: () => void;
	statusLabel?: React.ReactNode;
	forceRender?: boolean;
	onValuesFormChange?: ((changedValues: any, values: T) => void) | undefined
}

export const CommonFormDrawer = <T,>({
	open,
	title,
	width = 720,
	height = 720,
	footer,
	form,
	initialValues,
	children,
	loading,
	tableNode,
	placement = 'right',
	extra,
	onClose,
	statusLabel,
	forceRender = true,
	onValuesFormChange
}: CommonDrawerProps<T>) => {
	return (
		<Drawer
			closable={false}
			title={
				<Flex align="center" gap={12} style={{ width: '100%', minWidth: 0 }}>
					<div className="font-bold text-lg" style={{ flex: statusLabel ? undefined : 1, minWidth: 0 }}>
						{title}
					</div>
					{statusLabel && <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{statusLabel}</div>}
				</Flex>
			}
			width={width}
			height={height}
			onClose={onClose}
			open={open}
			footer={footer}
			destroyOnHidden
			forceRender={forceRender}
			placement={placement}
			loading={loading}
			extra={extra ? extra : <CloseOutlined onClick={onClose} className="text-lg cursor-pointer" />}
		>
			<Flex gap={16} vertical>
				<Form layout="vertical" form={form} initialValues={initialValues} onValuesChange={onValuesFormChange}>
					{children}
				</Form>
				{tableNode}
			</Flex>
		</Drawer>
	);
};
