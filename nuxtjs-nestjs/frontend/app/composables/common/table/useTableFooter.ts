import type { ColumnDef, FooterAgg, AggregationType } from '~/types/table'

export interface UseTableFooterOptions {
  rows: Ref<any[]>
  visibleColumns: Ref<ColumnDef[]>
  footerAggregations: Ref<FooterAgg[] | undefined>
  showFooter: Ref<boolean | undefined>
}

export interface FooterValue {
  value: number
  formatted: string
}

export interface UseTableFooterReturn {
  footerValues: Ref<Record<string, FooterValue>>
  firstNonAggColumn: Ref<string | null>
}

function aggregate(values: number[], type: AggregationType): number {
  const valid = values.filter(v => v !== null && v !== undefined && !isNaN(v))
  if (valid.length === 0) return 0

  switch (type) {
    case 'sum':
      return valid.reduce((a, b) => a + b, 0)
    case 'avg':
      return valid.reduce((a, b) => a + b, 0) / valid.length
    case 'min':
      return Math.min(...valid)
    case 'max':
      return Math.max(...valid)
    case 'count':
      return valid.length
  }
}

export function useTableFooter(options: UseTableFooterOptions): UseTableFooterReturn {
  const { rows, visibleColumns, footerAggregations, showFooter } = options

  const footerValues = computed<Record<string, FooterValue>>(() => {
    if (!showFooter.value) return {}

    const result: Record<string, FooterValue> = {}

    for (const col of visibleColumns.value) {
      const footerAgg = footerAggregations.value?.find(fa => fa.field === col.field)
      const aggType = footerAgg?.type ?? col.aggregation
      if (!aggType) continue

      const values = rows.value.map(row => Number(row[col.field!]) || 0)
      const value = aggregate(values, aggType)
      const formatted = footerAgg?.format
        ? footerAgg.format(value)
        : value.toLocaleString()

      result[col.field!] = { value, formatted }
    }

    return result
  })

  const firstNonAggColumn = computed<string | null>(() => {
    if (!showFooter.value) return null
    for (const col of visibleColumns.value) {
      if (!footerValues.value[col.field!]) {
        return col.field!
      }
    }
    return null
  })

  return {
    footerValues,
    firstNonAggColumn,
  }
}
