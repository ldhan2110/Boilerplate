import { Button, Col, Flex, Form, Input, Row } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

import { useAppTranslate } from '@/hooks';

type BatchJobParamsEditorProps = {
	name?: string;
	disabled?: boolean;
};

export const BatchJobParamsEditor = ({
	name = 'jobParamsList',
	disabled = false,
}: BatchJobParamsEditorProps) => {
	const { t } = useAppTranslate();
	const form = Form.useFormInstance();

	return (
		<div>
			<Flex justify="space-between" align="center" className="mb-2">
				<span className="font-medium">{t('Parameters')}</span>
			</Flex>
			<Form.List name={name}>
				{(fields, { add, remove }) => (
					<>
						{fields.map(({ key, name: fieldName, ...restField }) => (
							<Row key={key} gutter={8} align="middle" className="mb-2">
								<Col span={10}>
									<Form.Item
										{...restField}
										name={[fieldName, 'paramKey']}
										rules={[
											{ required: true, message: t('Parameter Key is required') },
											{
												validator: (_, value) => {
													if (value === 'runDt') {
														return Promise.reject(
															new Error(t('runDt is a reserved parameter'))
														);
													}
													const allParams = form.getFieldValue(name) || [];
													const duplicates = allParams.filter(
														(p: { paramKey: string }) => p?.paramKey === value
													);
													if (value && duplicates.length > 1) {
														return Promise.reject(
															new Error(t('Duplicate parameter key'))
														);
													}
													return Promise.resolve();
												},
											},
										]}
										className="!mb-0"
									>
										<Input placeholder={t('Parameter Key')} disabled={disabled} />
									</Form.Item>
								</Col>
								<Col span={11}>
									<Form.Item
										{...restField}
										name={[fieldName, 'paramValue']}
										className="!mb-0"
									>
										<Input placeholder={t('Parameter Value')} disabled={disabled} />
									</Form.Item>
								</Col>
								<Col span={3}>
									{!disabled && (
										<MinusCircleOutlined
											className="text-red-500 cursor-pointer"
											onClick={() => remove(fieldName)}
										/>
									)}
								</Col>
							</Row>
						))}
						{!disabled && (
							<Button
								type="dashed"
								onClick={() => add()}
								block
								icon={<PlusOutlined />}
							>
								{t('Add Parameter')}
							</Button>
						)}
					</>
				)}
			</Form.List>
		</div>
	);
};
