<script setup lang="ts">
/**
 * Demo: useApi abort / auto-cancel patterns
 *
 * Since there is no real slow backend endpoint, we simulate useApi behavior
 * inline using Promise + setTimeout + AbortController. This shows the exact
 * pattern that useApi follows internally (see composables/useApi.ts).
 */

// ---------------------------------------------------------------------------
// Simulated useApi — mirrors the real composable's abort-on-re-execute logic
// ---------------------------------------------------------------------------
function useMockApi<T>(delayMs = 2000) {
  const data = ref<T | null>(null) as Ref<T | null>
  const error = ref<string | null>(null)
  const loading = ref(false)
  let currentController: AbortController | null = null

  async function execute(payload: T, delay = delayMs): Promise<T | null> {
    // Auto-abort previous in-flight request (same as real useApi)
    currentController?.abort()
    const controller = new AbortController()
    currentController = controller

    loading.value = true
    error.value = null

    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, delay)
        controller.signal.addEventListener('abort', () => {
          clearTimeout(timer)
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })

      if (controller.signal.aborted) return null
      data.value = payload
      return payload
    } catch (e: any) {
      if (e.name === 'AbortError') {
        // Aborted requests: loading stops, error stays null, data unchanged
        return null
      }
      error.value = e.message
      return null
    } finally {
      if (currentController === controller) {
        loading.value = false
      }
    }
  }

  function abort() {
    currentController?.abort()
    currentController = null
    loading.value = false
  }

  return { data, error, loading, execute, abort }
}

// ---------------------------------------------------------------------------
// 1. Search Debounce Demo
// ---------------------------------------------------------------------------
const searchQuery = ref('')
const searchApi = useMockApi<string>(800)
const searchAbortCount = ref(0)
const searchCompleteCount = ref(0)
const searchRequestId = ref(0)

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

function onSearchInput() {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)

  searchDebounceTimer = setTimeout(async () => {
    if (!searchQuery.value.trim()) return
    const id = ++searchRequestId.value
    // Each execute() auto-aborts the previous one
    if (searchRequestId.value > 1) searchAbortCount.value++
    const result = await searchApi.execute(`Results for "${searchQuery.value}" (request #${id})`, 600 + Math.random() * 800)
    if (result !== null) searchCompleteCount.value++
  }, 150)
}

// ---------------------------------------------------------------------------
// 2. Manual Abort Demo
// ---------------------------------------------------------------------------
const manualApi = useMockApi<string>(3000)
const manualStatus = ref('idle')

async function startSlowRequest() {
  manualStatus.value = 'loading'
  const result = await manualApi.execute('Slow request completed successfully!')
  manualStatus.value = result !== null ? 'completed' : 'aborted'
}

function cancelRequest() {
  manualApi.abort()
  manualStatus.value = 'aborted'
}

// ---------------------------------------------------------------------------
// 3. Rapid Fire Demo
// ---------------------------------------------------------------------------
const rapidApi = useMockApi<{ id: number; label: string }>(500)
const rapidTotal = ref(0)
const rapidLanded = ref<number | null>(null)
const rapidAborted = ref(0)
const rapidRunning = ref(false)

async function fireRapid() {
  rapidRunning.value = true
  rapidTotal.value = 10
  rapidAborted.value = 0
  rapidLanded.value = null

  const promises: Promise<any>[] = []
  for (let i = 1; i <= 10; i++) {
    // Each call auto-aborts the previous — only #10 should land
    promises.push(
      rapidApi.execute(
        { id: i, label: `Response from request #${i}` },
        300 + Math.random() * 400
      ).then((result) => {
        if (result !== null) {
          rapidLanded.value = result.id
        } else {
          rapidAborted.value++
        }
      })
    )
    // Small stagger so each request actually fires before the next aborts it
    await new Promise(r => setTimeout(r, 30))
  }

  await Promise.allSettled(promises)
  rapidRunning.value = false
}

// ---------------------------------------------------------------------------
// 4. State Panel — tracks the manual abort demo
// ---------------------------------------------------------------------------
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        useApi Abort Demo
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Demonstrates auto-abort on re-execute, manual abort, and race-condition prevention
      </p>
    </div>

    <div class="flex flex-col gap-4">
      <!-- 1. Search Debounce Demo -->
      <PCard>
        <template #title>
          <span class="text-base">Search Debounce (Auto-Abort)</span>
        </template>
        <template #content>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Type quickly. Each keystroke triggers a new request after 150ms debounce.
            Previous in-flight requests are auto-aborted — only the last result displays.
          </p>

          <Input
            v-model="searchQuery"
            label="Search"
            placeholder="Type something..."
            @input="onSearchInput"
          />

          <div class="mt-4 flex flex-wrap gap-4 text-sm">
            <span class="text-gray-500 dark:text-gray-400">
              Requests fired: <span class="font-semibold text-gray-900 dark:text-white">{{ searchRequestId }}</span>
            </span>
            <span class="text-gray-500 dark:text-gray-400">
              Aborted: <span class="font-semibold text-amber-600 dark:text-amber-400">{{ searchAbortCount }}</span>
            </span>
            <span class="text-gray-500 dark:text-gray-400">
              Completed: <span class="font-semibold text-green-600 dark:text-green-400">{{ searchCompleteCount }}</span>
            </span>
          </div>

          <div v-if="searchApi.loading.value" class="mt-3 text-xs text-blue-600 dark:text-blue-400">
            Loading...
          </div>
          <div v-if="searchApi.data.value" class="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm font-mono text-gray-700 dark:text-gray-300">
            {{ searchApi.data.value }}
          </div>
        </template>
      </PCard>

      <!-- 2. Manual Abort Demo -->
      <PCard>
        <template #title>
          <span class="text-base">Manual Abort</span>
        </template>
        <template #content>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Starts a 3-second simulated request. Press Cancel to abort mid-flight.
            On abort: loading becomes false, error stays null, data is unchanged.
          </p>

          <Flex gap="2" align="center">
            <Button
              label="Start Slow Request"
              icon="pi pi-play"
              :loading="manualApi.loading.value"
              :disabled="manualApi.loading.value"
              @click="startSlowRequest"
            />
            <Button
              label="Cancel"
              icon="pi pi-times"
              variant="danger"
              outlined
              :disabled="!manualApi.loading.value"
              @click="cancelRequest"
            />
            <span
              class="text-xs font-medium px-2 py-1 rounded"
              :class="{
                'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400': manualStatus === 'idle',
                'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400': manualStatus === 'loading',
                'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400': manualStatus === 'completed',
                'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400': manualStatus === 'aborted',
              }"
            >
              {{ manualStatus }}
            </span>
          </Flex>

          <div v-if="manualApi.data.value" class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm font-mono text-gray-700 dark:text-gray-300">
            {{ manualApi.data.value }}
          </div>
        </template>
      </PCard>

      <!-- 3. Rapid Fire Demo -->
      <PCard>
        <template #title>
          <span class="text-base">Rapid Fire (Race Condition Prevention)</span>
        </template>
        <template #content>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Fires 10 requests in quick succession with incrementing IDs. Each execute() auto-aborts the previous.
            Only the last response should land.
          </p>

          <Flex gap="2" align="center">
            <Button
              label="Fire 10 Requests"
              icon="pi pi-bolt"
              variant="warn"
              :loading="rapidRunning"
              :disabled="rapidRunning"
              @click="fireRapid"
            />
          </Flex>

          <div v-if="rapidTotal > 0" class="mt-4 flex flex-wrap gap-4 text-sm">
            <span class="text-gray-500 dark:text-gray-400">
              Total fired: <span class="font-semibold text-gray-900 dark:text-white">{{ rapidTotal }}</span>
            </span>
            <span class="text-gray-500 dark:text-gray-400">
              Aborted: <span class="font-semibold text-amber-600 dark:text-amber-400">{{ rapidAborted }}</span>
            </span>
            <span class="text-gray-500 dark:text-gray-400">
              Landed: <span class="font-semibold text-green-600 dark:text-green-400">{{ rapidLanded !== null ? `#${rapidLanded}` : 'none yet' }}</span>
            </span>
          </div>

          <div v-if="rapidApi.data.value" class="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm font-mono text-gray-700 dark:text-gray-300">
            {{ JSON.stringify(rapidApi.data.value, null, 2) }}
          </div>
        </template>
      </PCard>

      <!-- 4. State Panel -->
      <PCard>
        <template #title>
          <span class="text-base">Reactive State Panel</span>
        </template>
        <template #content>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Live reactive state from the Manual Abort demo above.
          </p>

          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3 text-sm font-mono">
            <div class="flex items-center gap-2">
              <span class="text-gray-500 dark:text-gray-400 w-20">loading:</span>
              <span
                class="font-semibold"
                :class="manualApi.loading.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'"
              >
                {{ manualApi.loading.value }}
              </span>
              <span v-if="manualApi.loading.value" class="inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>

            <div class="flex items-center gap-2">
              <span class="text-gray-500 dark:text-gray-400 w-20">error:</span>
              <span
                class="font-semibold"
                :class="manualApi.error.value ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'"
              >
                {{ manualApi.error.value ?? 'null' }}
              </span>
            </div>

            <div class="flex gap-2">
              <span class="text-gray-500 dark:text-gray-400 w-20 shrink-0">data:</span>
              <span class="font-semibold text-gray-700 dark:text-gray-300 break-all">
                {{ manualApi.data.value !== null ? `"${manualApi.data.value}"` : 'null' }}
              </span>
            </div>
          </div>

          <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
            <p class="font-semibold mb-1">How useApi handles abort internally:</p>
            <ul class="list-disc list-inside space-y-1">
              <li>Each <code class="bg-blue-100 dark:bg-blue-800/50 px-1 rounded">execute()</code> call creates a new AbortController</li>
              <li>Before creating it, the previous controller is aborted via <code class="bg-blue-100 dark:bg-blue-800/50 px-1 rounded">currentController?.abort()</code></li>
              <li>Aborted requests throw an AbortError which is caught silently</li>
              <li>Only the latest request's result is written to <code class="bg-blue-100 dark:bg-blue-800/50 px-1 rounded">data</code></li>
            </ul>
          </div>
        </template>
      </PCard>
    </div>
  </div>
</template>
