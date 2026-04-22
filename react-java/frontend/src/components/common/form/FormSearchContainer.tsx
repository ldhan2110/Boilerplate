import React, { type CSSProperties, type ReactElement, type ReactNode, type Ref } from 'react';
import { Button, Card, Flex, Form, Space } from 'antd';
import { DownOutlined, ReloadOutlined, UpOutlined } from '@ant-design/icons';
import type { Store } from 'antd/es/form/interface';
import type { FormInstance } from 'antd/lib';
import type { FormProps } from 'react-router-dom';

import { useAppTranslate, useElementSize, useToggle } from '@/hooks';

type FormSearchContainerProps<T> = FormProps & {
	form: FormInstance<T>;
	initialValues?: Store;
	children: ReactElement | ReactNode;
	visible?: boolean;
	timeOut?: number;
	layout?: Parameters<typeof Form>[0]['layout'];
	style?: CSSProperties;
	collapsible?: boolean;
	collapsedSections?: number[]; // indices of children to collapse
	onRefresh: () => void;
	onSearch: () => void;
};

export const FormSearchContainer = <T,>({
	form,
	initialValues,
	children,
	visible,
	timeOut,
	layout,
	collapsible,
	collapsedSections = [],
	onRefresh,
	onSearch,
}: FormSearchContainerProps<T>) => {
	const { t } = useAppTranslate();
	const { isToggle: collapsed, toggle: toggleCollapse } = useToggle(true);
	const [cardRef, cardSize] = useElementSize(visible, timeOut, collapsed);
	const childrenArray = Array.isArray(children) ? children : [children];

	return (
		<Form form={form} initialValues={initialValues} className="w-full !mb-4" layout={layout}>
			<Card
				className="relative"
				ref={cardRef as Ref<HTMLDivElement>}
				styles={{ body: { padding: '12px' } }}
			>
				<span
					className="absolute left-6 z-10"
					style={{
						top: (cardSize as { width: number; height: number }).height - 15,
					}}
				>
					<Space>
						<Button
							size="small"
							shape="circle"
							icon={collapsed ? <DownOutlined /> : <UpOutlined />}
							onClick={toggleCollapse}
							hidden={!collapsible}
						/>
					</Space>
				</span>
				<div
					className="absolute right-6 z-10"
					style={{
						top: (cardSize as { width: number; height: number }).height - 15,
					}}
				>
					<Space>
						<Button size="small" shape="circle" icon={<ReloadOutlined />} onClick={onRefresh} />
						<Button size="small" type="primary" shape="round" onClick={onSearch} htmlType="submit">
							{t('Search')}
						</Button>
					</Space>
				</div>
				<Flex
					vertical
					gap={8}
					style={{
						paddingBottom: 8,
					}}
				>
					{/* Render children and collapse selectively */}
					{/* Render children and collapse selectively */}
					{childrenArray.map((child, index) =>
						collapsedSections.includes(index) ? (
							<Collapsible key={index} collapsed={collapsed}>
								{child}
							</Collapsible>
						) : (
							<div key={index}>{child}</div>
						),
					)}
				</Flex>
			</Card>
		</Form>
	);
};

type CollapsibleProps = {
	collapsed?: boolean;
	children: ReactNode;
	style?: React.CSSProperties;
};

const Collapsible = ({ collapsed = false, children }: CollapsibleProps) => {
	return (
		<div
			style={{
				display: collapsed ? 'none' : 'block',
			}}
		>
			{children}
		</div>
	);
};
