/**
 * TypeScript type definitions for react-trumbowyg and trumbowyg
 */

import type { CSSProperties, RefObject } from 'react';

/**
 * Trumbowyg button group definitions
 */
export type TrumbowygButtonGroup =
	| 'viewHTML'
	| 'undo'
	| 'redo'
	| 'formatting'
	| 'strong'
	| 'em'
	| 'del'
	| 'superscript'
	| 'subscript'
	| 'link'
	| 'insertImage'
	| 'justifyLeft'
	| 'justifyCenter'
	| 'justifyRight'
	| 'justifyFull'
	| 'unorderedList'
	| 'orderedList'
	| 'horizontalRule'
	| 'removeformat'
	| 'fullscreen'
	| 'table'
	| 'noembed'
	| 'upload'
	| 'pasteImage'
	| 'base64'
	| 'preformatted'
	| 'fontsize'
	| 'fontfamily'
	| 'foreColor'
	| 'backColor'
	| 'btnGrp-design'
	| 'btnGrp-semantic'
	| 'btnGrp-justify'
	| 'btnGrp-lists';

export type TrumbowygButton = TrumbowygButtonGroup | TrumbowygButtonGroup[];

/**
 * Trumbowyg plugin options
 */
export interface TrumbowygTablePluginOptions {
	rows?: number;
	columns?: number;
	styler?: string;
}

export interface TrumbowygUploadPluginOptions {
	serverPath?: string;
	fileFieldName?: string;
	data?: Record<string, unknown>[];
	headers?: Record<string, string>;
	urlPropertyName?: string;
	statusPropertyName?: string;
	success?: (data: unknown) => void;
	error?: (error: unknown) => void;
}

/**
 * Trumbowyg resizimg plugin options
 * Enables image resizing within the editor using jQuery UI's resizable widget
 */
export interface TrumbowygResizimgPluginOptions {
	/** Minimum size for the image in pixels (default: 32) */
	minSize?: number;
	/** Step size for resizing in pixels (default: 4) */
	step?: number;
}

export interface TrumbowygPlugins {
	table?: TrumbowygTablePluginOptions;
	upload?: TrumbowygUploadPluginOptions;
	pasteImage?: Record<string, unknown>;
	base64?: Record<string, unknown>;
	/** Resizimg plugin options - enables image resizing with jQuery UI */
	resizimg?: TrumbowygResizimgPluginOptions;
	colors?: {
		colorList?: string[];
		foreColorList?: string[];
		backColorList?: string[];
	};
	fontsize?: {
		sizeList?: string[];
		allowCustomSize?: boolean;
	};
	fontfamily?: {
		fontList?: { name: string; family: string }[];
	};
	noembed?: {
		proxy?: string;
	};
}

/**
 * Trumbowyg tag classes configuration
 */
export interface TrumbowygTagClasses {
	table?: string;
	img?: string;
	blockquote?: string;
	pre?: string;
	ul?: string;
	ol?: string;
	h1?: string;
	h2?: string;
	h3?: string;
	h4?: string;
	p?: string;
}

/**
 * React-trumbowyg component props
 */
export interface TrumbowygProps {
	/** Unique identifier for the editor instance */
	id: string;

	/** Initial HTML content */
	data?: string;

	/** Placeholder text when editor is empty */
	placeholder?: string;

	/** Array of button definitions for the toolbar */
	buttons?: TrumbowygButton[];

	/** Use semantic HTML tags (default: true) */
	semantic?: boolean;

	/** Reset CSS for editor content (default: false) */
	resetCss?: boolean;

	/** Remove formatting from pasted content (default: false) */
	removeformatPasted?: boolean;

	/** Auto-grow editor height based on content (default: false) */
	autogrow?: boolean;

	/** Autogrow on enter key press */
	autogrowOnEnter?: boolean;

	/** Disable the editor (default: false) */
	disabled?: boolean;

	/** Whether to use SVG icons (default: true) */
	shouldUseSvgIcons?: boolean;

	/** Path to custom SVG icons file */
	svgIconsPath?: string;

	/** Inject SVG icons into body (default: true) */
	shouldInjectSvgIcons?: boolean;

	/** Plugin configurations */
	plugins?: TrumbowygPlugins;

	/** Tag classes for styling generated HTML elements */
	tagClasses?: TrumbowygTagClasses;

	/** Image width modal option */
	imageWidthModalEdit?: boolean;

	/** URL protocol option */
	urlProtocol?: boolean | string;

	/** Minimal links */
	minimalLinks?: boolean;

	/** Default link target */
	defaultLinkTarget?: string;

	// Event handlers
	/** Called when editor gains focus */
	onFocus?: () => void;

	/** Called when editor loses focus */
	onBlur?: () => void;

	/** Called when editor is initialized */
	onInit?: () => void;

	/** Called when editor content changes */
	onChange?: (content: string) => void;

	/** Called when editor is resized (autogrow) */
	onResize?: () => void;

	/** Called when content is pasted */
	onPaste?: () => void;

	/** Called when entering fullscreen mode */
	onOpenFullScreen?: () => void;

	/** Called when exiting fullscreen mode */
	onCloseFullScreen?: () => void;

	/** Called when editor is closed */
	onClose?: () => void;
}

/**
 * RichEditor component props extending Trumbowyg props
 */
export interface RichEditorProps extends Omit<TrumbowygProps, 'id' | 'data' | 'onChange'> {
	/** Unique identifier for the editor (auto-generated if not provided) */
	id?: string;

	/** Current HTML content value */
	value?: string;

	/** Callback when content changes */
	onChange?: (value: string) => void;

	/** Custom CSS class name */
	className?: string;

	/** Custom inline styles */
	style?: CSSProperties;

	/** Height of the editor */
	height?: number | string;

	/** Minimum height of the editor */
	minHeight?: number | string;

	/** Maximum height of the editor */
	maxHeight?: number | string;

	/** Show toolbar (default: true) */
	showToolbar?: boolean;

	/** Read-only mode */
	readOnly?: boolean;

	/** Ref to access editor instance */
	editorRef?: RefObject<TrumbowygEditorInstance | null>;
}

/**
 * Trumbowyg editor instance methods
 */
export interface TrumbowygEditorInstance {
	/** Get editor HTML content */
	getHtml: () => string;

	/** Set editor HTML content */
	setHtml: (html: string) => void;

	/** Empty the editor */
	empty: () => void;

	/** Enable the editor */
	enable: () => void;

	/** Disable the editor */
	disable: () => void;

	/** Toggle editor state */
	toggle: () => void;

	/** Destroy the editor */
	destroy: () => void;

	/** Get the jQuery element */
	getElement: () => JQuery;
}

/**
 * Default button configuration presets
 */
export const DEFAULT_BUTTONS: TrumbowygButton[] = [
	['viewHTML'],
	['undo', 'redo'],
	['formatting'],
	'btnGrp-semantic',
	['link'],
	['insertImage'],
	'btnGrp-justify',
	'btnGrp-lists',
	['table'],
	['horizontalRule'],
	['removeformat'],
	['fullscreen'],
];

export const MINIMAL_BUTTONS: TrumbowygButton[] = [
	['strong', 'em', 'del'],
	['link'],
	['unorderedList', 'orderedList'],
];

export const FULL_BUTTONS: TrumbowygButton[] = [
	['viewHTML'],
	['undo', 'redo'],
	['foreColor', 'backColor'],
	['formatting'],
	['strong', 'em', 'del'],
	['link'],
	['insertImage'],
	['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
	['unorderedList', 'orderedList'],
	['table'],
	['horizontalRule'],
	['removeformat'],
	['fullscreen'],
];

