import type { ZodObject, ZodRawShape, z } from 'zod'
import { zodResolver } from '@primevue/forms/resolvers/zod'

interface GuardConfig {
  /** Guard in-app navigation via Vue Router (default: true) */
  router?: boolean
  /** Guard tab close/refresh via beforeunload (default: true) */
  unload?: boolean
}

interface UseAppFormOptions<T extends ZodObject<ZodRawShape>> {
  /** Zod schema for validation */
  schema: T
  /** Initial form values — plain object or ref/computed (watched for async data) */
  initialValues?: MaybeRef<Partial<z.infer<T>>>
  /** Called with validated values on successful submit */
  onSubmit: (values: z.infer<T>) => Promise<void> | void
  /** Leave guard configuration. Set to false to disable all guards. */
  guard?: GuardConfig | false
}

export function useAppForm<T extends ZodObject<ZodRawShape>>(options: UseAppFormOptions<T>) {
  const { schema, onSubmit, guard: guardConfig = { router: true, unload: true } } = options
  const rawInitial = options.initialValues ?? ({} as Partial<z.infer<T>>)

  const { t } = useI18n()
  const dialog = useAppDialog()

  // --- Resolver ---
  const resolver = zodResolver(schema)

  // --- Template ref for <Form> component ---
  const formRef = shallowRef<any>(null)

  // --- Dirty tracking via mirrored values ---
  const snapshot = ref(JSON.stringify(toRaw(unref(rawInitial)))) as Ref<string>
  const values = reactive<Record<string, unknown>>({ ...toRaw(unref(rawInitial)) })

  // Watch reactive initialValues (e.g. from API)
  if (isRef(rawInitial)) {
    watch(rawInitial, (newVal) => {
      if (newVal) {
        const raw = toRaw(newVal)
        snapshot.value = JSON.stringify(raw)
        Object.assign(values, raw)
      }
    }, { deep: true })
  }

  // isDirty: compare current values against snapshot (no toRaw — must trigger reactivity)
  const isDirty = computed(() => JSON.stringify(values) !== snapshot.value)

  // --- Submit handling ---
  const isSubmitting = ref(false)

  function handleSubmit(e: { valid: boolean; values: Record<string, unknown> }) {
    if (!e.valid) return

    // Merge reactive values into PrimeVue Form's values so custom components
    // (e.g. FileUpload) that bypass PrimeVue primitives are included
    const mergedValues = { ...e.values, ...toRaw(values) }
    const result = onSubmit(mergedValues as z.infer<T>)
    if (result instanceof Promise) {
      isSubmitting.value = true
      result
        .then(() => {
          snapshot.value = JSON.stringify(values)
        })
        .finally(() => {
          isSubmitting.value = false
        })
    } else {
      snapshot.value = JSON.stringify(values)
    }
  }

  // --- Props to spread onto <Form> ---
  const formProps = computed(() => ({
    resolver,
    initialValues: JSON.parse(snapshot.value),
    onSubmit: handleSubmit
  }))

  /**
   * Field binding helper — returns props for custom Input/Select/etc components.
   * The `name` prop falls through to the internal FormField.vue which auto-registers
   * with PrimeVue Form for validation.
   *
   * Usage:
   *   <Input v-bind="field('email')" label="Email" />
   */
  function field(name: string) {
    return {
      modelValue: values[name] as any,
      'onUpdate:modelValue': (value: any) => {
        values[name] = value
      },
      name
    }
  }

  // --- Reset ---
  function resetForm() {
    const initial = JSON.parse(snapshot.value)
    Object.assign(values, initial)
    // Also reset PrimeVue Form's internal state
    formRef.value?.$form?.reset?.()
  }

  // --- Imperative field setter (e.g. for async data) ---
  function setFieldValue(name: string, value: unknown) {
    values[name] = value

    // sync to PrimeVue Form
    formRef.value?.$form?.setFieldValue?.(name, value)
  }

  function setFieldsValues(newValues: Record<string, unknown>) {
    Object.entries(newValues).forEach(([key, value]) => {
      setFieldValue(key, value)
    })
  }

  // --- Confirm dialog helper ---
  function showDiscardConfirm(): Promise<boolean> {
    return dialog.confirmAsync({
      header: t('common.unsavedChanges'),
      message: t('common.unsavedChangesMessage'),
      acceptButton: { label: t('common.discard') },
      rejectButton: { label: t('common.cancel') },
    })
  }

  // --- Guard: Vue Router ---
  const guardEnabled = guardConfig !== false
  const routerGuard = guardEnabled && (guardConfig as GuardConfig).router !== false
  const unloadGuard = guardEnabled && (guardConfig as GuardConfig).unload !== false

  if (routerGuard) {
    onBeforeRouteLeave(async () => {
      if (!isDirty.value) return true
      return await showDiscardConfirm()
    })
  }

  // --- Guard: beforeunload ---
  if (unloadGuard) {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty.value) {
        e.preventDefault()
      }
    }

    onMounted(() => {
      window.addEventListener('beforeunload', onBeforeUnload)
    })

    onUnmounted(() => {
      window.removeEventListener('beforeunload', onBeforeUnload)
    })
  }

  // --- Guard: drawer/dialog close ---
  async function guardClose(): Promise<boolean> {
    if (!isDirty.value) return true
    return showDiscardConfirm()
  }

  return {
    formProps,
    formRef,
    field,
    values,
    isDirty,
    isSubmitting,
    resetForm,
    guardClose,
    setFieldValue,
    setFieldsValues
  }
}
