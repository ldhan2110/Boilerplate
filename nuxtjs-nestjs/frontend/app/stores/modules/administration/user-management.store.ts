import { defineStore } from 'pinia'
import type { UserInfoDto, UserInfoListDto, PageEvent, SortEvent } from '~/types'

export const useUserManagementStore = defineStore('user-management', () => {
  // ─── Shared state ───
  const rows = ref<UserInfoDto[]>([])
  const totalRecords = ref(0)
  const pagination = ref<PageEvent>({ page: 1, pageSize: 25 })
  const sortState = ref<SortEvent | null>(null)
  const searchParams = ref<Record<string, any>>({})

  // ─── Query ───
  const requestBody = computed(() => {
    const body: Record<string, any> = {
      pagination: { current: pagination.value.page, pageSize: pagination.value.pageSize },
    }
    const search = searchParams.value
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

  // ─── Actions ───
  function fetchData() {
    queryEnabled.value = true
    refetch()
  }

  function handleSearch(params: Record<string, any>) {
    searchParams.value = params
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
    rows,
    totalRecords,
    pagination,
    isLoading,
    fetchData,
    refetch,
    handleSearch,
    handlePage,
    handleSort,
  }
})
