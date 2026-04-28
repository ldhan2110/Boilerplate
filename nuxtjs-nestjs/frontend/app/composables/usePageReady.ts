// frontend/app/composables/usePageReady.ts

interface UsePageReadyOptions {
  manual?: boolean
}

interface UsePageReadyReturn {
  isReady: Readonly<Ref<boolean>>
  ready: () => void
}

export function usePageReady(options: UsePageReadyOptions = {}): UsePageReadyReturn {
  const { manual = false } = options
  const route = useRoute()

  const registered = useState<boolean>('page-ready-registered', () => false)
  const isReady = useState<boolean>('page-ready', () => false)

  // Register this page as skeleton-enabled
  registered.value = true
  isReady.value = false

  const ready = () => {
    isReady.value = true
  }

  // Auto mode: mark ready on mount
  if (!manual) {
    onMounted(() => {
      ready()
    })
  }

  // Reset on route change so next page starts fresh
  watch(() => route.path, () => {
    registered.value = false
    isReady.value = false
  })

  return { isReady: readonly(isReady), ready }
}
