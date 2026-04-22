/* eslint-disable @typescript-eslint/no-explicit-any */
import { authService } from '@/services/auth/authJwtService';
import appStore from '../stores/AppStore';
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from "uuid";
import { DateFormat, type Loose, type MenuTree, type ProgramTree } from '../types';
import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';
import React from 'react';

dayjs.extend(utc);
export const MAX_IMAGE_SIZE_1MB = 1 * 1024 * 1024;
// Helper function to generate a unique ID with format DDMMYYXXXXXX
export const generateId = (): string => {
	const now = new Date();

	// Get Day, Month, Year
	const day = now.getDate().toString().padStart(2, '0');
	const month = (now.getMonth() + 1).toString().padStart(2, '0'); // getMonth() trả về 0-11
	const year = now.getFullYear().toString().slice(-2); // Lấy 2 ký tự cuối của năm

	// Generate 6 random characters from A-Z and 0-9
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let randomChars = '';
	for (let i = 0; i < 6; i++) {
		randomChars += chars.charAt(Math.floor(Math.random() * chars.length));
	}

	// Kết hợp theo format DDMMYYXXXXXX
	return `${day}${month}${year}${randomChars}`;
};

export function formatDate(dateString: string, isShowTime?: boolean): string {
	if (!dateString) {
		return '';
	}

	const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
	if (dateOnlyMatch && !isShowTime) {
		const [year, month, day] = dateOnlyMatch.slice(1);
		const format = appStore.state.dateFormat;

		switch (format) {
			case DateFormat.YYYY_MM_DD_HH_MM_SS:
				return `${year}/${month}/${day}`;
			case DateFormat.MM_DD_YYYY_HH_MM_SS:
				return `${month}/${day}/${year}`;
			case DateFormat.DD_MM_YYYY_HH_MM_SS:
				return `${day}/${month}/${year}`;
			default:
				return `${year}/${month}/${day}`;
		}
	}

	// 1) trim and replace the first space between date & time with 'T'
	let normalized = dateString.trim().replace(' ', 'T');

	// 2) trim microseconds -> milliseconds (e.g. .509338 -> .509)
	normalized = normalized.replace(/(\.\d{3})\d+/, '$1');

	// 3) normalize timezone formats:
	//    +0700  -> +07:00
	//    +07    -> +07:00
	normalized = normalized.replace(/([+-]\d{2})(\d{2})$/, '$1:$2'); // +0700 -> +07:00
	normalized = normalized.replace(/([+-]\d{2})$/, '$1:00'); // +07 -> +07:00

	const currentCompanyTimeZone = authService.getCurrentUser()?.userInfo.coTmz || 'UTC';

	const date = new Date(normalized);
	if (isNaN(date.getTime())) return '';

	const parts = new Intl.DateTimeFormat('en-GB', {
		timeZone: currentCompanyTimeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	}).formatToParts(date);

	if (isNaN(date.getTime())) {
		return '';
	}

	const year = parts.find((p) => p.type === 'year')?.value ?? '';
	const month = parts.find((p) => p.type === 'month')?.value ?? '';
	const day = parts.find((p) => p.type === 'day')?.value ?? '';
	const hour = parts.find((p) => p.type === 'hour')?.value ?? '';
	const minute = parts.find((p) => p.type === 'minute')?.value ?? '';
	const second = parts.find((p) => p.type === 'second')?.value ?? '';

	const format = appStore.state.dateFormat;

	switch (format) {
		case DateFormat.YYYY_MM_DD_HH_MM_SS:
			return `${year}/${month}/${day} ${isShowTime ? `${hour}:${minute}:${second}` : ''}`;
		case DateFormat.MM_DD_YYYY_HH_MM_SS:
			return `${month}/${day}/${year} ${isShowTime ? `${hour}:${minute}:${second}` : ''}`;
		case DateFormat.DD_MM_YYYY_HH_MM_SS:
			return `${day}/${month}/${year} ${isShowTime ? `${hour}:${minute}:${second}` : ''}`;
		default:
			throw new Error(`Unsupported format: ${format}`);
	}
}

export function formatNumberAmount(value: string | number, precision?: number) {
	if (value == null || value === '') return '';
	const [intPart, decPart = ''] = String(value).split('.');
	const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

	if (precision !== undefined) {
		return (
			withCommas +
			(precision > 0 ? '.' + (decPart + '0'.repeat(precision)).slice(0, precision) : '')
		);
	}

	// Always show 2 decimals
	return `${withCommas}.${(decPart + '0'.repeat(2)).slice(0, 2)}`;
}

export function parserNumberAmount(value: string | undefined) {
	if (!value) return '';

	// remove commas
	let cleaned = value.replace(/,/g, '');

	// allow only first dot
	const firstDot = cleaned.indexOf('.');
	if (firstDot !== -1) {
		cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, ''); // remove extra dots
	}

	// cut decimals > 2
	const [intPart, decPart = ''] = cleaned.split('.');
	return decPart ? `${intPart}.${decPart.slice(0, 2)}` : intPart;
}

export function parseDecimalCommaInput(value?: string | number) {
	if (value == null) return '';
	const raw = String(value).trim();
	if (!raw) return '';
	const hasDot = raw.includes('.');
	const hasComma = raw.includes(',');
	if (hasDot && hasComma) {
		return raw.replace(/,/g, '');
	}
	if (hasComma && !hasDot) {
		const lastComma = raw.lastIndexOf(',');
		const intPart = raw.slice(0, lastComma).replace(/,/g, '');
		const fracPart = raw.slice(lastComma + 1);
		if (fracPart.length === 0) {
			return `${intPart}.`;
		}
		if (fracPart.length > 0 && fracPart.length <= 2) {
			return `${intPart}.${fracPart}`;
		}
		return raw.replace(/,/g, '');
	}
	return raw.replace(/,/g, '');
}

export function formatDecimalCommaDisplay(value?: string | number) {
	if (value == null) return '';
	const raw = String(value);
	if (!raw) return '';
	if (raw.endsWith('.')) {
		const intPart = raw.slice(0, -1).replace(/,/g, '');
		const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
		return `${formatted}.`;
	}
	const [intPart, fracPart] = raw.split('.');
	const formatted = intPart.replace(/,/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	return fracPart !== undefined ? `${formatted}.${fracPart}` : formatted;
}

export function convertToDBColumn(input: string) {
	return input ? input.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase() : input;
}

/**
 * Maps frontend column keys to SQL ORDER BY names for payroll basic salary list APIs
 * (Month Salary / Insurance Month). Fixes alw01Amt → ALW_01_AMT (not ALW01_AMT) and
 * applyInsurTpCd → MODI_TP_CD.
 */
export function mapPayrollBasicSalarySortField(sortField: string): string {
	if (sortField === 'relatedAppendixCnt') {
		return 'RELATED_APPENDIX_CNT';
	}
	if (sortField === 'applyInsurTpCd') {
		return 'MODI_TP_CD';
	}
	const alw = /^alw(\d{2})amt$/i.exec(sortField);
	if (alw) {
		return `ALW_${alw[1]}_AMT`;
	}
	return convertToDBColumn(sortField);
}

export function convertFromDBColumn(input: string | undefined): string | undefined {
	if (!input) return undefined;
	return input
		.toLowerCase()
		.split('_')
		.map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
		.join('');
}

export function buildMenuProgramTree(nodes: ProgramTree[]): ProgramTree[] {
	const map = new Map<string, ProgramTree>();
	const tree: ProgramTree[] = [];

	// 1. Map all nodes
	nodes.forEach((node) => map.set(node.pgmId!, { ...node }));

	// 2. Build tree
	nodes.forEach((node) => {
		const parentId = node.prntPgmId;
		if (parentId && map.has(parentId)) {
			const parent = map.get(parentId)!;
			// Only create children array if parent has children
			if (!parent.children) parent.children = [];
			parent.children.push(map.get(node.pgmId!)!);
		} else {
			tree.push(map.get(node.pgmId!)!);
		}
	});

	const cleanTree = (arr: ProgramTree[]): MenuTree[] =>
		arr.map(({ children, key, icon, pgmNm }) => ({
			key,
			icon,
			label: pgmNm!,
			...(children?.length ? { children: cleanTree(children || []) } : {}),
		}));

	return cleanTree(tree);
}

export const getAllChildNodes = (node: ProgramTree): ProgramTree[] => {
	if (!node.children) return [node];
	return [node, ...node.children.flatMap(getAllChildNodes)];
};

export function deepEqual<T>(
	a: Loose<T>,
	b: Loose<T> | undefined,
	options: { strict?: boolean } = { strict: false },
): boolean {
	if (a === b) return true;

	// Handle null or non-objects
	if (typeof a !== 'object' || typeof b !== 'object' || a == null || b == null) {
		return false;
	}

	// Handle arrays
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		return a.every((item, index) => deepEqual(item, b[index], options));
	}

	// If one is array and the other isn’t
	if (Array.isArray(a) !== Array.isArray(b)) return false;

	// Handle plain objects
	const keysA = Object.keys(a);
	const keysB = Object.keys(b);

	// In strict mode, both must have the same keys
	if (options.strict && keysA.length !== keysB.length) return false;

	// In loose mode, only check keysA are present in b
	for (const key of keysA) {
		if (!(key in b)) {
			if (options.strict) return false;
			else continue;
		}
		if (!deepEqual(a[key], b[key], options)) return false;
	}

	return true;
}

export function removeNonSerializable(obj: any): any {
	if (obj === null || typeof obj !== 'object') return obj;

	if (Array.isArray(obj)) {
		return obj.map(removeNonSerializable);
	}

	const clean: Record<string, any> = {};
	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === 'function') continue;
		if (value instanceof Element) continue; // DOM
		if (value && value.constructor && value.constructor.name === 'FiberNode') continue;
		clean[key] = removeNonSerializable(value);
	}
	return clean;
}

// Convert Dayjs | Timestamp tz string into YYYY-MM-DD
/** Join array to comma-separated string, or return empty string for undefined/null */
export function joinOrEmpty(value: string | string[] | undefined | null): string {
	if (value == null) return '';
	return Array.isArray(value) ? value.join(',') : String(value);
}

export function convertDate(date: dayjs.Dayjs | string) {
	if (!date) return '';

	// If it's a Day.js object, format directly
	if (dayjs.isDayjs(date)) {
		return date.format('YYYY-MM-DD');
	}

	// If it's a string, parse as local time to avoid -1 day issue
	return dayjs(date.replace?.('Z', '')).format('YYYY-MM-DD');
}


export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export const getTextFromLabel = (node: React.ReactNode): string => {
	if (typeof node === 'string' || typeof node === 'number') {
		return String(node);
	}

	if (Array.isArray(node)) {
		return node.map(getTextFromLabel).join('');
	}

	if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
		return getTextFromLabel(node.props.children);
	}

	return '';
};

export function generateUUID() {
	return uuidv4();
}

export function detectReportTypeFromFileName(fileName: string) {
	if (!fileName || fileName === '') return 'unknown';
	const extension = fileName.split('.').pop();
	if (extension === 'pdf') {
		return 'pdf';
	} else if (extension === 'docx') {
		return 'docx';
	} else if (extension === 'xlsx') {
		return 'xlsx';
	} else {
		return 'unknown';
	}
}