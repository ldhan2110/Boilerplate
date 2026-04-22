import { useMemo } from 'react';
import { Form } from 'antd';
import type { Rule } from 'antd/es/form';
import type { FormItemProps } from 'antd/lib';

import { DEFAULT_BUTTONS, FULL_BUTTONS, MINIMAL_BUTTONS, RichEditor, type RichEditorProps } from '@/components/common/input/rich-editor';
import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';

type FormRichEditorProps = Omit<RichEditorProps, 'value' | 'onChange'> &
	FormItemProps & {
		/** Custom width for the form item */
		buttonType?: 'default' | 'minimal' | 'full';
		width?: string | number;
	};

/**
 * FormRichEditor - A rich text editor wrapped in Ant Design Form.Item
 *
 * @component
 * @example
 * ```tsx
 * <Form>
 *   <FormRichEditor
 *     name="content"
 *     label="Content"
 *     required
 *     placeholder="Enter your content..."
 *   />
 * </Form>
 * ```
 */
export const FormRichEditor = ({
	name,
	label,
	required,
	placeholder,
	rules,
	initialValue,
	width,
	height = 250,
	buttonType = 'default',
	...props
}: FormRichEditorProps) => {
	const { m } = useAppTranslate();

	const mappedRule: Rule[] = useMemo(() => {
		if (required)
			return [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])];
		return rules || ([] as Rule[]);
	}, [required, rules, m]);

	return (
		<Form.Item
			name={name}
			label={label}
			required={required}
			validateTrigger="onBlur"
			rules={mappedRule}
			initialValue={initialValue}
			style={{
				width: width || '100%',
			}}
		>
			<RichEditor placeholder={placeholder} height={height} buttons={buttonType === 'default' ? DEFAULT_BUTTONS : buttonType === 'minimal' ? MINIMAL_BUTTONS : FULL_BUTTONS} {...props} />
		</Form.Item>
	);
};
