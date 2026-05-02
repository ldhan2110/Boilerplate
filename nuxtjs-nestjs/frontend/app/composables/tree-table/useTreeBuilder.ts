import type { TreeNode } from '~/types/tree-table'

interface UseTreeBuilderOptions {
  rows: Ref<any[]>
  rowKey: string
  parentKey: string
}

export interface UseTreeBuilderReturn {
  treeNodes: ComputedRef<TreeNode[]>
  nodeMap: ComputedRef<Map<string, TreeNode>>
  expandedKeys: Ref<Record<string, boolean>>
  findNode: (key: string | number) => TreeNode | undefined
  flatFromTree: () => any[]
  reparentNode: (nodeKey: string | number, newParentKey: string | number | null) => void
  expandAll: () => void
  collapseAll: () => void
  getNodeLevel: (key: string | number) => number
  getChildren: (parentKeyValue: string | number | null) => any[]
}

export function useTreeBuilder(options: UseTreeBuilderOptions): UseTreeBuilderReturn {
  const { rows, rowKey, parentKey } = options

  const expandedKeys = ref<Record<string, boolean>>({})

  // Build tree and nodeMap together — O(n)
  const built = computed(() => {
    const items = rows.value
    const map = new Map<string, TreeNode>()
    const childrenMap = new Map<string | null, TreeNode[]>()

    // Pass 1: create TreeNode for each row, index by key
    for (const row of items) {
      const key = String(row[rowKey])
      const node: TreeNode = { key, data: row, children: [], leaf: false }
      map.set(key, node)

      // Group by parentKey value
      const pk = row[parentKey] != null ? String(row[parentKey]) : null
      let group = childrenMap.get(pk)
      if (!group) {
        group = []
        childrenMap.set(pk, group)
      }
      group.push(node)
    }

    // Pass 2: assign children, determine roots
    const roots: TreeNode[] = []
    for (const node of map.values()) {
      const pk = node.data[parentKey] != null ? String(node.data[parentKey]) : null
      if (pk === null || !map.has(pk)) {
        roots.push(node)
      }
    }

    // Assign children from grouping
    for (const node of map.values()) {
      const children = childrenMap.get(node.key)
      if (children && children.length > 0) {
        node.children = children
        node.leaf = false
      } else {
        node.children = undefined
        node.leaf = true
      }
    }

    return { roots, map }
  })

  const treeNodes = computed(() => built.value.roots)
  const nodeMap = computed(() => built.value.map)

  function findNode(key: string | number): TreeNode | undefined {
    return nodeMap.value.get(String(key))
  }

  function flatFromTree(): any[] {
    const result: any[] = []
    function walk(nodes: TreeNode[] | undefined) {
      if (!nodes) return
      for (const node of nodes) {
        result.push(node.data)
        walk(node.children)
      }
    }
    walk(treeNodes.value)
    return result
  }

  function reparentNode(nodeKey: string | number, newParentKey: string | number | null): void {
    const node = findNode(nodeKey)
    if (!node) return
    node.data[parentKey] = newParentKey
    triggerRef(rows as Ref)
  }

  function expandAll(): void {
    const keys: Record<string, boolean> = {}
    for (const [key, node] of nodeMap.value) {
      if (!node.leaf) {
        keys[String(key)] = true
      }
    }
    expandedKeys.value = keys
  }

  function collapseAll(): void {
    expandedKeys.value = {}
  }

  function getNodeLevel(key: string | number): number {
    let level = 0
    let current = findNode(key)
    if (!current) return -1
    while (current) {
      const pk = current.data[parentKey] ?? null
      if (pk === null || !nodeMap.value.has(String(pk))) break
      current = nodeMap.value.get(String(pk))
      level++
    }
    return level
  }

  function getChildren(parentKeyValue: string | number | null): any[] {
    return rows.value.filter((row: any) => {
      const pk = row[parentKey] ?? null
      return pk === parentKeyValue
    })
  }

  return {
    treeNodes,
    nodeMap,
    expandedKeys,
    findNode,
    flatFromTree,
    reparentNode,
    expandAll,
    collapseAll,
    getNodeLevel,
    getChildren,
  }
}
