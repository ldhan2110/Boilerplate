import { useMemo } from 'react';
import { Form } from 'antd';
import type { Rule } from 'antd/es/form';
import type { FormItemProps } from 'antd/lib';
import { ImageViewer, type ImageViewerProps } from '@/components/common/input';

import { MESSAGE_CODES } from '@/constants';
import { useAppTranslate } from '@/hooks';

type FormImageViewerProps = Omit<ImageViewerProps, 'value' | 'onChange'> &
	FormItemProps & {
		// fileId prop is separate from form value - used for displaying existing images from backend
		fileId?: string;
		width?: number | string;
		fileCoId?: string;
	};

export const FormImageViewer = ({
	name,
	label,
	required,
	rules,
	initialValue,
	width,
	fileId,
	fileCoId,
	disabled,
	...imageViewerProps
}: FormImageViewerProps) => {
	const { t, m } = useAppTranslate();
	const form = Form.useFormInstance();
	const watchedCoId = Form.useWatch('coId', form);

	const mappedRule: Rule[] = useMemo(() => {
		if (required)
			return [{ required: true, message: m(MESSAGE_CODES.COM000002) }, ...(rules || [])];
		return rules || ([] as Rule[]);
	}, [required, rules, m]);

	// Get form field value
	const formValue = Form.useWatch(name, form);
	const fieldFileId =
		!name || formValue instanceof File || formValue == null
			? undefined
			: typeof formValue === 'string' && formValue.trim()
				? formValue.trim()
				: undefined;

	// Determine what to pass to ImageViewer
	// If form field has a File value, use it (ignore fileId)
	// If form field is null/undefined and fileId is provided, use fileId for display
	const imageViewerValue = formValue instanceof File ? formValue : null;
	const imageViewerFileId = formValue instanceof File ? undefined : fieldFileId ?? fileId;
	const resolvedFileCoId = imageViewerFileId ? fileCoId ?? watchedCoId ?? undefined : undefined;

	// Handle onChange from ImageViewer
	const handleChange = (value: string | File | null) => {
		// Accept fileId string OR File OR null
		if (typeof value === 'string') {
			form.setFieldValue(name, value.trim());
			return;
		}
		if (value instanceof File || value === null) {
			form.setFieldValue(name, value);
		}
	};


	return (
		<Form.Item
			name={name}
			label={label ? t(label as string) : undefined}
			required={required}
			validateTrigger="onBlur"
			rules={mappedRule}
			initialValue={initialValue}
			style={{
				width: width || '100%',
			}}
		>
			<ImageViewer
				{...imageViewerProps}
				value={imageViewerValue}
				fileId={imageViewerFileId}
				fileCoId={imageViewerFileId ? resolvedFileCoId : undefined}
				onChange={handleChange}
				disabled={disabled}
			/>
		</Form.Item>
	);
};

