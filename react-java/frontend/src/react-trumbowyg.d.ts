/**
 * Type declarations for react-trumbowyg
 */
declare module 'react-trumbowyg' {
	import { Component } from 'react';

	interface TrumbowygProps {
		id: string;
		data?: string;
		placeholder?: string;
		buttons?: (string | string[])[];
		semantic?: boolean;
		resetCss?: boolean;
		removeformatPasted?: boolean;
		autogrow?: boolean;
		autogrowOnEnter?: boolean;
		disabled?: boolean;
		shouldUseSvgIcons?: boolean;
		svgIconsPath?: string;
		shouldInjectSvgIcons?: boolean;
		plugins?: Record<string, unknown>;
		tagClasses?: Record<string, string>;
		imageWidthModalEdit?: boolean;
		urlProtocol?: boolean | string;
		minimalLinks?: boolean;
		defaultLinkTarget?: string;
		onFocus?: () => void;
		onBlur?: () => void;
		onInit?: () => void;
		onChange?: (content: string) => void;
		onResize?: () => void;
		onPaste?: () => void;
		onOpenFullScreen?: () => void;
		onCloseFullScreen?: () => void;
		onClose?: () => void;
	}

	export default class Trumbowyg extends Component<TrumbowygProps> {}
}

/**
 * Type declarations for trumbowyg jQuery plugin
 */
interface JQuery {
	trumbowyg(method: 'html'): string;
	trumbowyg(method: 'html', content: string): JQuery;
	trumbowyg(method: 'empty'): JQuery;
	trumbowyg(method: 'enable'): JQuery;
	trumbowyg(method: 'disable'): JQuery;
	trumbowyg(method: 'toggle'): JQuery;
	trumbowyg(method: 'destroy'): JQuery;
	trumbowyg(method: 'openModal' | 'closeModal' | 'openModalInsert'): JQuery;
	trumbowyg(method: 'saveRange' | 'restoreRange'): JQuery;
	trumbowyg(method: 'getRangeText'): string;
	trumbowyg(method: 'getRange'): Range;
	trumbowyg(method: 'execCmd', cmd: string, param?: string | boolean, forceCss?: boolean): JQuery;
	// General overload for initialization with options - must be last
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	trumbowyg(options?: TrumbowygJQueryOptions | Record<string, any>): JQuery;
}

interface TrumbowygJQueryOptions {
	btns?: (string | string[])[];
	semantic?: boolean;
	resetCss?: boolean;
	removeformatPasted?: boolean;
	autogrow?: boolean;
	autogrowOnEnter?: boolean;
	disabled?: boolean;
	svgPath?: string | false;
	plugins?: Record<string, unknown>;
	tagClasses?: Record<string, string>;
	imageWidthModalEdit?: boolean;
	urlProtocol?: boolean | string;
	minimalLinks?: boolean;
	defaultLinkTarget?: string;
}

declare module 'trumbowyg/dist/trumbowyg.min.js';
declare module 'trumbowyg/dist/plugins/pasteimage/trumbowyg.pasteimage.min.js';
declare module 'trumbowyg/dist/plugins/table/trumbowyg.table.min.js';
declare module 'trumbowyg/dist/plugins/base64/trumbowyg.base64.min.js';
declare module 'trumbowyg/dist/plugins/upload/trumbowyg.upload.min.js';
declare module 'trumbowyg/dist/plugins/history/trumbowyg.history.min.js';
declare module 'trumbowyg/dist/plugins/resizimg/trumbowyg.resizimg.min.js';
declare module 'trumbowyg/dist/plugins/colors/trumbowyg.colors.min.js';
declare module 'jquery-resizable-dom';

