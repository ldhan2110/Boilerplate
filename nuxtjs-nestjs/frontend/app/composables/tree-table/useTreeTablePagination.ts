import type { BackendMode, PageEvent } from '~/types/table'

export interface UseTreeTablePaginationOptions {
  paginationMode: Ref<BackendMode>
  pageSize: Ref<number>
  pageSizeOptions: Ref<number[]>
  rows: Ref<any[]>
  totalRecords: Ref<number | undefined>
  emit: {
    page: (payload: PageEvent) => void
  }
}

export interface UseTreeTablePaginationReturn {
  first: Ref<number>
  currentPage: Ref<number>
  currentPageSize: Ref<number>
  totalCount: Ref<number>
  displayedRows: Ref<any[]>
  showPaginator: Ref<boolean>
  onPageChange: (event: any) => void
}

export function useTreeTablePagination(options: UseTreeTablePaginationOptions): UseTreeTablePaginationReturn {
  const {
    paginationMode,
    pageSize,
    pageSizeOptions,
    rows,
    totalRecords,
    emit,
  } = options

  const route = useRoute()
  const router = useRouter()

  const currentPage = ref(Number(route.query.p) || 0)
  const currentPageSize = ref(Number(route.query.ps) || pageSize.value)
  const first = ref(currentPage.value * currentPageSize.value)

  const totalCount = computed(() => {
    if (paginationMode.value === 'server') {
      return totalRecords.value ?? 0
    }
    return rows.value.length
  })

  const showPaginator = computed(() => {
    return paginationMode.value !== 'none'
  })

  const displayedRows = computed(() => {
    if (paginationMode.value === 'server') {
      return rows.value
    }
    return rows.value.slice(first.value, first.value + currentPageSize.value)
  })

  function syncUrlParams() {
    router.replace({
      query: {
        ...route.query,
        p: currentPage.value.toString(),
        ps: currentPageSize.value.toString(),
      },
    })
  }

  function onPageChange(event: any) {
    first.value = event.first
    currentPage.value = event.page
    currentPageSize.value = event.rows
    syncUrlParams()

    if (paginationMode.value === 'server') {
      emit.page({ page: currentPage.value, pageSize: currentPageSize.value })
    }
  }

  return {
    first,
    currentPage,
    currentPageSize,
    totalCount,
    displayedRows,
    showPaginator,
    onPageChange,
  }
}
