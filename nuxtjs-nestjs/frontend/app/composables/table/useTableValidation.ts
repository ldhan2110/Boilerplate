import type { ColumnDef, CellConfig, ValidationRules, ValidationError } from '~/types/table'

export interface UseTableValidationOptions {
  rows: Ref<any[]>
  displayedRows: Ref<any[]>
  rowKey: Ref<string>
  columnState: ColumnDef[]
  visibleColumns: Ref<ColumnDef[]>
  cellConfig: Ref<((row: any, field: string) => CellConfig | void) | undefined>
  editable: Ref<boolean | undefined>
  editableColumns: Ref<string[] | undefined>
}

export interface UseTableValidationReturn {
  errorMap: Ref<Map<string | number, Map<string, string[]>>>
  validateCell: (row: any, field: string) => string[]
  validateAll: () => ValidationError[]
  validate: () => ValidationError[]
  getErrors: () => ValidationError[]
  getCellErrors: (row: any, field: string) => string[]
  clearErrors: (rowKey?: string | number) => void
  isValid: ComputedRef<boolean>
  hasError: (row: any, field: string) => boolean
}

function runValidators(
  value: any,
  row: any,
  field: string,
  rules: ValidationRules,
  t: (key: string, params?: Record<string, any>) => string,
): string[] {
  const messages: string[] = []

  if (rules.required) {
    const isEmpty = value === null || value === undefined || value === ''
    if (isEmpty) {
      messages.push(rules.messages?.required ?? t('validation.required'))
    }
  }

  if (rules.minLength !== undefined && typeof value === 'string') {
    if (value.length < rules.minLength) {
      messages.push(
        rules.messages?.minLength ?? t('validation.minLength', { min: rules.minLength }),
      )
    }
  }

  if (rules.maxLength !== undefined && typeof value === 'string') {
    if (value.length > rules.maxLength) {
      messages.push(
        rules.messages?.maxLength ?? t('validation.maxLength', { max: rules.maxLength }),
      )
    }
  }

  if (rules.min !== undefined && value !== null && value !== undefined && value !== '') {
    if (Number(value) < rules.min) {
      messages.push(rules.messages?.min ?? t('validation.min', { min: rules.min }))
    }
  }

  if (rules.max !== undefined && value !== null && value !== undefined && value !== '') {
    if (Number(value) > rules.max) {
      messages.push(rules.messages?.max ?? t('validation.max', { max: rules.max }))
    }
  }

  if (rules.pattern !== undefined && value !== null && value !== undefined && value !== '') {
    if (!rules.pattern.test(String(value))) {
      messages.push(rules.messages?.pattern ?? t('validation.pattern'))
    }
  }

  if (rules.custom) {
    const result = rules.custom(value, row, field)
    if (result) {
      messages.push(result)
    }
  }

  return messages
}

export function useTableValidation(options: UseTableValidationOptions): UseTableValidationReturn {
  const {
    displayedRows,
    rowKey,
    columnState,
    visibleColumns,
    cellConfig,
  } = options

  const { t } = useI18n()

  const errorMap = ref(new Map<string | number, Map<string, string[]>>())

  function resolveValidators(row: any, field: string): ValidationRules | null {
    if (cellConfig.value) {
      const config = cellConfig.value(row, field)
      if (config?.validators) return config.validators
    }
    const col = columnState.find(c => c.field === field)
    return col?.validators ?? null
  }

  function validateCell(row: any, field: string): string[] {
    const rules = resolveValidators(row, field)
    const key = row[rowKey.value]

    if (!rules) {
      // Clear any existing errors for this cell
      const rowErrors = errorMap.value.get(key)
      if (rowErrors) {
        rowErrors.delete(field)
        if (rowErrors.size === 0) {
          errorMap.value.delete(key)
        }
      }
      triggerRef(errorMap)
      return []
    }

    const msgs = runValidators(row[field], row, field, rules, t)

    if (msgs.length > 0) {
      if (!errorMap.value.has(key)) {
        errorMap.value.set(key, new Map())
      }
      errorMap.value.get(key)!.set(field, msgs)
    } else {
      const rowErrors = errorMap.value.get(key)
      if (rowErrors) {
        rowErrors.delete(field)
        if (rowErrors.size === 0) {
          errorMap.value.delete(key)
        }
      }
    }

    triggerRef(errorMap)
    return msgs
  }

  function validateAll(): ValidationError[] {
    const errors: ValidationError[] = []

    for (const row of displayedRows.value) {
      for (const col of visibleColumns.value) {
        if (!col.field) continue
        const msgs = validateCell(row, col.field)
        if (msgs.length > 0) {
          errors.push({
            field: col.field,
            rowKey: row[rowKey.value],
            messages: msgs,
          })
        }
      }
    }

    return errors
  }

  function validate(): ValidationError[] {
    return validateAll()
  }

  function getErrors(): ValidationError[] {
    const errors: ValidationError[] = []
    for (const [rKey, fieldMap] of errorMap.value) {
      for (const [field, msgs] of fieldMap) {
        if (msgs.length > 0) {
          errors.push({ field, rowKey: rKey, messages: msgs })
        }
      }
    }
    return errors
  }

  function getCellErrors(row: any, field: string): string[] {
    const key = row[rowKey.value]
    return errorMap.value.get(key)?.get(field) ?? []
  }

  function clearErrors(rKey?: string | number): void {
    if (rKey !== undefined) {
      errorMap.value.delete(rKey)
    } else {
      errorMap.value.clear()
    }
    triggerRef(errorMap)
  }

  const isValid = computed(() => errorMap.value.size === 0)

  function hasError(row: any, field: string): boolean {
    return (errorMap.value.get(row[rowKey.value])?.get(field)?.length ?? 0) > 0
  }

  return {
    errorMap,
    validateCell,
    validateAll,
    validate,
    getErrors,
    getCellErrors,
    clearErrors,
    isValid,
    hasError,
  }
}
