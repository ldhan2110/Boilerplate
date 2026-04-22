import { AGGERATE_TYPE } from '@/types';

export function aggregate<T>(data: T[], key: keyof T, type: AGGERATE_TYPE): number {
	if (data.length === 0) return 0;
	switch (type) {
		case AGGERATE_TYPE.SUM:
			return data.reduce((acc, item) => {
				const value = item[key];
				return acc + (typeof value === 'number' ? value : 0);
			}, 0);
		case AGGERATE_TYPE.MAX:
			return Math.max(
				...data.map((item) =>
					typeof item[key] === 'number' ? (item[key] as number) : Number.NEGATIVE_INFINITY,
				),
			);
		case AGGERATE_TYPE.MIN:
			return Math.min(
				...data.map((item) =>
					typeof item[key] === 'number' ? (item[key] as number) : Number.POSITIVE_INFINITY,
				),
			);
		case AGGERATE_TYPE.COUNT:
			return data.length;
		case AGGERATE_TYPE.UNIQUE_COUNT:
			return new Set(data.map((item) => item[key])).size;
		default:
			throw new Error(`Unknown aggregate type: ${type}`);
	}
}
