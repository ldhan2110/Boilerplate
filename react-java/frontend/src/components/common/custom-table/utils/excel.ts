/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from 'dayjs';

// Helper function to format cell value based on type
export function formatCellValue(
	value: any,
	type?: 'string' | 'number' | 'date' | 'boolean' | 'auto',
	format?: string,
): any {
	if (value === null || value === undefined) {
		return '';
	}

	const cellType = type || 'auto';

	switch (cellType) {
		case 'string':
			return String(value);

		case 'number': {
			const num = typeof value === 'number' ? value : parseFloat(value);
			return isNaN(num) ? value : num;
		}

		case 'date': {
			// Handle various date formats
			if (dayjs.isDayjs(value)) {
				return value.format(format || 'YYYY-MM-DD');
			}
			const date = value instanceof Date ? value : new Date(value);
			return isNaN(date.getTime()) ? value : date;
		}

		case 'boolean':
			return Boolean(value);

		case 'auto':
		default:
			// Auto-detect type
			if (typeof value === 'number') {
				return value;
			}
			if (value instanceof Date) {
				return value;
			}
			if (typeof value === 'boolean') {
				return value;
			}
			// Try to parse as number
			if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
				return Number(value);
			}
			// Try to parse as date
			if (typeof value === 'string' && !isNaN(Date.parse(value))) {
				const parsedDate = new Date(value);
				// Check if it looks like a date string (contains -, /, or T)
				if (/[-\\/T]/.test(value)) {
					return parsedDate;
				}
			}
			return String(value);
	}
}

// Helper function to get nested value
export function getNestedValue(obj: any, path: string | string[]): any {
	const keys = Array.isArray(path) ? path : [path];
	return keys.reduce((acc: any, key) => acc?.[key], obj);
}

// Helper function to extract text from React elements
export function extractTextFromReactElement(element: any, isTopLevel: boolean = true): string {
	if (element === null || element === undefined) {
		return '';
	}

	if (typeof element === 'string') {
		return element;
	}

	if (typeof element === 'number') {
		return String(element);
	}

	if (typeof element === 'boolean') {
		return element ? 'true' : 'false';
	}

	// Handle Date objects
	if (element instanceof Date) {
		return element.toISOString().split('T')[0];
	}

	// Handle arrays - concatenate with "," for top-level arrays (e.g., tags)
	if (Array.isArray(element)) {
		const extractedValues = element
			.map((item) => extractTextFromReactElement(item, false))
			.filter((text) => text.trim() !== '');
		// Use comma separator for top-level arrays (like tags), empty for nested children
		return isTopLevel ? extractedValues.join(', ') : extractedValues.join('');
	}

	// Handle React elements (objects with $$typeof or props)
	if (element && typeof element === 'object') {
		// Check if it's a React element (has props)
		if (element.props) {
			// Priority 1: Extract from children first (most common case)
			if (element.props.children !== undefined && element.props.children !== null) {
				const children = element.props.children;
				if (Array.isArray(children)) {
					const childTexts = children
						.map((child: any) => extractTextFromReactElement(child, false))
						.filter((text: string) => text.trim() !== '');

					// Check if children are separate React elements (like Tags, Buttons, etc.)
					// If all non-null children are React elements, join with comma separator
					const nonNullChildren = children.filter(
						(child: any) => child !== null && child !== undefined,
					);
					const allReactElements = nonNullChildren.every(
						(child: any) =>
							child &&
							typeof child === 'object' &&
							(child.props !== undefined || child.$$typeof !== undefined),
					);

					// Use comma separator for arrays of React elements (like Tags)
					// Use empty separator for mixed content (like text with inline elements)
					return childTexts.join(allReactElements && childTexts.length > 1 ? ', ' : '');
				}
				const childText = extractTextFromReactElement(children, false);
				if (childText.trim() !== '') {
					return childText;
				}
			}

			// Priority 2: Check for common text-related props
			// For links/anchors - try to get displayed text or href
			if (element.props.href !== undefined) {
				// If there's children text, use that; otherwise use href
				const childText = element.props.children
					? extractTextFromReactElement(element.props.children, false)
					: '';
				return childText || String(element.props.href);
			}

			// For inputs/form elements
			if (element.props.value !== undefined && element.props.value !== null) {
				return String(element.props.value);
			}

			// For elements with label prop (common in Ant Design)
			if (element.props.label !== undefined && element.props.label !== null) {
				return extractTextFromReactElement(element.props.label, false);
			}

			// For elements with title prop (tooltips, etc.)
			if (element.props.title !== undefined && element.props.title !== null) {
				return extractTextFromReactElement(element.props.title, false);
			}

			// For elements with text prop
			if (element.props.text !== undefined && element.props.text !== null) {
				return String(element.props.text);
			}

			// For elements with content prop
			if (element.props.content !== undefined && element.props.content !== null) {
				return extractTextFromReactElement(element.props.content, false);
			}

			// For elements with name prop (as fallback)
			if (element.props.name !== undefined && element.props.name !== null) {
				return String(element.props.name);
			}

			// For Ant Design Tag with color but text in children (already handled above)
			// For elements with items array (like Breadcrumb, Menu items)
			if (Array.isArray(element.props.items)) {
				const itemTexts = element.props.items
					.map((item: any) => {
						if (typeof item === 'string') return item;
						if (item?.label) return extractTextFromReactElement(item.label, false);
						if (item?.title) return extractTextFromReactElement(item.title, false);
						if (item?.children) return extractTextFromReactElement(item.children, false);
						return '';
					})
					.filter((text: string) => text.trim() !== '');
				return itemTexts.join(', ');
			}

			// For elements with options array (like Select options)
			if (Array.isArray(element.props.options) && element.props.value !== undefined) {
				const selectedOption = element.props.options.find(
					(opt: any) => opt.value === element.props.value,
				);
				if (selectedOption?.label) {
					return extractTextFromReactElement(selectedOption.label, false);
				}
			}
		}

		// Handle plain objects with common text properties (not React elements)
		if (!element.$$typeof && !element.props) {
			if (element.label !== undefined) return String(element.label);
			if (element.title !== undefined) return String(element.title);
			if (element.text !== undefined) return String(element.text);
			if (element.name !== undefined) return String(element.name);
			if (element.value !== undefined) return String(element.value);
		}
	}

	return '';
}
