import z from 'zod'
import type { CellConfig, ColumnDef, PageEvent, SortEvent, UserInfoDto, UserInfoListDto } from '~/types'
import { useLoadUsers, useSaveUsers } from './queries'

export function useUserManagement() {
  const toast = useAppToast()
  const { t } = useI18n()

  // --- Search form ---
  const searchSchema = z.object({
    searchText: z.string().optional(),
    useFlg: z.string().nullable().optional()
  })

  const searchForm = useAppForm({
    schema: searchSchema,
    initialValues: { searchText: '', useFlg: null },
    onSubmit: () => {},
    guard: false
  })

  // --- Table state ---
  const { tableRef, validate, getRows, clearChanges } = useAppDataTable<UserInfoDto>()
  const rows = ref<UserInfoDto[]>([])
  const totalRecords = ref(0)
  const pagination = ref<PageEvent>({ page: 1, pageSize: 25 })
  const sortState = ref<SortEvent | null>(null)

  // --- Column Definitions ---
  const columns: ColumnDef[] = [
    {
      field: 'usrId',
      header: t('user.usrId', 'User ID'),
      editable: true,
      editType: 'input',
      width: 130,
      sortable: true
    },
    {
      field: 'usrNm',
      header: t('user.usrNm', 'Name'),
      editable: true,
      editType: 'input',
      width: 150,
      sortable: true,
      validators: { required: true }
    },
    {
      field: 'usrEml',
      header: t('user.usrEml', 'Email'),
      editable: true,
      editType: 'input',
      width: 190,
      sortable: true
    },
    {
      field: 'usrPhn',
      header: t('user.usrPhn', 'Phone'),
      editable: true,
      editType: 'input',
      width: 140
    },
    {
      field: 'usrAddr',
      header: t('user.usrAddr', 'Address'),
      editable: true,
      editType: 'input',
      width: 200
    },
    {
      field: 'usrDesc',
      header: t('user.usrDesc', 'Description'),
      editable: true,
      editType: 'input',
      width: 240
    },
    {
      field: 'roleId',
      header: t('user.roleId', 'Role'),
      editable: true,
      editType: 'input',
      width: 140
    },
    {
      field: 'useFlg',
      header: t('user.useFlg', 'Active'),
      editable: true,
      editType: 'toggle',
      editProps: { trueValue: 'Y', falseValue: 'N' },
      width: 90,
      align: 'center'
    }
  ]

  // usrId is editable only on new rows (procFlag === 'I')
  function cellConfig(row: any, field: string): CellConfig | void {
    if (field === 'usrId' && row.procFlag !== 'I') {
      return { editable: false }
    }
  }

  // ============== TanStack Query ==============
  const requestBody = computed(() => {
    const search = searchForm.values
    const body: Record<string, any> = {
      pagination: { current: pagination.value.page, pageSize: pagination.value.pageSize }
    }
    if (search.searchText) body.searchText = search.searchText
    if (search.useFlg !== null && search.useFlg !== undefined) body.useFlg = search.useFlg
    if (sortState.value) {
      const meta = sortState.value.multiSortMeta
      if (meta && meta.length > 1) {
        body.sorts = meta.map(s => ({ sortField: s.field, sortType: s.order === 1 ? 'ASC' : 'DESC' }))
      } else {
        body.sort = { sortField: sortState.value.field, sortType: sortState.value.order === 1 ? 'ASC' : 'DESC' }
      }
    }
    return body
  })

  const queryEnabled = ref(false)

  const {
    isFetching: isLoading,
    refetch
  } = useLoadUsers(requestBody, {
    enabled: queryEnabled,
    select: (result: UserInfoListDto) => {
      rows.value = result.userInfo
      totalRecords.value = result.total
      return result
    }
  })

  const {
    mutate: saveUsersMutate,
    isPending: isSaving
  } = useSaveUsers({
    onSuccess: () => {
      clearChanges()
      refetch()
    }
  })

  // ============== Event Handlers ==============
  function fetchData() {
    queryEnabled.value = true
    refetch()
  }

  function handleAddUser() {
    tableRef.value?.insertRow({
      useFlg: 'Y'
    })
  }

  function handleDeleteUser() {
    tableRef.value?.deleteSelected()
  }

  async function handleSaveUser() {
    const errors = validate()
    if (errors.length > 0) return
    const changed = getRows(['I', 'U', 'D'])
    if (changed.length === 0) {
      toast.showInfo(t('common.noChanges', 'No changes to save'))
      return
    }
    saveUsersMutate(changed)
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

  return {
    // Search Form
    searchForm,

    // API
    isLoading,
    isSaving,
    rows,
    totalRecords,
    fetchData,

    // Table
    tableRef,
    columns,
    cellConfig,
    validate,
    getRows,
    handleSearch,
    handlePage,
    handleSort,
    handleAddUser,
    handleDeleteUser,
    handleSaveUser
  }
}
