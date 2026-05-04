import type { DataMode, BackendMode, PageEvent } from '~/types/table'

export interface UseTablePaginationOptions {
  dataMode: Ref<DataMode>
  paginationMode: Ref<BackendMode>
  pageSize: Ref<number>
  pageSizeOptions: Ref<number[]>
  rows: Ref<any[]>
  totalRecords: Ref<number | undefined>
  virtualScroll: Ref<boolean>
  onLoadMore?: Ref<((params: PageEvent) => Promise<void>) | undefined>
  emit: {
    page: (payload: PageEvent) => void
    loadMore: () => void
  }
}

export interface UseTablePaginationReturn {
  first: Ref<number>
  currentPage: Ref<number>
  currentPageSize: Ref<number>
  totalCount: Ref<number>
  displayedRows: Ref<any[]>
  showPaginator: Ref<boolean>
  isLoadingMore: Ref<boolean>
  onPageChange: (event: any) => void
  sentinelRef: Ref<HTMLElement | null>
  setupInfiniteScroll: () => void
  teardownInfiniteScroll: () => void
}

export function useTablePagination(options: UseTablePaginationOptions): UseTablePaginationReturn {
  const {
    dataMode,
    paginationMode,
    pageSize,
    pageSizeOptions,
    rows,
    totalRecords,
    virtualScroll,
    onLoadMore,
    emit,
  } = options

  const route = useRoute()
  const router = useRouter()

  const currentPage = ref(Number(route.query.p) || 1)
  const currentPageSize = ref(Number(route.query.ps) || pageSize.value)
  const first = ref((currentPage.value - 1) * currentPageSize.value)
  const isLoadingMore = ref(false)
  const infiniteScrollPage = ref(0)
  const sentinelRef = ref<HTMLElement | null>(null)
  let observer: IntersectionObserver | null = null

  const totalCount = computed(() => {
    if (dataMode.value === 'all' || dataMode.value === 'infiniteScroll') {
      return rows.value.length
    }
    if (paginationMode.value === 'server') {
      return totalRecords.value ?? 0
    }
    return rows.value.length
  })

  const showPaginator = computed(() => {
    return dataMode.value === 'pagination'
  })

  const displayedRows = computed(() => {
    if (dataMode.value === 'all' || dataMode.value === 'infiniteScroll') {
      return rows.value
    }
    if (paginationMode.value === 'server') {
      return rows.value
    }
    return rows.value.slice(first.value, first.value + currentPageSize.value)
  })

  function syncUrlParams() {
    if (dataMode.value !== 'pagination') return
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
    currentPage.value = event.page + 1
    currentPageSize.value = event.rows
    syncUrlParams()

    if (paginationMode.value === 'server') {
      emit.page({ page: currentPage.value, pageSize: currentPageSize.value })
    }
  }

  function setupInfiniteScroll() {
    if (dataMode.value !== 'infiniteScroll') return
    if (!onLoadMore?.value) {
      console.warn('[AppDataTable] dataMode="infiniteScroll" requires onLoadMore prop')
      return
    }

    observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting && !isLoadingMore.value) {
          isLoadingMore.value = true
          infiniteScrollPage.value++
          try {
            await onLoadMore.value!({
              page: infiniteScrollPage.value,
              pageSize: currentPageSize.value,
            })
          } finally {
            isLoadingMore.value = false
          }
          emit.loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (sentinelRef.value) {
      observer.observe(sentinelRef.value)
    }
  }

  function teardownInfiniteScroll() {
    observer?.disconnect()
    observer = null
  }

  watch(sentinelRef, (el) => {
    if (el && dataMode.value === 'infiniteScroll') {
      observer?.observe(el)
    }
  })

  return {
    first,
    currentPage,
    currentPageSize,
    totalCount,
    displayedRows,
    showPaginator,
    isLoadingMore,
    onPageChange,
    sentinelRef,
    setupInfiniteScroll,
    teardownInfiniteScroll,
  }
}
