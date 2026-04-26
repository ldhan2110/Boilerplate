import type { ProcFlag, ProcRow } from '~/types/table'

export interface UseTableProcFlagOptions {
  rows: Ref<any[]>
  rowKey: Ref<string>
  dirtyRows: Ref<Set<string | number>>
}

export interface UseTableProcFlagReturn {
  procMap: Ref<Map<string | number, ProcFlag>>
  deletedRows: Ref<Map<string | number, any>>
  initFlags: () => void
  markInsert: (key: string | number) => void
  markUpdate: (key: string | number) => void
  markDelete: (key: string | number) => void
  getFlag: (key: string | number) => ProcFlag
  getRowsByFlag: <T = any>(flags?: ProcFlag[]) => ProcRow<T>[]
  getRowByKey: <T = any>(key: string | number) => ProcRow<T> | undefined
  hasChanges: () => boolean
  clearProcFlags: () => void
  activeRows: ComputedRef<any[]>
}

let _tempCounter = 0

export function generateTempKey(): string {
  return `__temp_${Date.now()}_${++_tempCounter}`
}

export function useTableProcFlag(options: UseTableProcFlagOptions): UseTableProcFlagReturn {
  const { rows, rowKey, dirtyRows } = options

  const procMap = ref(new Map<string | number, ProcFlag>()) as Ref<Map<string | number, ProcFlag>>
  const deletedRows = ref(new Map<string | number, any>()) as Ref<Map<string | number, any>>

  function initFlags() {
    const newMap = new Map<string | number, ProcFlag>()
    for (const row of rows.value) {
      const key = row[rowKey.value]
      // Preserve existing flags for keys already tracked (e.g. inserted rows)
      newMap.set(key, procMap.value.get(key) ?? 'S')
    }
    // Also preserve D-flagged rows (they are not in rows.value)
    for (const [key, flag] of procMap.value) {
      if (flag === 'D' && !newMap.has(key)) {
        newMap.set(key, 'D')
      }
    }
    procMap.value = newMap
  }

  // Initialize on mount and when rows change
  watch(rows, () => initFlags(), { immediate: true, flush: 'sync' })

  // Watch dirtyRows — mark S rows as U when edited
  watch(dirtyRows, (dirty) => {
    for (const key of dirty) {
      const current = procMap.value.get(key)
      if (current === 'S') {
        procMap.value.set(key, 'U')
        // Trigger reactivity
        procMap.value = new Map(procMap.value)
      }
    }
  }, { deep: true })

  function markInsert(key: string | number) {
    procMap.value.set(key, 'I')
    procMap.value = new Map(procMap.value)
  }

  function markUpdate(key: string | number) {
    const current = procMap.value.get(key)
    // Only S -> U. I stays I, U stays U.
    if (current === 'S') {
      procMap.value.set(key, 'U')
      procMap.value = new Map(procMap.value)
    }
  }

  function markDelete(key: string | number) {
    const current = procMap.value.get(key)
    if (current === 'I') {
      // Never-persisted row: remove entirely
      procMap.value.delete(key)
      procMap.value = new Map(procMap.value)
      const idx = rows.value.findIndex(r => r[rowKey.value] === key)
      if (idx !== -1) rows.value.splice(idx, 1)
    } else {
      // Stash row data, mark D, remove from visible rows
      const idx = rows.value.findIndex(r => r[rowKey.value] === key)
      if (idx !== -1) {
        const row = rows.value[idx]
        deletedRows.value.set(key, JSON.parse(JSON.stringify(row)))
        deletedRows.value = new Map(deletedRows.value)
        rows.value.splice(idx, 1)
      }
      procMap.value.set(key, 'D')
      procMap.value = new Map(procMap.value)
    }
  }

  function getFlag(key: string | number): ProcFlag {
    return procMap.value.get(key) ?? 'S'
  }

  function getRowsByFlag<T = any>(flags?: ProcFlag[]): ProcRow<T>[] {
    const result: ProcRow<T>[] = []

    // Active rows (S, I, U)
    for (const row of rows.value) {
      const key = row[rowKey.value]
      const flag = procMap.value.get(key) ?? 'S'
      if (!flags || flags.includes(flag)) {
        result.push({ data: row as T, procFlag: flag })
      }
    }

    // Deleted rows (D) — from stash
    if (!flags || flags.includes('D')) {
      for (const [key, row] of deletedRows.value) {
        result.push({ data: row as T, procFlag: 'D' })
      }
    }

    return result
  }

  function getRowByKey<T = any>(key: string | number): ProcRow<T> | undefined {
    // Check active rows
    const row = rows.value.find((r: any) => r[rowKey.value] === key)
    if (row) {
      const flag = procMap.value.get(key) ?? 'S'
      return { data: row as T, procFlag: flag }
    }
    // Check deleted stash
    const deleted = deletedRows.value.get(key)
    if (deleted) {
      return { data: deleted as T, procFlag: 'D' }
    }
    return undefined
  }

  function hasChanges(): boolean {
    for (const flag of procMap.value.values()) {
      if (flag !== 'S') return true
    }
    return false
  }

  function clearProcFlags() {
    // Restore D-flagged rows back into rows array
    for (const [, row] of deletedRows.value) {
      rows.value.push(row)
    }
    deletedRows.value = new Map()

    // Remove I-flagged rows (never persisted)
    const keysToRemove: (string | number)[] = []
    for (const [key, flag] of procMap.value) {
      if (flag === 'I') keysToRemove.push(key)
    }
    for (const key of keysToRemove) {
      const idx = rows.value.findIndex((r: any) => r[rowKey.value] === key)
      if (idx !== -1) rows.value.splice(idx, 1)
    }

    // Reset all flags to S
    const newMap = new Map<string | number, ProcFlag>()
    for (const row of rows.value) {
      newMap.set(row[rowKey.value], 'S')
    }
    procMap.value = newMap

    // Clear dirty tracking
    dirtyRows.value.clear()
  }

  // D rows are already spliced from rows.value in markDelete,
  // so activeRows just returns rows.value directly.
  const activeRows = computed(() => rows.value)

  return {
    procMap,
    deletedRows,
    initFlags,
    markInsert,
    markUpdate,
    markDelete,
    getFlag,
    getRowsByFlag,
    getRowByKey,
    hasChanges,
    clearProcFlags,
    activeRows,
  }
}
