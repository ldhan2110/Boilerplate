import { defineStore } from 'pinia'
import type {
  RoleDto,
  RoleListDto,
  PageEvent,
  SortEvent,
  SearchRoleDto,
} from '~/types'

export const useRoleManagementStore = defineStore('role-management', () => {
  // ─── Table state (shared: RoleTable reads, search triggers refetch) ───
  const rows = ref<RoleDto[]>([])
  const totalRecords = ref(0)
  const pagination = ref<PageEvent>({ page: 1, pageSize: 25 })
  const sortState = ref<SortEvent | null>(null)

  // ─── Dialog state (shared: RoleTable opens, RoleDialog reads) ───
  const dialogVisible = ref(false)
  const dialogMode = ref<'create' | 'edit'>('create')
  const editingRole = ref<RoleDto | null>(null)

  // ─── Query: Role list ───
  const searchParams = ref<SearchRoleDto>({})

  const requestBody = computed(() => {
    const body: SearchRoleDto = {
      ...searchParams.value,
      pagination: { current: pagination.value.page, pageSize: pagination.value.pageSize },
    }
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

  const { isFetching: isLoading, refetch } = useLoadRoles(requestBody, {
    enabled: queryEnabled,
    select: (result: RoleListDto) => {
      rows.value = result.roleList
      totalRecords.value = result.total
      return result
    },
  })

  // ─── Mutation: Delete roles ───
  const { mutate: deleteRolesMutate, isPending: isDeleting } = useDeleteRoles({
    onSuccess: () => refetch(),
  })

  // ─── Actions ───
  function fetchData(params?: Record<string, any>) {
    if (params !== undefined) {
      searchParams.value = params
    }
    queryEnabled.value = true
    refetch()
  }

  function handlePage(event: PageEvent) {
    pagination.value = event
    fetchData()
  }

  function handleSort(event: SortEvent) {
    sortState.value = event
    fetchData()
  }

  function handleSearch(params: Record<string, any>) {
    pagination.value = { ...pagination.value, page: 1 }
    fetchData(params)
  }

  function openDialog(mode: 'create' | 'edit', role?: RoleDto) {
    dialogMode.value = mode
    editingRole.value = mode === 'edit' && role ? role : null
    dialogVisible.value = true
  }

  function closeDialog() {
    dialogVisible.value = false
    editingRole.value = null
  }

  function deleteRoles(selected: RoleDto[]) {
    deleteRolesMutate(selected)
  }

  function refetchList() {
    refetch()
  }

  return {
    // Table
    rows,
    totalRecords,
    pagination,
    sortState,
    isLoading,
    isDeleting,
    // Dialog
    dialogVisible,
    dialogMode,
    editingRole,
    // Actions
    fetchData,
    handlePage,
    handleSort,
    handleSearch,
    openDialog,
    closeDialog,
    deleteRoles,
    refetchList,
  }
})
