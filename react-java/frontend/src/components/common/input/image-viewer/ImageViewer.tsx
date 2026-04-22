import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Flex, Image, Spin, Tooltip, Upload, type ImageProps } from 'antd';
import type { UploadRequestOption } from 'rc-upload/lib/interface';
import React, { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

import { useAppTranslate, useShowMessage } from '@/hooks';
import { downloadFile } from '@/services/api/core/sys/export-async/downloadFile.service';

export type ImageViewerProps = {
	value?: string | File | null; // Image URL, base64, or File object
	fileId?: string; // File ID to automatically fetch and display (takes precedence over value)
	fileCoId?: string; // Optional company ID for multi-tenant file retrieval
	onChange?: (value: string | File | null) => void;
	width?: string | number;
	height?: string | number;
	showUpload?: boolean; // Show upload button (default: true)
	showReset?: boolean; // Show reset button (default: true)
	showView?: boolean; // Enable preview modal via Image component (default: true)
	showZoomControls?: boolean; // Show inline zoom buttons (default: true)
	accept?: string; // File types (default: 'image/*')
	maxSize?: number; // Max file size in bytes
	disabled?: boolean;
	className?: string;
	style?: CSSProperties;
	action?: string; // Upload endpoint
	beforeUpload?: (file: File) => boolean | Promise<boolean>;
	customRequest?: (options: UploadRequestOption) => void;
	preview?: boolean | ImageProps['preview']; // Image preview config
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5.0;
const ZOOM_STEP = 0.1;
const DEFAULT_ZOOM = 1.0;
// Public folder assets are served at root in Vite
const NO_IMAGE_FALLBACK = `${import.meta.env.BASE_URL}images/no_image.png`;


export const ImageViewer: React.FC<ImageViewerProps> = ({
	value,
	fileId,
	fileCoId,
	onChange,
	width = '100%',
	height = 400,
	showUpload = true,
	showReset = true,
	showView = true,
	showZoomControls = true,
	accept = 'image/*',
	maxSize,
	disabled = false,
	className,
	style,
	action,
	beforeUpload,
	customRequest,
	preview: previewConfig = true,
}) => {
	const { t } = useAppTranslate();
	const containerId = useMemo(() => `image-viewer-${Math.random().toString(36).substr(2, 9)}`, []);
	const containerRef = useRef<HTMLDivElement>(null);
	const imagePreviewRef = useRef<HTMLDivElement>(null);
	const nativeImageRef = useRef<HTMLImageElement>(null);
	const [zoom, setZoom] = useState(DEFAULT_ZOOM);
	const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isClearedByUser, setIsClearedByUser] = useState(false);
	const touchDistanceRef = useRef<number | null>(null);
	const lastZoomRef = useRef(DEFAULT_ZOOM);
	const objectUrlRef = useRef<string | null>(null);
	const fileIdAbortControllerRef = useRef<AbortController | null>(null);
	const { showWarningMessage} = useShowMessage();

	// Fetch file by fileId (takes precedence over value)
	useEffect(() => {
		if (isClearedByUser) {
			setIsLoading(false);
			setImageUrl(null);
			return;
		}
		// Abort previous fetch if still in progress
		if (fileIdAbortControllerRef.current) {
			fileIdAbortControllerRef.current.abort();
			fileIdAbortControllerRef.current = null;
		}

		// Cleanup previous object URL if it exists
		if (objectUrlRef.current) {
			URL.revokeObjectURL(objectUrlRef.current);
			objectUrlRef.current = null;
		}

		// Reset states
		setIsLoading(false);
		setImageUrl(null);

		if (!fileId) {
			return;
		}

		// Fetch file by fileId
		const abortController = new AbortController();
		fileIdAbortControllerRef.current = abortController;
		setIsLoading(true);

		downloadFile(fileId, undefined, fileCoId)
			.then(({ data }) => {
				// Check if fetch was aborted
				if (abortController.signal.aborted) {
					return;
				}

				const url = URL.createObjectURL(data);
				objectUrlRef.current = url;
				setImageUrl(url);
				setIsLoading(false);
			})
			.catch((error) => {
				// Ignore abort errors
				if (abortController.signal.aborted) {
					return;
				}

				console.error('Error loading file by fileId:', error);
				setIsLoading(false);
				setImageUrl(null);
			});

		// Cleanup on unmount or when fileId changes
		return () => {
			abortController.abort();
			if (objectUrlRef.current) {
				URL.revokeObjectURL(objectUrlRef.current);
				objectUrlRef.current = null;
			}
		};
	}, [fileId, fileCoId, isClearedByUser]);

	// Convert value to image URL (only if fileId is not provided)
	useEffect(() => {
		// If fileId is provided, ignore value prop
		if (fileId) {
			return;
		}

		// Cleanup previous object URL if it exists
		if (objectUrlRef.current) {
			URL.revokeObjectURL(objectUrlRef.current);
			objectUrlRef.current = null;
		}

		// Reset states
		setIsLoading(false);

		if (!value) {
			setImageUrl(null);
			return;
		}

		if (typeof value === 'string') {
			// String value: could be URL or base64
			setIsLoading(true);
			setImageUrl(value);
		} else if (value instanceof File) {
			// File object: create object URL (local file, loads instantly - no loading state needed)
			const url = URL.createObjectURL(value);
			objectUrlRef.current = url;
			setImageUrl(url);
			// Don't set loading state for local files - they're instant
			// The onLoad handlers will handle any edge cases
		}
	}, [value, fileId]);

	// Cleanup object URLs and abort controllers on unmount
	useEffect(() => {
		return () => {
			if (fileIdAbortControllerRef.current) {
				fileIdAbortControllerRef.current.abort();
				fileIdAbortControllerRef.current = null;
			}
			if (objectUrlRef.current) {
				URL.revokeObjectURL(objectUrlRef.current);
				objectUrlRef.current = null;
			}
		};
	}, []);

	// Reset zoom and pan when image changes
	useEffect(() => {
		setZoom(DEFAULT_ZOOM);
		setPanPosition({ x: 0, y: 0 });
		lastZoomRef.current = DEFAULT_ZOOM;
	}, [imageUrl]);

	// Check if image is already loaded when imageUrl changes (for cached images or object URLs)
	useEffect(() => {
		if (!imageUrl || isLoading === false) return;

		// Check immediately and also after a brief delay for DOM to update
		const checkImmediately = () => {
			const nativeImg = nativeImageRef.current;
			if (nativeImg && nativeImg.complete && nativeImg.naturalWidth > 0) {
				setIsLoading(false);
				return true;
			}
			return false;
		};

		// Check immediately
		if (checkImmediately()) {
			return;
		}

		// Use a very short timeout for local files (object URLs)
		const isObjectUrl = imageUrl.startsWith('blob:');
		const checkTimeout = setTimeout(() => {
			if (!checkImmediately()) {
				// If still not loaded and it's an object URL, clear loading anyway (local files should be instant)
				if (isObjectUrl) {
					setIsLoading(false);
				}
			}
		}, isObjectUrl ? 50 : 100); // 50ms for local files, 100ms for network URLs

		// Fallback timeout to clear loading state if onLoad doesn't fire (safety net)
		const fallbackTimeout = setTimeout(() => {
			setIsLoading(false);
		}, isObjectUrl ? 1000 : 5000); // 1 second for local files, 5 seconds for network

		return () => {
			clearTimeout(checkTimeout);
			clearTimeout(fallbackTimeout);
		};
	}, [imageUrl, isLoading]);

	// Handle image load events
	const handleImageLoad = useCallback(() => {
		setIsLoading(false);
	}, []);

	// Handle image error events
	const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
		const target = e.currentTarget;
		// Prevent infinite error loops
		if (target.src.endsWith(NO_IMAGE_FALLBACK)) {
			return;
		}
		setIsLoading(false);
		// Set fallback image
		target.src = NO_IMAGE_FALLBACK;
	}, []);

	// Handle zoom with limits
	const handleZoom = useCallback(
		(newZoom: number, centerX?: number, centerY?: number) => {
			const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
			setZoom(clampedZoom);

			// If zooming at a specific point (mouse position), adjust pan to keep that point centered
			if (centerX !== undefined && centerY !== undefined && containerRef.current) {
				const container = containerRef.current;
				const containerRect = container.getBoundingClientRect();
				const containerCenterX = containerRect.width / 2;
				const containerCenterY = containerRect.height / 2;

				// Calculate the point relative to container center
				const pointX = centerX - containerRect.left - containerCenterX;
				const pointY = centerY - containerRect.top - containerCenterY;

				// Adjust pan based on zoom change
				const zoomRatio = clampedZoom / lastZoomRef.current;
				setPanPosition((prev) => ({
					x: prev.x + pointX * (1 - zoomRatio),
					y: prev.y + pointY * (1 - zoomRatio),
				}));
			}

			lastZoomRef.current = clampedZoom;
		},
		[]
	);

	const handleResetZoom = useCallback(() => {
		setZoom(DEFAULT_ZOOM);
		setPanPosition({ x: 0, y: 0 });
		lastZoomRef.current = DEFAULT_ZOOM;
	}, []);

	// Mouse wheel zoom
	useEffect(() => {
		const container = containerRef.current;
		if (!container || !imageUrl || disabled) return;

		const handleWheel = (e: WheelEvent) => {
			if (!showZoomControls) return;
			e.preventDefault();
			const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
			handleZoom(zoom + delta, e.clientX, e.clientY);
		};

		container.addEventListener('wheel', handleWheel, { passive: false });
		return () => {
			container.removeEventListener('wheel', handleWheel);
		};
	}, [zoom, imageUrl, disabled, showZoomControls, handleZoom]);

	// Touch/pinch zoom
	useEffect(() => {
		const container = containerRef.current;
		if (!container || !imageUrl || disabled || !showZoomControls) return;

		const getDistance = (touch1: Touch, touch2: Touch): number => {
			const dx = touch1.clientX - touch2.clientX;
			const dy = touch1.clientY - touch2.clientY;
			return Math.sqrt(dx * dx + dy * dy);
		};

		const handleTouchStart = (e: TouchEvent) => {
			if (e.touches.length === 2) {
				const distance = getDistance(e.touches[0], e.touches[1]);
				touchDistanceRef.current = distance;
				lastZoomRef.current = zoom;
			} else if (e.touches.length === 1) {
				// Single touch - could be pan
				setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
				setIsDragging(true);
			}
		};

		const handleTouchMove = (e: TouchEvent) => {
			if (e.touches.length === 2 && touchDistanceRef.current !== null) {
				e.preventDefault();
				const distance = getDistance(e.touches[0], e.touches[1]);
				const scale = distance / touchDistanceRef.current;
				const newZoom = lastZoomRef.current * scale;
				handleZoom(newZoom);
			} else if (e.touches.length === 1 && isDragging && zoom > DEFAULT_ZOOM) {
				e.preventDefault();
				const deltaX = e.touches[0].clientX - dragStart.x;
				const deltaY = e.touches[0].clientY - dragStart.y;
				setPanPosition((prev) => ({
					x: prev.x + deltaX,
					y: prev.y + deltaY,
				}));
				setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
			}
		};

		const handleTouchEnd = () => {
			touchDistanceRef.current = null;
			setIsDragging(false);
		};

		container.addEventListener('touchstart', handleTouchStart, { passive: false });
		container.addEventListener('touchmove', handleTouchMove, { passive: false });
		container.addEventListener('touchend', handleTouchEnd);
		container.addEventListener('touchcancel', handleTouchEnd);

		return () => {
			container.removeEventListener('touchstart', handleTouchStart);
			container.removeEventListener('touchmove', handleTouchMove);
			container.removeEventListener('touchend', handleTouchEnd);
			container.removeEventListener('touchcancel', handleTouchEnd);
		};
	}, [zoom, imageUrl, disabled, showZoomControls, isDragging, dragStart, handleZoom]);

	// Mouse drag for panning
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (zoom <= DEFAULT_ZOOM || disabled) return;
			if ((e.target as HTMLElement).tagName === 'IMG') {
				setIsDragging(true);
				setDragStart({ x: e.clientX, y: e.clientY });
			}
		},
		[zoom, disabled]
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (!isDragging || zoom <= DEFAULT_ZOOM) return;
			const deltaX = e.clientX - dragStart.x;
			const deltaY = e.clientY - dragStart.y;
			setPanPosition((prev) => ({
				x: prev.x + deltaX,
				y: prev.y + deltaY,
			}));
			setDragStart({ x: e.clientX, y: e.clientY });
		},
		[isDragging, zoom, dragStart]
	);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	// Upload handlers
	const handleUploadChange = useCallback(
		(info: { file: { status?: string; originFileObj?: File }; fileList?: unknown[] }) => {
			const { file } = info;
			if (file.status === 'done' || file.originFileObj) {
				const uploadedFile = file.originFileObj || (file as File);
				if (onChange) {
					onChange(uploadedFile);
				}
			}
		},
		[onChange]
	);

	const handleBeforeUpload = useCallback(
		(file: File): boolean | Promise<boolean> => {
			// Check file size if maxSize is provided
			if (maxSize && file.size > maxSize) {
				// You might want to show a message here
				showWarningMessage(t(`Image size must be less than 1MB`));
				return false;
			}

			// If custom beforeUpload is provided, use it
			if (beforeUpload) {
				return beforeUpload(file);
			}

			// Otherwise, handle file directly
			if (onChange) {
				onChange(file);
			}
			return false; // Prevent default upload
		},
		[maxSize, beforeUpload, onChange]
	);

	const handleReset = useCallback(() => {
		setIsClearedByUser(true);
		if (onChange) {
			onChange(null);
		}
		handleResetZoom();
	}, [onChange, handleResetZoom]);

	// Compute image preview config
	const imagePreviewConfig = useMemo(() => {
		if (showView === false) return false;
		if (typeof previewConfig === 'boolean') return previewConfig;
		return previewConfig;
	}, [showView, previewConfig]);

	// Compute image container style
	const imageContainerStyle: CSSProperties = useMemo(
		() => ({
			width: typeof width === 'number' ? `${width}px` : width,
			height: typeof height === 'number' ? `${height}px` : height,
			position: 'relative',
			overflow: 'hidden',
			border: '1px solid #d9d9d9',
			borderRadius: '6px',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: '#fafafa',
			cursor: zoom > DEFAULT_ZOOM ? (isDragging ? 'grabbing' : 'grab') : 'default',
			...style,
		}),
		[width, height, style, zoom, isDragging]
	);

	// Compute image style with zoom and pan
	const imageStyle: CSSProperties = useMemo(
		() => ({
			maxWidth: '100%',
			maxHeight: '100%',
			width: 'auto',
			height: 'auto',
			objectFit: 'contain',
			transform: `scale(${zoom}) translate(${panPosition.x / zoom}px, ${panPosition.y / zoom}px)`,
			transition: isDragging ? 'none' : 'transform 0.1s ease-out',
			userSelect: 'none',
			pointerEvents: zoom > DEFAULT_ZOOM ? 'auto' : 'none',
		}),
		[zoom, panPosition, isDragging]
	);

	return (
		<div className={className} style={{ width: typeof width === 'number' ? `${width}px` : width }}>
			<div
				ref={containerRef}
				data-container-id={containerId}
				style={imageContainerStyle}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
			>
				{/* Loading indicator */}
				{isLoading && (
					<div
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							width: '100%',
							height: '100%',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							zIndex: 10,
							backgroundColor: 'rgba(255, 255, 255, 0.8)',
						}}
					>
						<Spin size="large" />
					</div>
				)}
				{imageUrl && !isLoading ? (
					<>
						{/* Ant Design Image component for preview - always rendered for preview functionality */}
						{imagePreviewConfig && (
							<div
								ref={imagePreviewRef}
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									width: '100%',
									height: '100%',
									zIndex: zoom > DEFAULT_ZOOM ? 0 : 2,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									pointerEvents: zoom > DEFAULT_ZOOM ? 'none' : 'auto',
									opacity: zoom > DEFAULT_ZOOM ? 0 : 1,
								}}
							>
								<Image
									src={imageUrl}
									preview={imagePreviewConfig}
									fallback={NO_IMAGE_FALLBACK}
									style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
									alt={t('Image preview')}
									width="100%"
									height="100%"
									onLoad={handleImageLoad}
									onError={(e) => {
										handleImageError(e);
										// Also set fallback for Ant Design Image
										if (e.currentTarget.src !== NO_IMAGE_FALLBACK) {
											e.currentTarget.src = NO_IMAGE_FALLBACK;
										}
									}}
								/>
							</div>
						)}
						{/* Native img for inline zoom/pan control - visible when zoomed or preview disabled */}
						<img
							ref={nativeImageRef}
							src={imageUrl}
							alt={t('Image preview')}
							style={{
								...imageStyle,
								zIndex: zoom > DEFAULT_ZOOM || !imagePreviewConfig ? 2 : 0,
								position: 'relative',
								opacity: zoom > DEFAULT_ZOOM || !imagePreviewConfig ? 1 : 0,
								pointerEvents: zoom > DEFAULT_ZOOM || !imagePreviewConfig ? 'auto' : 'none',
							}}
							draggable={false}
							onLoad={handleImageLoad}
							onError={handleImageError}
						/>
					</>
				) : (
					<div
						style={{
							width: '100%',
							height: '100%',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							cursor: showUpload && !disabled ? 'pointer' : 'default',
							position: 'relative',
						}}
						onClick={() => {
							if (showUpload && !disabled) {
								// Trigger upload click by finding the upload button
								const uploadBtn = document.querySelector(`[data-image-upload-trigger="${containerId}"]`) as HTMLElement;
								if (uploadBtn) {
									uploadBtn.click();
								}
							}
						}}
					>
						<img
							src={NO_IMAGE_FALLBACK}
							alt={t('No image')}
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
								display: 'block',
							}}
						/>
					</div>
				)}
			</div>
			{/* Control buttons below image */}
			{(showUpload || showReset) && (
				<Flex
					justify="center"
					align="center"
					gap={12}
					style={{
						marginTop: 8,
					}}
				>
					{/* Upload button */}
					{showUpload && (
						<Upload
							accept={accept}
							showUploadList={false}
							beforeUpload={handleBeforeUpload}
							onChange={handleUploadChange}
							action={action}
							customRequest={customRequest}
							disabled={disabled}
							maxCount={1}
						>
							<Tooltip title={t('Upload')}>
								<Button
									shape="circle"
									icon={<UploadOutlined />}
									disabled={disabled}
									size="small"
									style={{
										width: 32,
										height: 32,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										backgroundColor: '#52c41a',
										borderColor: '#52c41a',
										color: '#fff',
										boxShadow: '0 2px 4px rgba(82,196,26,0.3)',
									}}
									data-image-upload-trigger={containerId}
									onMouseEnter={(e) => {
										if (!disabled) {
											e.currentTarget.style.backgroundColor = '#73d13d';
											e.currentTarget.style.borderColor = '#73d13d';
										}
									}}
									onMouseLeave={(e) => {
										if (!disabled) {
											e.currentTarget.style.backgroundColor = '#52c41a';
											e.currentTarget.style.borderColor = '#52c41a';
										}
									}}
								/>
							</Tooltip>
						</Upload>
					)}
					{/* Reset button */}
					{showReset && (
						<Tooltip title={t('Reset')}>
							<Button
								shape="circle"
								icon={<DeleteOutlined />}
								onClick={handleReset}
								disabled={disabled || (!imageUrl && !fileId)}
								size="small"
								style={{
									width: 32,
									height: 32,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									backgroundColor: disabled || !imageUrl ? undefined : '#ff4d4f',
									borderColor: disabled || !imageUrl ? undefined : '#ff4d4f',
									color: disabled || !imageUrl ? undefined : '#fff',
									boxShadow: disabled || !imageUrl ? undefined : '0 2px 4px rgba(255,77,79,0.3)',
								}}
								onMouseEnter={(e) => {
									if (!disabled && imageUrl) {
										e.currentTarget.style.backgroundColor = '#ff7875';
										e.currentTarget.style.borderColor = '#ff7875';
									}
								}}
								onMouseLeave={(e) => {
									if (!disabled && imageUrl) {
										e.currentTarget.style.backgroundColor = '#ff4d4f';
										e.currentTarget.style.borderColor = '#ff4d4f';
									}
								}}
							/>
						</Tooltip>
					)}
				</Flex>
			)}
		</div>
	);
};

export default ImageViewer;

