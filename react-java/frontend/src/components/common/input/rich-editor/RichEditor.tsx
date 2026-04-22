import {
	useCallback,
	useEffect,
	useId,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
	type CSSProperties,
} from 'react';
import $ from 'jquery';

// Import styles
import 'react-trumbowyg/dist/trumbowyg.min.css';
import 'trumbowyg/dist/plugins/table/ui/trumbowyg.table.min.css';
import 'trumbowyg/dist/plugins/colors/ui/trumbowyg.colors.min.css';
import './RichEditor.scss';

import type {
	RichEditorProps,
	TrumbowygEditorInstance,
	TrumbowygButton,
	TrumbowygPlugins,
} from './types';
import { DEFAULT_BUTTONS } from './types';

/**
 * RichEditor - A WYSIWYG rich text editor component based on Trumbowyg
 *
 * @description
 * A feature-rich editor with support for:
 * - Image pasting and upload
 * - Table creation and editing
 * - Text formatting
 * - Undo/Redo history
 * - Fullscreen mode
 *
 * @component
 * @example
 * ```tsx
 * const [content, setContent] = useState('');
 *
 * <RichEditor
 *   value={content}
 *   onChange={setContent}
 *   placeholder="Enter your content..."
 *   height={300}
 * />
 * ```
 *
 * @example
 * // With custom buttons
 * <RichEditor
 *   value={content}
 *   onChange={setContent}
 *   buttons={[
 *     ['viewHTML'],
 *     ['formatting'],
 *     ['strong', 'em'],
 *     ['link', 'insertImage'],
 *     ['table'],
 *   ]}
 * />
 */
export const RichEditor: React.FC<RichEditorProps> = ({
	id,
	value = '',
	onChange,
	className,
	style,
	height = 200,
	minHeight = 100,
	maxHeight,
	showToolbar = true,
	readOnly = false,
	disabled = false,
	placeholder,
	buttons = DEFAULT_BUTTONS,
	semantic = true,
	resetCss = false,
	removeformatPasted = false,
	autogrow = false,
	autogrowOnEnter = false,
	shouldUseSvgIcons = true,
	svgIconsPath,
	plugins,
	tagClasses,
	imageWidthModalEdit = true,
	urlProtocol = true,
	minimalLinks = false,
	defaultLinkTarget = '_blank',
	editorRef,
	onFocus,
	onBlur,
	onInit,
	onResize,
	onPaste,
	onOpenFullScreen,
	onCloseFullScreen,
	onClose,
}) => {
	const generatedId = useId();
	const editorId = id || `rich-editor-${generatedId.replace(/:/g, '')}`;
	const containerRef = useRef<HTMLDivElement>(null);
	const editorElementRef = useRef<JQuery | null>(null);
	const isInitializedRef = useRef(false);
	const lastValueRef = useRef(value);
	const [isLoaded, setIsLoaded] = useState(false);

	// Load Trumbowyg dynamically
	useEffect(() => {
		const loadTrumbowyg = async () => {
			// Set jQuery globally first
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(window as any).jQuery = $;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(window as any).$ = $;

			// Dynamically import trumbowyg and plugins
			await import('trumbowyg/dist/trumbowyg.min.js');
			await import('trumbowyg/dist/plugins/pasteimage/trumbowyg.pasteimage.min.js');
			await import('trumbowyg/dist/plugins/table/trumbowyg.table.min.js');
			await import('trumbowyg/dist/plugins/base64/trumbowyg.base64.min.js');
			await import('trumbowyg/dist/plugins/upload/trumbowyg.upload.min.js');
			await import('trumbowyg/dist/plugins/history/trumbowyg.history.min.js');
			await import('trumbowyg/dist/plugins/colors/trumbowyg.colors.min.js');

			// Import jquery-resizable-dom (required for resizimg plugin - provides resizableSafe method)
			await import('jquery-resizable-dom');

			// Import resizimg plugin after jquery-resizable
			await import('trumbowyg/dist/plugins/resizimg/trumbowyg.resizimg.min.js');

			setIsLoaded(true);
		};

		loadTrumbowyg();
	}, []);

	// Merge default plugins with custom plugins
	const mergedPlugins: TrumbowygPlugins = useMemo(
		() => ({
			pasteImage: {},
			table: {
				rows: 8,
				columns: 8,
				styler: 'table table-bordered',
			},
			upload: {
				serverPath: '',
				fileFieldName: 'image',
			},
			resizimg: {
				minSize: 32,
				step: 4,
			},
			colors: {
				colorList: [
					'ffffff', 'f8f9fa', 'e9ecef', 'dee2e6', 'ced4da', 'adb5bd', '6c757d', '495057', '343a40', '212529', '000000',
					'ffebee', 'ffcdd2', 'ef9a9a', 'e57373', 'ef5350', 'f44336', 'e53935', 'd32f2f', 'c62828', 'b71c1c',
					'fce4ec', 'f8bbd9', 'f48fb1', 'f06292', 'ec407a', 'e91e63', 'd81b60', 'c2185b', 'ad1457', '880e4f',
					'f3e5f5', 'e1bee7', 'ce93d8', 'ba68c8', 'ab47bc', '9c27b0', '8e24aa', '7b1fa2', '6a1b9a', '4a148c',
					'ede7f6', 'd1c4e9', 'b39ddb', '9575cd', '7e57c2', '673ab7', '5e35b1', '512da8', '4527a0', '311b92',
					'e8eaf6', 'c5cae9', '9fa8da', '7986cb', '5c6bc0', '3f51b5', '3949ab', '303f9f', '283593', '1a237e',
					'e3f2fd', 'bbdefb', '90caf9', '64b5f6', '42a5f5', '2196f3', '1e88e5', '1976d2', '1565c0', '0d47a1',
					'e1f5fe', 'b3e5fc', '81d4fa', '4fc3f7', '29b6f6', '03a9f4', '039be5', '0288d1', '0277bd', '01579b',
					'e0f7fa', 'b2ebf2', '80deea', '4dd0e1', '26c6da', '00bcd4', '00acc1', '0097a7', '00838f', '006064',
					'e0f2f1', 'b2dfdb', '80cbc4', '4db6ac', '26a69a', '009688', '00897b', '00796b', '00695c', '004d40',
					'e8f5e9', 'c8e6c9', 'a5d6a7', '81c784', '66bb6a', '4caf50', '43a047', '388e3c', '2e7d32', '1b5e20',
					'f1f8e9', 'dcedc8', 'c5e1a5', 'aed581', '9ccc65', '8bc34a', '7cb342', '689f38', '558b2f', '33691e',
					'f9fbe7', 'f0f4c3', 'e6ee9c', 'dce775', 'd4e157', 'cddc39', 'c0ca33', 'afb42b', '9e9d24', '827717',
					'fffde7', 'fff9c4', 'fff59d', 'fff176', 'ffee58', 'ffeb3b', 'fdd835', 'fbc02d', 'f9a825', 'f57f17',
					'fff8e1', 'ffecb3', 'ffe082', 'ffd54f', 'ffca28', 'ffc107', 'ffb300', 'ffa000', 'ff8f00', 'ff6f00',
					'fff3e0', 'ffe0b2', 'ffcc80', 'ffb74d', 'ffa726', 'ff9800', 'fb8c00', 'f57c00', 'ef6c00', 'e65100',
					'fbe9e7', 'ffccbc', 'ffab91', 'ff8a65', 'ff7043', 'ff5722', 'f4511e', 'e64a19', 'd84315', 'bf360c',
				],
			},
			...plugins,
		}),
		[plugins],
	);

	// Filter buttons based on showToolbar
	const effectiveButtons: TrumbowygButton[] = useMemo(() => {
		if (!showToolbar) return [];
		return buttons;
	}, [showToolbar, buttons]);

	// Calculate container styles
	const containerStyle: CSSProperties = useMemo(
		() => ({
			...style,
			'--rich-editor-height': typeof height === 'number' ? `${height}px` : height,
			'--rich-editor-min-height': minHeight
				? typeof minHeight === 'number'
					? `${minHeight}px`
					: minHeight
				: undefined,
			'--rich-editor-max-height': maxHeight
				? typeof maxHeight === 'number'
					? `${maxHeight}px`
					: maxHeight
				: undefined,
		}),
		[style, height, minHeight, maxHeight],
	);

	// Create editor instance methods
	const editorInstance: TrumbowygEditorInstance = useMemo(
		() => ({
			getHtml: () => {
				if (editorElementRef.current) {
					return editorElementRef.current.trumbowyg('html') as string;
				}
				return '';
			},
			setHtml: (html: string) => {
				if (editorElementRef.current) {
					editorElementRef.current.trumbowyg('html', html);
				}
			},
			empty: () => {
				if (editorElementRef.current) {
					editorElementRef.current.trumbowyg('empty');
				}
			},
			enable: () => {
				if (editorElementRef.current) {
					editorElementRef.current.trumbowyg('enable');
				}
			},
			disable: () => {
				if (editorElementRef.current) {
					editorElementRef.current.trumbowyg('disable');
				}
			},
			toggle: () => {
				if (editorElementRef.current) {
					editorElementRef.current.trumbowyg('toggle');
				}
			},
			destroy: () => {
				if (editorElementRef.current) {
					editorElementRef.current.trumbowyg('destroy');
				}
			},
			getElement: () => editorElementRef.current as JQuery,
		}),
		[],
	);

	// Expose editor instance via ref
	useImperativeHandle(editorRef, () => editorInstance, [editorInstance]);

	// Handle content change
	const handleChange = useCallback(() => {
		if (editorElementRef.current && onChange) {
			const html = editorElementRef.current.trumbowyg('html') as string;
			if (html !== lastValueRef.current) {
				lastValueRef.current = html;
				onChange(html);
			}
		}
	}, [onChange]);

	// Handle Tab key for table cell navigation
	const handleTableTabNavigation = useCallback((e: JQuery.KeyDownEvent) => {
		if (e.key !== 'Tab') return;

		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return;

		// Find the current cell (td or th)
		let currentCell: HTMLTableCellElement | null = null;
		let node: Node | null = selection.anchorNode;

		while (node) {
			if (node.nodeType === Node.ELEMENT_NODE) {
				const element = node as HTMLElement;
				if (element.tagName === 'TD' || element.tagName === 'TH') {
					currentCell = element as HTMLTableCellElement;
					break;
				}
			}
			node = node.parentNode;
		}

		// If not in a table cell, let default behavior happen
		if (!currentCell) return;

		e.preventDefault();

		const row = currentCell.parentElement as HTMLTableRowElement;
		const table = currentCell.closest('table');
		if (!row || !table) return;

		const cells = Array.from(row.cells);
		const currentCellIndex = cells.indexOf(currentCell);
		const rows = Array.from(table.rows);
		const currentRowIndex = rows.indexOf(row);

		let targetCell: HTMLTableCellElement | null = null;

		if (e.shiftKey) {
			// Shift+Tab: Move to previous cell
			if (currentCellIndex > 0) {
				// Previous cell in same row
				targetCell = cells[currentCellIndex - 1];
			} else if (currentRowIndex > 0) {
				// Last cell of previous row
				const prevRow = rows[currentRowIndex - 1];
				targetCell = prevRow.cells[prevRow.cells.length - 1];
			}
		} else {
			// Tab: Move to next cell
			if (currentCellIndex < cells.length - 1) {
				// Next cell in same row
				targetCell = cells[currentCellIndex + 1];
			} else if (currentRowIndex < rows.length - 1) {
				// First cell of next row
				const nextRow = rows[currentRowIndex + 1];
				targetCell = nextRow.cells[0];
			}
		}

		// Move cursor to target cell
		if (targetCell) {
			const range = document.createRange();
			const sel = window.getSelection();

			// Select all content in the target cell
			if (targetCell.childNodes.length > 0) {
				range.selectNodeContents(targetCell);
			} else {
				// If cell is empty, just place cursor inside
				range.setStart(targetCell, 0);
				range.setEnd(targetCell, 0);
			}

			sel?.removeAllRanges();
			sel?.addRange(range);
		}
	}, []);

	// Initialize editor
	useEffect(() => {
		if (!containerRef.current || isInitializedRef.current || !isLoaded) return;

		const $editor = $(`#${editorId}`);
		if ($editor.length === 0) return;

		// Initialize Trumbowyg
		$editor.trumbowyg({
			btns: effectiveButtons,
			semantic,
			resetCss,
			removeformatPasted,
			autogrow,
			autogrowOnEnter,
			disabled: disabled || readOnly,
			svgPath: shouldUseSvgIcons
				? svgIconsPath || 'https://cdn.jsdelivr.net/npm/trumbowyg@2.31.0/dist/ui/icons.svg'
				: false,
			plugins: mergedPlugins,
			tagClasses,
			imageWidthModalEdit,
			urlProtocol,
			minimalLinks,
			defaultLinkTarget,
		});

		editorElementRef.current = $editor;
		isInitializedRef.current = true;

		// Set initial value
		if (value) {
			$editor.trumbowyg('html', value);
			lastValueRef.current = value;
		}

		// Bind events
		$editor.on('tbwchange', handleChange);
		$editor.on('tbwblur', () => {
			handleChange();
			onBlur?.();
		});
		$editor.on('tbwfocus', () => onFocus?.());
		$editor.on('tbwinit', () => onInit?.());
		$editor.on('tbwresize', () => onResize?.());
		$editor.on('tbwpaste', () => onPaste?.());
		$editor.on('tbwopenfullscreen', () => onOpenFullScreen?.());
		$editor.on('tbwclosefullscreen', () => onCloseFullScreen?.());
		$editor.on('tbwclose', () => onClose?.());

		// Bind Tab key handler for table navigation
		const $editorContent = $editor.closest('.trumbowyg-box').find('.trumbowyg-editor');
		$editorContent.on('keydown', handleTableTabNavigation);

		// Handle placeholder
		if (placeholder) {
			const $editorBox = $editor.closest('.trumbowyg-box');
			$editorBox.find('.trumbowyg-editor').attr('placeholder', placeholder);
		}

		// Cleanup
		return () => {
			if (editorElementRef.current) {
				// Unbind Tab key handler
				const $editorContent = editorElementRef.current.closest('.trumbowyg-box').find('.trumbowyg-editor');
				$editorContent.off('keydown', handleTableTabNavigation);

				editorElementRef.current.off('tbwchange tbwblur tbwfocus tbwinit tbwresize tbwpaste tbwopenfullscreen tbwclosefullscreen tbwclose');
				editorElementRef.current.trumbowyg('destroy');
				editorElementRef.current = null;
				isInitializedRef.current = false;
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [editorId, isLoaded]);

	// Update value when prop changes (external updates)
	useEffect(() => {
		if (
			editorElementRef.current &&
			isInitializedRef.current &&
			value !== lastValueRef.current
		) {
			editorElementRef.current.trumbowyg('html', value);
			lastValueRef.current = value;
		}
	}, [value]);

	// Update disabled state
	useEffect(() => {
		if (editorElementRef.current && isInitializedRef.current) {
			if (disabled || readOnly) {
				editorElementRef.current.trumbowyg('disable');
			} else {
				editorElementRef.current.trumbowyg('enable');
			}
		}
	}, [disabled, readOnly]);

	const containerClassName = [
		'rich-editor',
		!showToolbar && 'rich-editor--no-toolbar',
		disabled && 'rich-editor--disabled',
		readOnly && 'rich-editor--readonly',
		className,
	]
		.filter(Boolean)
		.join(' ');

	return (
		<div ref={containerRef} className={containerClassName} style={containerStyle}>
			<div id={editorId} />
		</div>
	);
};

export default RichEditor;
