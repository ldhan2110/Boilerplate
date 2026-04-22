export type TreeMap = {
	parentToChildren: Map<string, string[]>;
	childToParent: Map<string, string>;
};

export function buildTreeMap<T>(
	items: T[],
	getValue: (item: T) => string,
	getLevel: (item: T) => number,
): TreeMap {
	const directChildren = new Map<string, string[]>();
	const childToParent = new Map<string, string>();
	const stack: { value: string; level: number }[] = [];

	for (const item of items) {
		const value = getValue(item);
		const level = getLevel(item);

		while (stack.length > 0 && stack[stack.length - 1].level >= level) {
			stack.pop();
		}

		if (stack.length > 0) {
			const parent = stack[stack.length - 1].value;
			childToParent.set(value, parent);

			if (!directChildren.has(parent)) {
				directChildren.set(parent, []);
			}
			directChildren.get(parent)!.push(value);
		}

		stack.push({ value, level });
	}

	const parentToChildren = new Map<string, string[]>();

	function collectDescendants(value: string): string[] {
		const direct = directChildren.get(value) ?? [];
		const all: string[] = [];
		for (const child of direct) {
			all.push(child);
			all.push(...collectDescendants(child));
		}
		return all;
	}

	for (const parent of directChildren.keys()) {
		parentToChildren.set(parent, collectDescendants(parent));
	}

	return { parentToChildren, childToParent };
}

export function getAncestors(value: string, treeMap: TreeMap): string[] {
	const ancestors: string[] = [];
	let current = treeMap.childToParent.get(value);
	while (current) {
		ancestors.push(current);
		current = treeMap.childToParent.get(current);
	}
	return ancestors;
}
