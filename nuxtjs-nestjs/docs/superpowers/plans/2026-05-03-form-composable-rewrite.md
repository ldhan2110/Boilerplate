# Form Composable Rewrite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace PrimeVue `<Form>` dependency with a pure Zod + Vue reactive state composable that owns validation, error display, and dirty tracking — single source of truth, no dual state.

**Architecture:** `useAppForm` composable owns all form state (values, errors, dirty, submit). `field()` helper returns everything needed per field including error string and inputId. FormField.vue becomes pure layout (label + slot + error from props). Native `<form>` replaces `<PForm>`.

**Tech Stack:** Vue 3 Composition API, Zod, TypeScript. Removes `@primevue/forms`.

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Rewrite | `frontend/app/composables/common/useAppForm.ts` | Form state, Zod validation, field binding, dirty tracking, guards |
| Modify | `frontend/app/components/common/inputs/FormField.vue` | Pure layout — remove `$pcForm` inject, error from props |
| Modify | `frontend/app/components/common/inputs/CheckBox.vue` | Remove duplicated `$pcForm` inject, add `onBlur` forwarding |
| Modify | `frontend/app/components/common/inputs/Input.vue` | Add `onBlur` prop + forwarding to PrimeVue primitives |
| Modify | `frontend/app/components/common/inputs/Select.vue` | Add `onBlur` prop + forwarding to PrimeVue primitives |
| Modify | `frontend/app/components/common/inputs/InputNumber.vue` | Add `onBlur` prop + forwarding to PrimeVue primitives |
| Modify | `frontend/app/components/common/inputs/DatePicker.vue` | Add `onBlur` prop + forwarding |
| Modify | `frontend/app/components/common/inputs/Toggle.vue` | Add `onBlur` prop + forwarding |
| Modify | `frontend/app/components/common/inputs/RadioGroup.vue` | Add `onBlur` prop + forwarding |
| Modify | `frontend/app/components/common/cards/SearchCard.vue` | `<PForm>` → `<form>`, remove formRef |
| Modify | `frontend/app/pages/login.vue` | `<PForm>` → `<form>`, remove ref/slot |
| Modify | `frontend/app/pages/administration/program-management.vue` | `<PForm>` → `<form>`, simplify dialog |
| Modify | `frontend/app/pages/index.vue` | Update if uses PForm |
| Modify | `frontend/package.json` | Remove `@primevue/forms` |

---

### Task 1: Rewrite useAppForm.ts

**Files:**
- Rewrite: `frontend/app/composables/common/useAppForm.ts`

This is the core task. Complete rewrite — remove all PrimeVue Form references, own validation entirely.

- [ ] **Step 1: Write the new useAppForm composable**

Replace the entire file content with:

```typescript
import type { ZodObject, ZodRawShape, z } from 'zod'

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
  /** When to trigger validation. Default: 'submit' */
  validateOn?: 'submit' | 'blur' | 'change'
}

export function useAppForm<T extends ZodObject<ZodRawShape>>(options: UseAppFormOptions<T>) {
  const { schema, onSubmit, guard: guardConfig = { router: true, unload: true } } = options
  const validateOn = options.validateOn ?? 'submit'
  const rawInitial = options.initialValues ?? ({} as Partial<z.infer<T>>)

  const { t } = useI18n()
  const dialog = useAppDialog()

  // --- Unique form ID for accessible inputId generation ---
  const formUid = useId()

  // --- Dirty tracking via snapshot ---
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

  const isDirty = computed(() => JSON.stringify(values) !== snapshot.value)

  // --- Validation state ---
  const fieldErrors = ref<Record<string, string | undefined>>({})
  const touchedFields = reactive(new Set<string>())
  const hasSubmitted = ref(false)

  /** Run Zod validation against current values, update fieldErrors */
  function runValidation(): boolean {
    const result = schema.safeParse(toRaw(values))
    if (result.success) {
      fieldErrors.value = {}
      return true
    }
    const newErrors: Record<string, string | undefined> = {}
    for (const issue of result.error.issues) {
      const fieldName = String(issue.path[0])
      // Keep first error per field
      if (!newErrors[fieldName]) {
        newErrors[fieldName] = issue.message
      }
    }
    fieldErrors.value = newErrors
    return false
  }

  /** Get visible error for a field (respects validateOn mode) */
  function getFieldError(name: string): string | undefined {
    const rawError = fieldErrors.value[name]
    if (!rawError) return undefined

    if (validateOn === 'change') return rawError
    if (validateOn === 'blur' && touchedFields.has(name)) return rawError
    if (validateOn === 'submit' && hasSubmitted.value) return rawError
    // After first submit, all modes show errors for touched/submitted fields
    if (hasSubmitted.value) return rawError

    return undefined
  }

  // --- Reactive validation on change (for 'change' mode or after first submit/blur) ---
  watch(
    () => JSON.stringify(values),
    () => {
      if (validateOn === 'change' || hasSubmitted.value || touchedFields.size > 0) {
        runValidation()
      }
    }
  )

  // --- Submit handling ---
  const isSubmitting = ref(false)

  function handleFormSubmit(e: Event) {
    e.preventDefault()
    hasSubmitted.value = true
    const isValid = runValidation()
    if (!isValid) return

    const result = onSubmit(toRaw(values) as z.infer<T>)
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

  // --- Props to spread onto native <form> ---
  const formProps = computed(() => ({
    onSubmit: handleFormSubmit,
    novalidate: true as const,
  }))

  // --- Computed aggregates ---
  const errors = computed(() => {
    const visible: Record<string, string | undefined> = {}
    for (const key of Object.keys(fieldErrors.value)) {
      visible[key] = getFieldError(key)
    }
    return visible
  })

  const isValid = computed(() => {
    return Object.values(fieldErrors.value).every(e => !e)
  })

  // --- Field binding helper ---
  function field(name: string) {
    return {
      modelValue: values[name] as any,
      'onUpdate:modelValue': (value: any) => {
        values[name] = value
      },
      onBlur: () => {
        touchedFields.add(name)
        if (validateOn === 'blur' || hasSubmitted.value) {
          runValidation()
        }
      },
      name,
      error: getFieldError(name),
      inputId: `form-${formUid}-${name}`,
    }
  }

  // --- Reset ---
  function resetForm() {
    const initial = JSON.parse(snapshot.value)
    Object.assign(values, initial)
    fieldErrors.value = {}
    touchedFields.clear()
    hasSubmitted.value = false
  }

  // --- Imperative field setters ---
  function setFieldValue(name: string, value: unknown) {
    values[name] = value
  }

  function setFieldsValues(newValues: Record<string, unknown>) {
    Object.entries(newValues).forEach(([key, value]) => {
      values[key] = value
    })
  }

  // --- Manual validate ---
  function validate(): boolean {
    hasSubmitted.value = true
    return runValidation()
  }

  // --- Programmatic submit ---
  function submit() {
    handleFormSubmit(new Event('submit'))
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
    field,
    values,
    errors,
    isDirty,
    isSubmitting,
    isValid,
    resetForm,
    setFieldValue,
    setFieldsValues,
    submit,
    validate,
    guardClose,
  }
}
```

- [ ] **Step 2: Verify typecheck passes for the composable**

Run: `cd frontend && npx nuxi typecheck`

Expected: May have errors in consumers (they still reference `formRef`). The composable itself should have no internal type errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/composables/common/useAppForm.ts
git commit -m "refactor(useAppForm): rewrite with pure Zod validation, remove PrimeVue Form dependency"
```

---

### Task 2: Update FormField.vue — Remove $pcForm inject

**Files:**
- Modify: `frontend/app/components/common/inputs/FormField.vue:34-53`

- [ ] **Step 1: Remove PrimeVue Form integration code**

Delete lines 34-53 (the `$pcForm` inject, register watcher, and the old `resolvedError` computed). Replace the `resolvedError` computed with a simple prop resolution:

```typescript
// Replace lines 34-53 with:
const resolvedError = computed(() => resolve(props.error))
```

The full `<script>` block becomes:

```typescript
interface FormFieldProps {
  /** Label text — accepts i18n key or raw text */
  label?: string
  /** Error message — accepts i18n key or raw text */
  error?: string
  /** Hint text below input — hidden when error is shown */
  hint?: string
  /** Show required asterisk on label */
  required?: boolean
  /** HTML id for the input (for label association) */
  inputId?: string
  /** PrimeVue Form field name — kept for field identification */
  name?: string
  /** Use PrimeVue FloatLabel instead of stacked label — saves vertical space */
  floatLabel?: boolean
  /** Place label on the left, input on the right — single-line layout */
  horizontal?: boolean
}

const props = defineProps<FormFieldProps>()

const { t, te } = useI18n()

/** Translate value if it looks like an i18n key */
function resolve(value: string | undefined): string | undefined {
  if (!value) return undefined
  return te(value) ? t(value) : value
}

const resolvedLabel = computed(() => resolve(props.label))
const resolvedHint = computed(() => resolve(props.hint))
const resolvedError = computed(() => resolve(props.error))
```

Template stays unchanged — it already uses `resolvedError` and `resolvedHint`.

- [ ] **Step 2: Verify no remaining $pcForm references**

Search the file for `$pcForm`, `inject`, `register`. Should find none.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/components/common/inputs/FormField.vue
git commit -m "refactor(FormField): remove PrimeVue Form inject, error from props only"
```

---

### Task 3: Update CheckBox.vue — Remove $pcForm inject, add onBlur

**Files:**
- Modify: `frontend/app/components/common/inputs/CheckBox.vue`

CheckBox has its own duplicated `$pcForm` inject (lines 47-66). Remove it and add `onBlur` forwarding.

- [ ] **Step 1: Remove $pcForm inject and update error handling**

Replace the entire `<script>` block with:

```typescript
interface CheckBoxProps {
  /** v-model binding */
  modelValue?: boolean | unknown[] | unknown
  /** Label text — i18n key or raw text */
  label?: string
  /** Error message */
  error?: string
  /** Hint text */
  hint?: string
  /** Show required asterisk */
  required?: boolean
  /** Value when used in array mode */
  value?: unknown
  /** Binary mode (true/false toggle) — default true */
  binary?: boolean
  /** Value when checked in binary mode (default: true) */
  trueValue?: unknown
  /** Value when unchecked in binary mode (default: false) */
  falseValue?: unknown
  /** Disabled state */
  disabled?: boolean
  /** HTML id */
  id?: string
  /** PrimeVue Form field name */
  name?: string
}

const props = withDefaults(defineProps<CheckBoxProps>(), {
  binary: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const { t, te } = useI18n()

const _uid = useId()
const inputId = computed(() => props.id || `checkbox-${_uid}`)

const resolvedLabel = computed(() => {
  if (!props.label) return undefined
  return te(props.label) ? t(props.label) : props.label
})

// Error from props (populated by useAppForm field() helper)
const resolvedError = computed(() => {
  const e = props.error
  if (!e) return undefined
  return te(e) ? t(e) : e
})

const hasError = computed(() => !!resolvedError.value)
```

- [ ] **Step 2: Add @blur forwarding to PCheckbox in template**

In the template, add `@blur="$attrs.onBlur?.($event)"` to PCheckbox:

```html
<PCheckbox
  :id="inputId"
  :model-value="modelValue"
  :value="value"
  :binary="binary"
  :true-value="trueValue"
  :false-value="falseValue"
  :disabled="disabled"
  :invalid="hasError"
  @update:model-value="emit('update:modelValue', $event)"
  @blur="($attrs.onBlur as Function)?.($event)"
/>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/app/components/common/inputs/CheckBox.vue
git commit -m "refactor(CheckBox): remove PrimeVue Form inject, add onBlur forwarding"
```

---

### Task 4: Add onBlur forwarding to Input, Select, InputNumber

**Files:**
- Modify: `frontend/app/components/common/inputs/Input.vue`
- Modify: `frontend/app/components/common/inputs/Select.vue`
- Modify: `frontend/app/components/common/inputs/InputNumber.vue`

These components use FormField as root. `onBlur` from `field()` will land on FormField's root div via attrs inheritance, not on the actual input. Need explicit forwarding.

- [ ] **Step 1: Add onBlur prop to Input.vue**

Add to `InputProps` interface:

```typescript
  /** Blur handler — used by useAppForm for validation triggers */
  onBlur?: (e: Event) => void
```

Add `@blur="onBlur?.($event)"` to each PrimeVue primitive in the template:

On `<PTextarea>` (line 81-95), add after `@update:model-value`:
```
@blur="onBlur?.($event)"
```

On `<PInputText>` (password variant, line 97-108), add after `@update:model-value`:
```
@blur="onBlur?.($event)"
```

On `<PInputText>` (default variant, line 118-130), add after `@update:model-value`:
```
@blur="onBlur?.($event)"
```

- [ ] **Step 2: Add onBlur prop to Select.vue**

Add to `SelectProps` interface:

```typescript
  /** Blur handler — used by useAppForm for validation triggers */
  onBlur?: (e: Event) => void
```

Add `@blur="onBlur?.($event)"` to `<PMultiSelect>` and `<PSelect>` in template, after their `@update:model-value` lines.

- [ ] **Step 3: Add onBlur prop to InputNumber.vue**

Add to `InputNumberProps` interface:

```typescript
  /** Blur handler — used by useAppForm for validation triggers */
  onBlur?: (e: Event) => void
```

Add `@blur="onBlur?.($event)"` to `<PInputNumber>` in template, after `@update:model-value`.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/components/common/inputs/Input.vue frontend/app/components/common/inputs/Select.vue frontend/app/components/common/inputs/InputNumber.vue
git commit -m "feat(inputs): add onBlur forwarding to Input, Select, InputNumber"
```

---

### Task 5: Add onBlur forwarding to DatePicker, Toggle, RadioGroup

**Files:**
- Modify: `frontend/app/components/common/inputs/DatePicker.vue`
- Modify: `frontend/app/components/common/inputs/Toggle.vue`
- Modify: `frontend/app/components/common/inputs/RadioGroup.vue`

Same pattern as Task 4 — add `onBlur` prop and forward to PrimeVue primitive.

- [ ] **Step 1: Add onBlur to DatePicker.vue**

Add to interface:

```typescript
  /** Blur handler */
  onBlur?: (e: Event) => void
```

Add `@blur="onBlur?.($event)"` to `<PDatePicker>` in template.

- [ ] **Step 2: Add onBlur to Toggle.vue**

Add to interface:

```typescript
  /** Blur handler */
  onBlur?: (e: Event) => void
```

Add `@blur="onBlur?.($event)"` to `<PToggleSwitch>` in template.

- [ ] **Step 3: Add onBlur to RadioGroup.vue**

Add to interface:

```typescript
  /** Blur handler */
  onBlur?: (e: Event) => void
```

Forward to the last `<RadioButton>` in the group or to the wrapping div via `@focusout="onBlur?.($event)"` (radio groups don't have a single blur point — `focusout` on the container captures when focus leaves the group).

- [ ] **Step 4: Commit**

```bash
git add frontend/app/components/common/inputs/DatePicker.vue frontend/app/components/common/inputs/Toggle.vue frontend/app/components/common/inputs/RadioGroup.vue
git commit -m "feat(inputs): add onBlur forwarding to DatePicker, Toggle, RadioGroup"
```

---

### Task 6: Update SearchCard.vue — Replace PForm with native form

**Files:**
- Modify: `frontend/app/components/common/cards/SearchCard.vue`

- [ ] **Step 1: Replace PForm with native form**

Change the template from:

```html
<PForm
  :ref="form.formRef"
  v-bind="wrappedFormProps"
>
```

To:

```html
<form
  v-bind="wrappedFormProps"
>
```

And close tag `</PForm>` → `</form>`.

- [ ] **Step 2: Update wrappedFormProps computed**

The `wrappedFormProps` computed currently wraps PrimeVue Form's `onSubmit(e: { valid, values })`. Now it wraps the native form `onSubmit(e: Event)`. The composable's `formProps` already handles `e.preventDefault()` internally, so SearchCard just needs to intercept to emit `search`:

Replace `wrappedFormProps` computed (lines 53-64) with:

```typescript
const wrappedFormProps = computed(() => {
  if (props.autoSearch) return props.form.formProps.value
  return {
    ...props.form.formProps.value,
    onSubmit: (e: Event) => {
      props.form.formProps.value.onSubmit(e)
      emit('search', { ...props.form.values })
    }
  }
})
```

Note: For search forms, validation always passes (all fields are optional). The composable's `handleFormSubmit` calls `e.preventDefault()` and runs validation, then calls `onSubmit` callback. SearchCard's callback is `() => {}`, so SearchCard just emits search after.

**However**, there's a subtlety: the composable's `handleFormSubmit` returns early if validation fails, and never calls the `onSubmit` callback. SearchCard needs the search to happen regardless. Two options:

Option A: SearchCard calls `submit` + `emit` separately.
Option B: Search forms always pass validation (optional fields).

Since search schemas use all-optional fields, Option B works. But to be safe, update to:

```typescript
const wrappedFormProps = computed(() => {
  const baseProps = props.form.formProps.value
  if (props.autoSearch) return baseProps
  return {
    ...baseProps,
    onSubmit: (e: Event) => {
      baseProps.onSubmit(e)
      // Always emit search — search forms have optional-only schemas
      emit('search', { ...props.form.values })
    }
  }
})
```

- [ ] **Step 3: Remove formRef from Refresh button**

The Refresh button on line 98 calls `form.resetForm()` — this still works, no change needed.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/components/common/cards/SearchCard.vue
git commit -m "refactor(SearchCard): replace PForm with native form element"
```

---

### Task 7: Update login.vue — Replace PForm with native form

**Files:**
- Modify: `frontend/app/pages/login.vue`

- [ ] **Step 1: Update destructured imports**

Line 17 currently destructures `formRef` from `useAppForm`. Remove it:

```typescript
// Before:
const { formProps, formRef, field, values, isSubmitting } = useAppForm<typeof loginFormSchema>({

// After:
const { formProps, field, values, isSubmitting } = useAppForm<typeof loginFormSchema>({
```

- [ ] **Step 2: Replace PForm in template**

Line 68, change:

```html
<PForm ref="formRef" v-bind="formProps" v-slot="$form">
```

To:

```html
<form v-bind="formProps">
```

Line 111, change `</PForm>` to `</form>`.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/pages/login.vue
git commit -m "refactor(login): replace PForm with native form element"
```

---

### Task 8: Update program-management.vue — Replace PForm with native form

**Files:**
- Modify: `frontend/app/pages/administration/program-management.vue`

- [ ] **Step 1: Replace PForm in dialog template**

Line 429, change:

```html
<PForm :ref="dialogForm.formRef" :v-bind="dialogForm.formProps">
```

To:

```html
<form v-bind="dialogForm.formProps">
```

Line 499, change `</PForm>` to `</form>`.

- [ ] **Step 2: Simplify SaveButton**

Line 492-497, change:

```html
<SaveButton
  :label="t('common.save')"
  :loading="isDialogSaving"
  type="submit"
  @submit="dialogForm.submit"
/>
```

To:

```html
<SaveButton
  :label="t('common.save')"
  :loading="isDialogSaving"
  type="submit"
/>
```

Remove `@submit="dialogForm.submit"` — native `<form>` submit handles it.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/pages/administration/program-management.vue
git commit -m "refactor(program-management): replace PForm with native form element"
```

---

### Task 9: Check index.vue and remove @primevue/forms

**Files:**
- Modify: `frontend/app/pages/index.vue` (if uses PForm)
- Modify: `frontend/package.json`

- [ ] **Step 1: Check index.vue for PForm usage**

Read `frontend/app/pages/index.vue`. If it contains `<PForm>` or `formRef`, apply same pattern as login.vue. If not, skip.

- [ ] **Step 2: Remove @primevue/forms from package.json**

In `frontend/package.json`, remove the line:

```json
"@primevue/forms": "^4.5.5",
```

- [ ] **Step 3: Remove zodResolver import check**

Search all files for `@primevue/forms`. Should only find `pnpm-lock.yaml` and `components.d.ts`. The `components.d.ts` line for `PForm` may be auto-generated — it will be cleaned on next build if PForm is no longer registered.

Check `frontend/nuxt.config.ts` or PrimeVue config for explicit `Form` component registration. Remove if found.

- [ ] **Step 4: Run pnpm install to update lockfile**

```bash
cd frontend && pnpm install
```

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/pnpm-lock.yaml
git commit -m "chore: remove @primevue/forms dependency"
```

---

### Task 10: Full typecheck and verification

**Files:** None (verification only)

- [ ] **Step 1: Run typecheck**

```bash
cd frontend && npx nuxi typecheck
```

Fix any remaining type errors. Common expected issues:
- `components.d.ts` may still reference `PForm` — safe to delete the line manually or regenerate
- Any file still importing from `@primevue/forms` — should be none after Task 1

- [ ] **Step 2: Run dev server**

```bash
cd frontend && npx nuxi dev
```

Verify:
- Login page loads, form submits, validation errors show on submit
- Program management search works, dialog opens/submits/resets
- No console errors about missing PForm or $pcForm

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: resolve remaining type errors after form composable rewrite"
```
