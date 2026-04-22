import React from 'react';
import { Upload, type UploadProps } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

import { useAppTranslate } from '@/hooks';

const { Dragger } = Upload;

export type UploadDnDProps = UploadProps;

export const UploadDnD: React.FC<UploadDnDProps> = ({
	maxCount,
	fileList,
	defaultFileList,
	...uploadProps
}) => {
	const { t } = useAppTranslate();

	// Get current file count
	const currentFileList = fileList || defaultFileList || [];
	const fileCount = currentFileList.length;
	const isMaxCountReached = maxCount !== undefined && fileCount >= maxCount;

	// If max count is reached, use regular Upload to hide dragger but show file list
	if (isMaxCountReached) {
		return (
			<Upload
				{...uploadProps}
				maxCount={maxCount}
				fileList={fileList}
				defaultFileList={defaultFileList}
				className="upload-dnd"
				showUploadList={true}
			/>
		);
	}

	// Otherwise, show the dragger
	return (
		<Dragger
			{...uploadProps}
			maxCount={maxCount}
			fileList={fileList}
			defaultFileList={defaultFileList}
			className="upload-dnd"
		>
			<p className="ant-upload-drag-icon">
				<InboxOutlined />
			</p>
			<p className="ant-upload-text">
				{t('Click or drag file to this area to upload')}
			</p>
		</Dragger>
	);
};
