# Form Composable Rewrite — Design Spec

**Date:** 2026-05-03
**Status:** Draft
**Approach:** Pure Composable (Approach A) — remove PrimeVue Form dependency entirely

## Problem

`useAppForm` wraps PrimeVue `<Form>` component, creating dual reactive state (composable `values` + PrimeVue internal state). This causes:

1. **State sync bugs** — must call `formRef.value?.setFieldValue()` to keep both in sync; easy to forget
2. **Zero type safety** — `formRef` is `shallowRef<any>`, all PrimeVue Form calls use optional chaining guessing
3. **Undocumented internals** — `FormField.vue` injects `$pcForm`, reads `$pcForm.fields?.[name]?.states?.error`, calls `$pcForm.register()` — breaks on PrimeVue upgrades
4. **Template wiring fragility** — `:ref="dialogForm.formRef"` + `:v-bind` (wrong) + `@submit="dialogForm.submit"` hacks
5. **Merge band-aid** — `handleSubmit` merges `{ ...e.values, ...toRaw(values) }` to cover custom components

## Solution

Own the full form stack: Zod validation + Vue reactive state + own error display. No PrimeVue Form.

## API Design

### Options

```typescript
interface GuardConfig {
  router?: boolean   // default: true
  unload?: boolean   // default: true
}

interface UseAppFormOptions<T extends ZodObject<ZodRawShape>> {
  schema: T
  initialValues?: MaybeRef<Partial<z.infer<T>>>
  onSubmit: (values: z.infer<T>) => Promise<void> | void
  guard?: GuardConfig | false
  validateOn?: 'submit' | 'blur' | 'change'  // default: 'submit'
}
```

### Return Value

```typescript
{
  // Template binding — spread onto native <form>
  formProps: ComputedRef<{ onSubmit: (e: Event) => void; novalidate: true }>

  // Field binding — spread onto Input/Select/etc
  field(name: string): {
    modelValue: any
    'onUpdate:modelValue': (v: any) => void
    onBlur: () => void
    name: string
    error: string | undefined
    inputId: string   // 'form-{uid}-{name}'
  }

  // State
  values: Reactive<z.infer<T>>
  errors: ComputedRef<Record<string, string | undefined>>
  isDirty: ComputedRef<boolean>
  isSubmitting: Ref<boolean>
  isValid: ComputedRef<boolean>

  // Actions
  resetForm(): void
  setFieldValue(name: string, value: unknown): void
  setFieldsValues(values: Record<string, unknown>): void
  submit(): void
  validate(): boolean
  guardClose(): Promise<boolean>
}
```

### Removed from API

- `formRef` — no PrimeVue Form component ref needed
- PrimeVue `resolver` — Zod called directly

## Validation Flow

### Trigger modes

| Mode | First error shown | Then |
|------|-------------------|------|
| `submit` (default) | After first submit attempt | Live on change for invalid fields |
| `blur` | After field blur | Live on change for that field |
| `change` | On every change (300ms debounce) | Continuous |

### Internal state

- `touchedFields: Set<string>` — tracks which fields have been blurred
- `hasSubmitted: Ref<boolean>` — flips true on first submit
- Error visibility: field error shows only when `hasSubmitted || touchedFields.has(name)` (for submit/blur modes)

### Validation execution

```typescript
function validateAll(): Record<string, string | undefined> {
  const result = schema.safeParse(toRaw(values))
  if (result.success) return {}
  // Map ZodError issues to { fieldName: firstErrorMessage }
  return Object.fromEntries(
    result.error.issues.map(issue => [issue.path[0], issue.message])
  )
}
```

Single field validation uses same `safeParse` but only surfaces the error for that field. Full schema always runs (Zod is fast enough for CRUD forms) — keeps cross-field validation working.

## FormField.vue Changes

### Before

```typescript
// Injects PrimeVue Form internal
const $pcForm = inject('$pcForm', null) as any

if ($pcForm) {
  watch(() => props.name, (name) => {
    if (name) $pcForm.register(name, { name })
  }, { immediate: true })
}

const resolvedError = computed(() => {
  if (props.name && $pcForm) {
    const formError = $pcForm.fields?.[props.name]?.states?.error
    if (formError) return formError.message
  }
  return resolve(props.error)
})
```

### After

```typescript
// Pure prop — error comes from field() helper spread
const resolvedError = computed(() => resolve(props.error))
```

Delete: `$pcForm` inject, register watcher, error reading from PrimeVue internals.
Keep: All layout logic (stacked, horizontal, floatLabel), i18n resolution, hint display.

Props unchanged — `error` and `inputId` already exist, just weren't populated by `field()` before.

## Template Patterns

### Standard form (login, dialog)

```vue
<form v-bind="formProps">
  <Input v-bind="field('email')" label="Email" required />
  <Input v-bind="field('password')" label="Password" type="password" required />
  <button type="submit">Submit</button>
</form>
```

### SearchCard

```vue
<!-- SearchCard.vue internal -->
<form v-bind="wrappedFormProps">
  <Grid ...>
    <slot />
  </Grid>
  <Button type="submit" label="Search" />
</form>
```

SearchCard wraps `form.formProps` to intercept submit and emit `search` — same as current, just `<PForm>` becomes `<form>`.

### Dialog form (program-management)

```vue
<form v-bind="dialogForm.formProps">
  <Input v-bind="dialogForm.field('pgmCd')" label="Code" required />
  <!-- ... -->
  <SaveButton type="submit" :loading="isDialogSaving" />
</form>
```

No `formRef`. No `@submit` hack. Native `<form>` submit triggers `formProps.onSubmit`.

## Migration Checklist

1. **Rewrite `useAppForm.ts`** — remove all PrimeVue Form refs, implement own Zod validation, add `validateOn`, `inputId` generation, error state per field
2. **Update `FormField.vue`** — remove `$pcForm` inject/register/error-reading (lines 35-53), `resolvedError` from props only
3. **Update `SearchCard.vue`** — `<PForm>` to `<form>`, remove `formRef` usage
4. **Update `login.vue`** — `<PForm>` to `<form>`, remove `ref="formRef"` and `v-slot="$form"`
5. **Update `program-management.vue`** — `<PForm>` to `<form>`, remove `formRef` ref, simplify SaveButton
6. **Verify input components** — ensure `onBlur` forwards to underlying PrimeVue primitive
7. **Remove `@primevue/forms`** from `package.json`
8. **Run typecheck + manual test** each page (login, program management, search)

## What Stays Unchanged

- Zod schemas in all consumers
- `field('name')` call pattern (returns more props, backward compatible spread)
- `values`, `isDirty`, `isSubmitting`, `resetForm`, `setFieldValue`, `setFieldsValues`, `guardClose`
- Guard system (router + beforeunload)
- FormField layout modes (stacked, horizontal, floatLabel)
- All PrimeVue UI primitives (PInputText, PSelect, etc.) — only `<PForm>` removed

## Dependencies

### Added
- None

### Removed
- `@primevue/forms` (package + zodResolver import)

## Risk

- **Low:** Forms are CRUD-simple. Zod handles all validation. Reactive state is straightforward.
- **Input onBlur forwarding:** Must verify each custom input component (Input, Select, CheckBox, InputNumber) passes `onBlur` through to DOM. Most PrimeVue primitives emit blur natively.
- **SearchCard `autoSearch` mode:** Uses `guard: false` and `validateOn` should default to none for search forms. Current design handles this — search forms just don't show errors.
