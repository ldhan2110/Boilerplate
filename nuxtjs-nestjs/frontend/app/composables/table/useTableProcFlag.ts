import type { ProcFlag } from '~/types/table'

export interface UseTableProcFlagOptions {
  rows: Ref<any[]>
  rowKey: Ref<string>
  dirtyRows: Ref<Set<string | number>>
}

export interface UseTableProcFlagReturn {
  deletedRows: Ref<any[]>
  initFlags: () => void
  markInsert: (key: string | number) => void
  markUpdate: (key: string | number) => void
  markDelete: (key: string | number) => void
  getFlag: (key: string | number) => ProcFlag
  getRowsByFlag: (flags?: ProcFlag[]) => any[]
  getRowByKey: (key: string | number) => any | undefined
  hasChanges: () => boolean
  clearProcFlags: () => void
}

let _tempCounter = 0

export function generateTempKey(): string {
  return `__temp_${Date.now()}_${++_tempCounter}`
}

export function useTableProcFlag(options: UseTableProcFlagOptions): UseTableProcFlagReturn {
  const { rows, rowKey, dirtyRows } = options

  // Stash for D-flagged rows (removed from visible rows array)
  const deletedRows = ref<any[]>([])

  function initFlags() {
    for (const row of rows.value) {
      if (!row.procFlag) {
        row.procFlag = 'S'
      }
    }
  }

  // Initialize on mount and when rows change
  watch(rows, () => initFlags(), { immediate: true, flush: 'sync' })

  // Watch dirtyRows — mark S rows as U when edited
  watch(dirtyRows, (dirty) => {
    for (const key of dirty) {
      const row = rows.value.find((r: any) => r[rowKey.value] === key)
      if (row && row.procFlag === 'S') {
        row.procFlag = 'U'
      }
    }
  }, { deep: true })

  function markInsert(key: string | number) {
    const row = rows.value.find((r: any) => r[rowKey.value] === key)
    if (row) row.procFlag = 'I'
  }

  function markUpdate(key: string | number) {
    const row = rows.value.find((r: any) => r[rowKey.value] === key)
    // Only S -> U. I stays I, U stays U.
    if (row && row.procFlag === 'S') {
      row.procFlag = 'U'
    }
  }

  function markDelete(key: string | number) {
    const row = rows.value.find((r: any) => r[rowKey.value] === key)
    if (!row) return

    if (row.procFlag === 'I') {
      // Never-persisted row: remove entirely
      const idx = rows.value.indexOf(row)
      if (idx !== -1) {
        rows.value.splice(idx, 1)
        triggerRef(rows)
      }
    } else {
      // Stash row data, mark D, remove from visible rows
      row.procFlag = 'D'
      const idx = rows.value.indexOf(row)
      if (idx !== -1) {
        deletedRows.value.push(JSON.parse(JSON.stringify(row)))
        rows.value.splice(idx, 1)
        triggerRef(rows)
      }
    }
  }

  function getFlag(key: string | number): ProcFlag {
    const row = rows.value.find((r: any) => r[rowKey.value] === key)
    return row?.procFlag ?? 'S'
  }

  function getRowsByFlag(flags?: ProcFlag[]): any[] {
    const result: any[] = []

    // Active rows (S, I, U)
    for (const row of rows.value) {
      if (!flags || flags.includes(row.procFlag)) {
        result.push(row)
      }
    }

    // Deleted rows (D) — from stash
    if (!flags || flags.includes('D')) {
      for (const row of deletedRows.value) {
        result.push(row)
      }
    }

    return result
  }

  function getRowByKey(key: string | number): any | undefined {
    // Check active rows
    const row = rows.value.find((r: any) => r[rowKey.value] === key)
    if (row) return row
    // Check deleted stash
    return deletedRows.value.find((r: any) => r[rowKey.value] === key)
  }

  function hasChanges(): boolean {
    if (deletedRows.value.length > 0) return true
    return rows.value.some((r: any) => r.procFlag !== 'S')
  }

  function clearProcFlags() {
    // Restore D-flagged rows back into rows array
    for (const row of deletedRows.value) {
      row.procFlag = 'S'
      rows.value.push(row)
    }
    deletedRows.value = []

    // Remove I-flagged rows (never persisted)
    for (let i = rows.value.length - 1; i >= 0; i--) {
      if (rows.value[i].procFlag === 'I') {
        rows.value.splice(i, 1)
      }
    }

    // Reset all remaining to S
    for (const row of rows.value) {
      row.procFlag = 'S'
    }

    // Clear dirty tracking
    dirtyRows.value.clear()

    // Trigger shallowRef reactivity for rows array mutations
    triggerRef(rows)
  }

  return {
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
  }
}
