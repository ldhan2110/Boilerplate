import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import z from 'zod'
import type { UserInfoDto, UserInfoListDto, PageEvent, SortEvent, CellConfig, ColumnDef, AppDataTableExposed, ProcFlag } from '~/types'

export const useUserManagementStore = defineStore('user-management', () => {
  const toast = useAppToast()
  const { t } = useI18n()

  // ─── Search ───
  const searchSchema = z.object({
    searchText: z.string().optional(),
    useFlg: z.string().nullable().optional(),
  })

  const searchForm = markRaw(useAppForm({
    schema: searchSchema,
    initialValues: { searchText: '', useFlg: null },
    onSubmit: () => {},
    guard: false,
  }))

  const statusOptions = computed(() => [
    { label: t('common.all'), value: '' },
    { label: t('common.active'), value: 'Y' },
    { label: t('common.inactive'), value: 'N' },
  ])

  // ─── Table state ───
  const tableRef = ref<AppDataTableExposed<UserInfoDto> | null>(null)
  const rows = ref<UserInfoDto[]>([])
  const totalRecords = ref(0)
  const pagination = ref<PageEvent>({ page: 1, pageSize: 25 })
  const sortState = ref<SortEvent | null>(null)

  // ─── Columns ───
  const columns = computed<ColumnDef[]>(() => [
    { field: 'usrId', header: t('user.usrId'), editable: true, editType: 'input', width: 130, sortable: true },
    { field: 'usrNm', header: t('user.usrNm'), editable: true, editType: 'input', width: 150, sortable: true, validators: { required: true } },
    { field: 'usrEml', header: t('user.usrEml'), editable: true, editType: 'input', width: 190, sortable: true },
    { field: 'usrPhn', header: t('user.usrPhn'), editable: true, editType: 'input', width: 140 },
    { field: 'usrAddr', header: t('user.usrAddr'), editable: true, editType: 'input', width: 200 },
    { field: 'usrDesc', header: t('user.usrDesc'), editable: true, editType: 'input', width: 240 },
    { field: 'roleId', header: t('user.roleId'), editable: true, editType: 'input', width: 140 },
    { field: 'useFlg', header: t('user.useFlg'), editable: true, editType: 'toggle', editProps: { trueValue: 'Y', falseValue: 'N' }, width: 90, align: 'center' },
  ])

  function cellConfig(row: any, field: string): CellConfig | void {
    if (field === 'usrId' && row.procFlag !== 'I') {
      return { editable: false }
    }
  }

  // ─── Query ───
  const requestBody = computed(() => {
    const search = searchForm.values
    const body: Record<string, any> = {
      pagination: { current: pagination.value.page, pageSize: pagination.value.pageSize },
    }
    if (search.searchText) body.searchText = search.searchText
    if (search.useFlg !== null && search.useFlg !== undefined) body.useFlg = search.useFlg
    if (sortState.value) {
      const meta = sortState.value.multiSortMeta
      if (meta && meta.length > 1) {
        body.sorts = meta.map((s) => ({ sortField: s.field, sortType: s.order === 1 ? 'ASC' : 'DESC' }))
      } else {
        body.sort = { sortField: sortState.value.field, sortType: sortState.value.order === 1 ? 'ASC' : 'DESC' }
      }
    }
    return body
  })

  const queryEnabled = ref(false)

  const { isFetching: isLoading, refetch } = useLoadUsers(requestBody, {
    enabled: queryEnabled,
    select: (result: UserInfoListDto) => {
      rows.value = result.userInfo
      totalRecords.value = result.total
      return result
    },
  })

  const { mutate: saveUsersMutate, isPending: isSaving } = useSaveUsers({
    onSuccess: () => {
      tableRef.value?.clearChanges()
      refetch()
    },
  })

  // ─── Actions ───
  function registerTable(ref: AppDataTableExposed<UserInfoDto>) {
    tableRef.value = ref
  }

  function fetchData() {
    queryEnabled.value = true
    refetch()
  }

  function handleSearch() {
    pagination.value = { ...pagination.value, page: 1 }
    fetchData()
  }

  function handlePage(event: PageEvent) {
    pagination.value = event
    fetchData()
  }

  function handleSort(event: SortEvent) {
    sortState.value = event
    fetchData()
  }

  function handleAdd() {
    tableRef.value?.insertRow({ useFlg: 'Y' } as any)
  }

  function handleDelete() {
    tableRef.value?.deleteSelected()
  }

  function handleSave() {
    const errors = tableRef.value?.validate() ?? []
    if (errors.length > 0) return
    const changed = tableRef.value?.getRows(['I', 'U', 'D'] as ProcFlag[]) ?? []
    if (changed.length === 0) {
      toast.showInfo(t('common.noChanges'))
      return
    }
    saveUsersMutate(changed)
  }

  return {
    // Search
    searchForm,
    statusOptions,
    // Table
    rows,
    totalRecords,
    columns,
    cellConfig,
    pagination,
    sortState,
    isLoading,
    isSaving,
    // Actions
    registerTable,
    fetchData,
    handleSearch,
    handlePage,
    handleSort,
    handleAdd,
    handleDelete,
    handleSave,
  }
})
