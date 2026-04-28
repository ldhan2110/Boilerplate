<script setup lang="ts">
usePageReady()
import { z } from 'zod'
import { Form } from '@primevue/forms'

import { ABILITY_ACTION, ABILITY_SUBJECT } from '~/utils/constants'
import type { ColumnDef, EditSaveEvent, PageEvent, SortEvent } from '~/types/table'
import { formatDate, formatTime, formatDateTime } from '~/utils/date'

const { t } = useI18n()
const toast = useAppToast()

// --- SearchCard demo ---
const searchSchema = z.object({
  name: z.string().optional(),
  status: z.string().nullable().optional(),
  dateFrom: z.string().nullable().optional()
})

const searchStatuses = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Pending', value: 'pending' }
]

const searchForm = useAppForm({
  schema: searchSchema,
  initialValues: { name: '', status: null, dateFrom: null },
  onSubmit: () => {},
  guard: false
})

function handleSearch(values: Record<string, unknown>) {
  console.log('SearchCard search:', values)
  toast.showInfo(`Search: ${JSON.stringify(values)}`)
}

const loading = ref(false)

// --- Button demo state ---
function handleClick(variant: string) {
  toast.showInfo(`You clicked the ${variant} button`)
}

async function handleAsync() {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 1500))
  toast.showSuccess('Async operation completed!')
  loading.value = false
}

function handleDelete() {
  toast.showError('Item deleted successfully')
}

function handleSave() {
  toast.showSuccess('Changes saved!')
}

function handleWarn() {
  toast.showWarning('Proceed with caution')
}

// --- Form schema ---
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().optional(),
  bio: z.string().optional(),
  role: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  agreeTerms: z.string().optional(),
  newsletter: z.boolean().optional(),
  darkMode: z.boolean().optional(),
  notifications: z.boolean().optional(),
  startDate: z.string().nullable().optional(),
  startDateTime: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  dateRange: z.array(z.string()).nullable().optional(),
  content: z.string().optional(),
  age: z.number().min(1, 'Age must be at least 1').max(150, 'Age must be at most 150').nullable().optional(),
  price: z.number().min(0, 'Price must be positive').nullable().optional(),
  quantity: z.number().int().min(0).nullable().optional(),
  priority: z.string().nullable().optional(),
  status: z.string().nullable().optional()
})

const lastSubmitted = ref<Record<string, unknown> | null>(null)

const { formProps, formRef, field, values, isDirty, isSubmitting, resetForm } = useAppForm({
  schema: formSchema,
  initialValues: {
    name: '',
    email: '',
    password: '',
    bio: '',
    role: null,
    country: null,
    tags: [],
    agreeTerms: 'yes',
    newsletter: false,
    darkMode: false,
    notifications: true,
    startDate: null,
    startDateTime: null,
    startTime: null,
    dateRange: null,
    content: '',
    age: null,
    price: null,
    quantity: 0,
    priority: null,
    status: null
  },
  onSubmit: async (vals) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    lastSubmitted.value = { ...vals }
    toast.showSuccess('Form submitted successfully!')
    console.log('Submitted values:', vals)
  },
  guard: { router: true, unload: true }
})

const roles = [
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' }
]

const priorities = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' }
]

const statuses = [
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' }
]

const countries = [
  { name: 'Vietnam', code: 'VN' },
  { name: 'United States', code: 'US' },
  { name: 'Japan', code: 'JP' },
  { name: 'South Korea', code: 'KR' },
  { name: 'Germany', code: 'DE' },
  { name: 'France', code: 'FR' },
  { name: 'United Kingdom', code: 'GB' }
]

// --- Column Span demo data ---
const salesData = ref(
  Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    product: `Product ${String.fromCharCode(65 + (i % 8))}`,
    q1Revenue: Math.round(10000 + Math.random() * 50000),
    q1Units: Math.round(50 + Math.random() * 500),
    q2Revenue: Math.round(10000 + Math.random() * 50000),
    q2Units: Math.round(50 + Math.random() * 500),
    q3Revenue: Math.round(10000 + Math.random() * 50000),
    q3Units: Math.round(50 + Math.random() * 500),
    q4Revenue: Math.round(10000 + Math.random() * 50000),
    q4Units: Math.round(50 + Math.random() * 500)
  }))
)

const salesTotals = computed(() => {
  const t = { q1Revenue: 0, q1Units: 0, q2Revenue: 0, q2Units: 0, q3Revenue: 0, q3Units: 0, q4Revenue: 0, q4Units: 0 }
  for (const row of salesData.value) {
    t.q1Revenue += row.q1Revenue; t.q1Units += row.q1Units
    t.q2Revenue += row.q2Revenue; t.q2Units += row.q2Units
    t.q3Revenue += row.q3Revenue; t.q3Units += row.q3Units
    t.q4Revenue += row.q4Revenue; t.q4Units += row.q4Units
  }
  return t
})

function fmtCurrency(val: number) {
  return `$${val.toLocaleString()}`
}

// --- Column Span demo using AppDataTable children ---
const salesColumns: ColumnDef[] = [
  { field: 'id', header: '#', width: 60, align: 'center' },
  { field: 'product', header: 'Product', width: 140 },
  {
    header: 'Q1',
    children: [
      { field: 'q1Revenue', header: 'Revenue', width: 110, align: 'right', format: val => fmtCurrency(val) },
      { field: 'q1Units', header: 'Units', width: 80, align: 'right' }
    ]
  },
  {
    header: 'Q2',
    children: [
      { field: 'q2Revenue', header: 'Revenue', width: 110, align: 'right', format: val => fmtCurrency(val) },
      { field: 'q2Units', header: 'Units', width: 80, align: 'right' }
    ]
  },
  {
    header: 'Q3',
    children: [
      { field: 'q3Revenue', header: 'Revenue', width: 110, align: 'right', format: val => fmtCurrency(val) },
      { field: 'q3Units', header: 'Units', width: 80, align: 'right' }
    ]
  },
  {
    header: 'Q4',
    children: [
      { field: 'q4Revenue', header: 'Revenue', width: 110, align: 'right', format: val => fmtCurrency(val) },
      { field: 'q4Units', header: 'Units', width: 80, align: 'right' }
    ]
  }
]

// --- RowSpan demo ---
const { tableRef: rowSpanTableRef, deleteSelected: deleteRowSpanSelected } = useAppDataTable<any>()
const rowSpanSelectionCount = ref(0)

const rowSpanData = ref([
  { id: 1, department: 'Engineering', team: 'Frontend', name: 'Alice', salary: 85000 },
  { id: 2, department: 'Engineering', team: 'Frontend', name: 'Bob', salary: 78000 },
  { id: 3, department: 'Engineering', team: 'Backend', name: 'Carol', salary: 92000 },
  { id: 4, department: 'Engineering', team: 'Backend', name: 'Dave', salary: 88000 },
  { id: 5, department: 'Sales', team: 'Enterprise', name: 'Eve', salary: 72000 },
  { id: 6, department: 'Sales', team: 'Enterprise', name: 'Frank', salary: 68000 },
  { id: 7, department: 'Sales', team: 'SMB', name: 'Grace', salary: 65000 },
  { id: 8, department: 'HR', team: 'Recruiting', name: 'Hank', salary: 70000 },
  { id: 9, department: 'HR', team: 'Recruiting', name: 'Iris', salary: 67000 }
])

function handleDeleteRowSpanRows() {
  if (rowSpanSelectionCount.value === 0) return
  deleteRowSpanSelected()
  logTableEvent('rowspan-delete', { deleted: true })
}

const rowSpanColumns: ColumnDef[] = [
  { field: 'department', header: 'Department', width: 140, rowSpan: true },
  { field: 'team', header: 'Team', width: 120, rowSpan: true },
  { field: 'name', header: 'Name', width: 150, editable: true, editType: 'input' },
  { field: 'salary', header: 'Salary', width: 120, align: 'right', editable: true, editType: 'number', format: val => val != null ? `$${Number(val).toLocaleString()}` : '' }
]

// --- AppDataTable demo ---
const { tableRef, insertRow, insertRows, deleteRow, deleteRows, getRows, hasChanges, clearChanges, validate, clearErrors, isValid } = useAppDataTable<typeof employees.value[0]>()
const tableEventLog = ref<string[]>([])

function logTableEvent(event: string, data: any) {
  console.log(`Table event: ${event}`, data)
  tableEventLog.value.unshift(`[${new Date().toLocaleTimeString()}] ${event}: ${JSON.stringify(data)}`)
  if (tableEventLog.value.length > 10) tableEventLog.value.pop()
}

const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance']
const employeeStatuses = ['active', 'inactive', 'probation']

const employees = ref(
  Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `Employee ${i + 1}`,
    department: departments[i % departments.length],
    salary: Math.round(40000 + Math.random() * 60000),
    status: employeeStatuses[i % employeeStatuses.length],
    hireDate: formatDate(new Date(2020 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)),
    lastLogin: formatDateTime(new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))),
    shiftStart: formatTime(new Date(2024, 0, 1, 8 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60))),
    isRemote: i % 3 === 0,
    isVerified: i % 2 === 0
  }))
)

const tableColumns: ColumnDef[] = [
  { field: 'id', header: 'ID', width: 70, frozen: true, editable: false, sortable: true, align: 'center' },
  { field: 'name', header: 'Name', width: 180, editable: true, editType: 'input', sortable: true, validators: { required: true, maxLength: 50 } },
  { field: 'department', header: 'Department', width: 150, editable: true, editType: 'select', editOptions: departments, sortable: true, validators: { required: true } },
  { field: 'salary', header: 'Salary', width: 130, editable: true, editType: 'number', align: 'right', sortable: true, aggregation: 'sum', format: val => val != null ? `$${Number(val).toLocaleString()}` : '', validators: { required: true, min: 0, max: 999999 } },
  { field: 'status', header: 'Status', width: 120, editable: true, editType: 'select', editOptions: employeeStatuses, sortable: true, format: val => val ? val.charAt(0).toUpperCase() + val.slice(1) : '', validators: { required: true } },
  { field: 'hireDate', header: 'Hire Date', width: 130, editable: true, editType: 'date', sortable: true, validators: { required: true } },
  { field: 'lastLogin', header: 'Last Login', width: 180, editable: true, editType: 'datetime', sortable: true },
  { field: 'shiftStart', header: 'Shift Start', width: 130, editable: true, editType: 'time', sortable: true, validators: { pattern: /^\d{2}:\d{2}$/, messages: { pattern: 'Use HH:mm format' } } },
  { field: 'isRemote', header: 'Remote', width: 100, editable: true, editType: 'checkbox', align: 'center', sortable: true },
  { field: 'isVerified', header: 'Verified', width: 100, editable: true, editType: 'toggle', align: 'center', sortable: true }
]

const tableCellConfig = (row: any, field: string) => {
  if (field === 'salary' && row.status === 'inactive') {
    return { disabled: true, editable: false, render: () => 'N/A' }
  }
  // Per-cell validation: probation employees salary capped at 60k
  if (field === 'salary' && row.status === 'probation') {
    return {
      validators: {
        required: true,
        min: 0,
        max: 60000,
        custom: (val: any, r: any) => {
          if (val != null && val > 60000) return 'Probation salary cannot exceed $60,000'
          return null
        }
      }
    }
  }
}

// --- procFlag demo handlers ---
function handleInsertRow() {
  const row = insertRow({ name: 'New Employee', status: 'active', department: 'Engineering', salary: 50000 })
  logTableEvent('insertRow', { key: row?.id, name: row?.name })
}

function handleBatchInsert() {
  const rows = insertRows([
    { name: 'Alice Johnson', department: 'HR', status: 'active', salary: 55000 },
    { name: 'Bob Smith', department: 'IT', status: 'active', salary: 62000 },
    { name: 'Carol Davis', department: 'Finance', status: 'probation', salary: 48000 }
  ])
  logTableEvent('insertRows', { count: rows.length })
}

function handleGetChanges() {
  const changed = getRows(['I', 'U', 'D'])
  console.log('Changed rows:', changed)
  logTableEvent('getRows([I,U,D])', {
    total: changed.length,
    inserted: changed.filter(r => r.procFlag === 'I').length,
    updated: changed.filter(r => r.procFlag === 'U').length,
    deleted: changed.filter(r => r.procFlag === 'D').length
  })
}

function handleGetAll() {
  const all = getRows()
  console.log('All rows with flags:', all)
  logTableEvent('getRows()', {
    total: all.length,
    S: all.filter(r => r.procFlag === 'S').length,
    I: all.filter(r => r.procFlag === 'I').length,
    U: all.filter(r => r.procFlag === 'U').length,
    D: all.filter(r => r.procFlag === 'D').length
  })
}

function handleClearChanges() {
  clearChanges()
  logTableEvent('clearChanges', { hasChanges: hasChanges() })
}

function handleValidate() {
  const errors = validate()
  if (errors.length === 0) {
    toast.showSuccess('All cells valid!')
    logTableEvent('validate', { valid: true })
  } else {
    toast.showWarning(`${errors.length} validation error(s) found`)
    logTableEvent('validate', { valid: false, errorCount: errors.length, errors: errors.slice(0, 5) })
  }
}

function handleClearErrors() {
  clearErrors()
  logTableEvent('clearErrors', { cleared: true })
}

function handleSaveToBackend() {
  // Validate before save
  const errors = validate()
  if (errors.length > 0) {
    toast.showWarning(`Fix ${errors.length} validation error(s) before saving`)
    logTableEvent('save-blocked', { errorCount: errors.length })
    return
  }
  const changed = getRows(['I', 'U', 'D'])
  if (changed.length === 0) {
    logTableEvent('save', { message: 'No changes to save' })
    return
  }
  console.log('Payload for backend:', JSON.stringify(changed, null, 2))
  logTableEvent('save', {
    message: `Would send ${changed.length} rows to backend`,
    payload: changed.map((r: any) => ({ procFlag: r.procFlag, key: r.id, name: r.name }))
  })
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('sidebar.dashboard') }}
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Welcome back, Admin
      </p>
    </div>

    <!-- PermissionGate Demo -->
    <div class="flex flex-col gap-4 mb-6">
      <PCard>
        <template #title>
          <span class="text-base">PermissionGate Demo</span>
        </template>
        <template #content>
          <div class="flex flex-col gap-6">
            <!-- Hide (default) — single permission -->
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                behavior="hide" (default) — single permission
              </p>
              <PermissionGate :permission="{ action: ABILITY_ACTION.READ, subject: ABILITY_SUBJECT.USER }">
                <Button
                  label="Visible to users with read:User"
                  variant="info"
                />
              </PermissionGate>
            </div>

            <!-- Hide — multiple permissions (ANY match) -->
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                behavior="hide" — multiple permissions (ANY match = visible)
              </p>
              <PermissionGate
                :permission="[
                  { action: ABILITY_ACTION.CREATE, subject: ABILITY_SUBJECT.USER },
                  { action: ABILITY_ACTION.UPDATE, subject: ABILITY_SUBJECT.USER }
                ]"
              >
                <Button
                  label="Visible if create:User OR update:User"
                  variant="success"
                />
              </PermissionGate>
            </div>

            <!-- Disable -->
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                behavior="disable" — greyed out, no interaction
              </p>
              <PermissionGate
                :permission="{ action: ABILITY_ACTION.DELETE, subject: ABILITY_SUBJECT.USER }"
                behavior="disable"
              >
                <Button
                  label="Delete User (disabled without permission)"
                  variant="danger"
                />
              </PermissionGate>
            </div>

            <!-- Placeholder -->
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                behavior="placeholder" — shows fallback slot
              </p>
              <PermissionGate
                :permission="{ action: ABILITY_ACTION.MANAGE, subject: ABILITY_SUBJECT.ALL }"
                behavior="placeholder"
              >
                <div class="p-3 bg-green-50 dark:bg-green-900/30 rounded text-green-700 dark:text-green-300 text-sm">
                  Admin Panel Content
                </div>
                <template #fallback>
                  <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded text-gray-500 dark:text-gray-400 text-sm">
                    You need admin access to view this section.
                  </div>
                </template>
              </PermissionGate>
            </div>

            <!-- Programmatic check -->
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Programmatic: useAppPermission().hasPermission()
              </p>
              <pre class="text-xs font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded p-3">hasPermission('read', 'User') = {{ useAppPermission().hasPermission('read', 'User') }}
hasPermission('manage', 'all') = {{ useAppPermission().hasPermission('manage', 'all') }}</pre>
            </div>
          </div>
        </template>
      </PCard>
    </div>

    <!-- Input Components Showcase -->
    <div class="flex flex-col gap-4">
      <!-- SearchCard Demo -->
      <PCard>
        <template #title>
          <span class="text-base">SearchCard Demo</span>
        </template>
        <template #content>
          <div class="flex flex-col gap-6">
            <!-- Auto-search mode -->
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                autoSearch=true — emits on value change with 400ms debounce
              </p>
              <SearchCard
                :form="searchForm"
                :auto-search="true"
                :debounce="400"
                :cols="{ base: 1, sm: 2, md: 3 }"
                @search="handleSearch"
              >
                <Input
                  v-bind="searchForm.field('name')"
                  label="Name"
                  placeholder="Search by name..."
                />
                <Select
                  v-bind="searchForm.field('status')"
                  label="Status"
                  :options="searchStatuses"
                  option-label="label"
                  option-value="value"
                  show-clear
                />
                <DatePicker
                  v-bind="searchForm.field('dateFrom')"
                  label="Date From"
                />
              </SearchCard>
            </div>

            <!-- Manual submit mode -->
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                autoSearch=false — emits on form submit, starts collapsed
              </p>
              <SearchCard
                :form="searchForm"
                min-child-width="180px"
                @search="handleSearch"
              >
                <Input
                  v-bind="searchForm.field('name')"
                  label="Name"
                  placeholder="Search by name..."
                />
                <Select
                  v-bind="searchForm.field('status')"
                  label="Status"
                  :options="searchStatuses"
                  option-label="label"
                  option-value="value"
                  show-clear
                />
                <DatePicker
                  v-bind="searchForm.field('dateFrom')"
                  label="Date From"
                />
              </SearchCard>
            </div>
          </div>
        </template>
      </PCard>

      <!-- useAppForm Demo -->
      <PCard>
        <template #title>
          <div class="flex items-center justify-between">
            <span class="text-base">Form Demo (useAppForm + Zod)</span>
            <span
              v-if="isDirty"
              class="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded"
            >
              Unsaved changes
            </span>
          </div>
        </template>
        <template #content>
          <ClientOnly>
            <Form
              ref="formRef"
              v-bind="formProps"
              v-slot="$form"
            >
              <Flex
                direction="col"
                gap="4"
              >
                <!-- Text Inputs -->
                <Grid
                  :cols="{ base: 1, md: 2 }"
                  gap="4"
                >
                  <Input
                    v-bind="field('name')"
                    label="Full Name"
                    placeholder="Enter your name"
                    required
                    hint="At least 2 characters"
                  />
                  <Input
                    v-bind="field('email')"
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                  <Input
                    v-bind="field('password')"
                    label="Password"
                    type="password"
                    placeholder="Enter password"
                    hint="Must be at least 8 characters"
                  />
                  <Input
                    model-value=""
                    label="Disabled Input"
                    disabled
                  />
                </Grid>

                <Input
                  v-bind="field('bio')"
                  label="Bio"
                  variant="textarea"
                  placeholder="Tell us about yourself..."
                  hint="Max 500 characters"
                  :rows="4"
                  :auto-resize="true"
                />

                <!-- InputNumber -->
                <Grid
                  :cols="{ base: 1, md: 3 }"
                  gap="4"
                >
                  <InputNumber
                    v-bind="field('age')"
                    label="Age"
                    :min="1"
                    :max="150"
                    placeholder="Enter age"
                    hint="1–150"
                  />
                  <InputNumber
                    v-bind="field('price')"
                    label="Price"
                    mode="currency"
                    currency="USD"
                    postfix="USD"
                    :min-fraction-digits="2"
                    placeholder="0.00"
                  />
                  <InputNumber
                    v-bind="field('quantity')"
                    label="Quantity"
                    show-buttons
                    :min="0"
                    :max="100"
                    suffix=" pcs"
                  />
                </Grid>

                <!-- Select -->
                <Grid
                  :cols="{ base: 1, md: 2 }"
                  gap="4"
                >
                  <Select
                    v-bind="field('role')"
                    label="Role"
                    :options="roles"
                    option-label="label"
                    option-value="value"
                    required
                    filterable
                  />
                  <Select
                    v-bind="field('country')"
                    label="Country"
                    :options="countries"
                    option-label="name"
                    option-value="code"
                    filterable
                    show-clear
                    hint="Type to search countries"
                  />
                  <Select
                    v-bind="field('tags')"
                    label="Tags (Multi)"
                    :options="roles"
                    option-label="label"
                    option-value="value"
                    multiple
                    filterable
                    show-clear
                    hint="Select multiple options"
                  />
                </Grid>

                <!-- CheckBox -->
                <Flex
                  direction="col"
                  gap="3"
                >
                  <CheckBox
                    v-bind="field('agreeTerms')"
                    label="I agree to the Terms and Conditions"
                    required
                    true-value="yes"
                    false-value="no"
                  />
                  <CheckBox
                    v-bind="field('newsletter')"
                    label="Subscribe to newsletter"
                    hint="We'll send you updates once a week"
                  />
                </Flex>

                <!-- Toggle -->
                <Flex
                  direction="col"
                  gap="3"
                >
                  <Toggle
                    v-bind="field('darkMode')"
                    label="Enable dark mode"
                  />
                  <Toggle
                    v-bind="field('notifications')"
                    label="Email notifications"
                    hint="Receive updates about account activity"
                    required
                  />
                  <Toggle
                    :model-value="false"
                    label="Disabled toggle"
                    disabled
                  />
                </Flex>

                <!-- RadioGroup -->
                <Grid
                  :cols="{ base: 1, md: 2 }"
                  gap="4"
                >
                  <RadioGroup
                    v-bind="field('priority')"
                    label="Priority"
                    :options="priorities"
                    option-label="label"
                    option-value="value"
                    required
                  />
                  <RadioGroup
                    v-bind="field('status')"
                    label="Status"
                    :options="statuses"
                    option-label="label"
                    option-value="value"
                    direction="horizontal"
                    hint="Choose the publication status"
                  />
                </Grid>

                <!-- DatePicker -->
                <Grid
                  :cols="{ base: 1, md: 2 }"
                  gap="4"
                >
                  <DatePicker
                    v-bind="field('startDate')"
                    label="Start Date"
                    required
                  />
                  <DatePicker
                    v-bind="field('startDateTime')"
                    label="Start Date & Time"
                    variant="datetime"
                    hint="Date with time picker"
                  />
                  <DatePicker
                    v-bind="field('startTime')"
                    label="Start Time"
                    variant="time"
                    hint="Time only picker"
                  />
                  <DatePicker
                    v-bind="field('dateRange')"
                    label="Date Range"
                    range
                    hint="Select start and end dates"
                  />
                </Grid>

                <!-- RichEditor -->
                <RichEditor
                  v-bind="field('content')"
                  label="Content"
                  hint="Format your text with the toolbar above"
                  :height="200"
                />

                <!-- Form Actions -->
                <Flex
                  wrap="wrap"
                  align="center"
                  gap="2"
                >
                  <SaveButton
                    type="submit"
                    :loading="isSubmitting"
                  />
                  <Button
                    label="Reset"
                    variant="secondary"
                    outlined
                    icon="pi pi-refresh"
                    @click="resetForm"
                  />
                </Flex>

                <!-- Form State Debug -->
                <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                  <p class="text-xs font-mono text-gray-500 dark:text-gray-400">
                    dirty: <span :class="isDirty ? 'text-amber-600' : 'text-green-600'">{{ isDirty }}</span>
                    &nbsp;|&nbsp;
                    valid: <span :class="$form.valid ? 'text-green-600' : 'text-red-500'">{{ $form.valid }}</span>
                  </p>
                  <details>
                    <summary class="text-xs font-mono text-gray-500 dark:text-gray-400 cursor-pointer">
                      Current values
                    </summary>
                    <pre class="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-1">{{ JSON.stringify(values, null, 2) }}</pre>
                  </details>
                  <details v-if="lastSubmitted">
                    <summary class="text-xs font-mono text-green-600 dark:text-green-400 cursor-pointer">
                      Last submitted values
                    </summary>
                    <pre class="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-1">{{ JSON.stringify(lastSubmitted, null, 2) }}</pre>
                  </details>
                </div>
              </Flex>
            </Form>
          </ClientOnly>
        </template>
      </PCard>

      <!-- AppDataTable Demo -->
      <PCard>
        <template #title>
          <span class="text-base">AppDataTable Demo</span>
        </template>
        <template #content>
          <div class="flex flex-wrap gap-2 mb-4">
            <!-- procFlag Operations -->
            <Button
              label="Insert Row"
              icon="pi pi-plus"
              variant="info"
              size="sm"
              @click="handleInsertRow"
            />
            <Button
              label="Batch Insert (3)"
              icon="pi pi-plus-circle"
              variant="info"
              size="sm"
              outlined
              @click="handleBatchInsert"
            />
            <Button
              label="Get Changes"
              icon="pi pi-sync"
              variant="warn"
              size="sm"
              @click="handleGetChanges"
            />
            <Button
              label="Get All"
              icon="pi pi-list"
              variant="secondary"
              size="sm"
              @click="handleGetAll"
            />
            <Button
              label="Save to Backend"
              icon="pi pi-cloud-upload"
              variant="success"
              size="sm"
              @click="handleSaveToBackend"
            />
            <Button
              label="Clear Changes"
              icon="pi pi-undo"
              variant="secondary"
              size="sm"
              outlined
              @click="handleClearChanges"
            />
            <!-- Validation -->
            <Button
              label="Validate All"
              icon="pi pi-check-circle"
              variant="warn"
              size="sm"
              @click="handleValidate"
            />
            <Button
              label="Clear Errors"
              icon="pi pi-eraser"
              variant="secondary"
              size="sm"
              outlined
              @click="handleClearErrors"
            />
            <span
              v-if="!isValid"
              class="inline-flex items-center text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded"
            >
              Has Errors
            </span>
            <span
              v-if="hasChanges()"
              class="inline-flex items-center text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded"
            >
              Unsaved Changes
            </span>
            <!-- Existing -->
            <Button
              label="Export CSV"
              icon="pi pi-file"
              variant="secondary"
              size="sm"
              @click="tableRef?.exportTable('csv', 'all')"
            />
            <Button
              label="Export XLSX"
              icon="pi pi-file-excel"
              variant="success"
              size="sm"
              @click="tableRef?.exportTable('xlsx', 'all')"
            />
          </div>

          <AppDataTable
            ref="tableRef"
            :rows="employees"
            :columns="tableColumns"
            table-height="400px"
            data-mode="pagination"
            :page-size="10"
            pagination-mode="client"
            sort-backend="client"
            :editable="true"
            :selectable="true"
            selection-mode="checkbox"
            :show-footer="true"
            :header-context-menu="true"
            :row-context-menu="true"
            export-filename="employees"
            :cell-config="tableCellConfig"
            @page="logTableEvent('page', $event)"
            @sort="logTableEvent('sort', $event)"
            @row-edit-save="logTableEvent('edit-save', { field: $event.field, value: $event })"
            @selection-change="logTableEvent('selection', { count: $event.length })"
            @refresh="logTableEvent('refresh', {})"
          />

          <div
            v-if="tableEventLog.length > 0"
            class="mt-4"
          >
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
              Event Log
            </p>
            <div class="bg-gray-50 dark:bg-gray-800 rounded p-3 text-xs font-mono max-h-32 overflow-y-auto">
              <div
                v-for="(entry, i) in tableEventLog"
                :key="i"
                class="py-0.5 text-gray-600 dark:text-gray-300"
              >
                {{ entry }}
              </div>
            </div>
          </div>
        </template>
      </PCard>

      <!-- Column Groups Demo (AppDataTable children) -->
      <PCard>
        <template #title>
          <span class="text-base">Grouped Headers Demo (children)</span>
        </template>
        <template #content>
          <AppDataTable
            :rows="salesData"
            :columns="salesColumns"
            table-height="400px"
            data-mode="pagination"
            :page-size="10"
            pagination-mode="client"
            sort-backend="client"
          />
        </template>
      </PCard>

      <!-- RowSpan Demo -->
      <PCard>
        <template #title>
          <span class="text-base">RowSpan Demo (auto-merge + selection)</span>
        </template>
        <template #content>
          <div class="flex flex-wrap gap-2 mb-4">
            <Button
              label="Delete Selected"
              icon="pi pi-trash"
              variant="danger"
              size="sm"
              :disabled="rowSpanSelectionCount === 0"
              @click="handleDeleteRowSpanRows"
            />
            <span
              v-if="rowSpanSelectionCount > 0"
              class="inline-flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded"
            >
              {{ rowSpanSelectionCount }} row(s) selected
            </span>
          </div>
          <AppDataTable
            ref="rowSpanTableRef"
            :rows="rowSpanData"
            :columns="rowSpanColumns"
            :editable="true"
            :selectable="true"
            selection-mode="checkbox"
            :show-gridlines="true"
            pagination-mode="client"
            sort-backend="client"
            @row-edit-save="logTableEvent('rowspan-edit', $event)"
            @selection-change="(sel: any[]) => { rowSpanSelectionCount = sel.length; logTableEvent('rowspan-selection', { count: sel.length }) }"
          />
        </template>
      </PCard>

      <!-- Button Showcase (existing) -->
      <PCard>
        <template #title>
          <span class="text-base">Button</span>
        </template>
        <template #content>
          <p class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">
            Variants
          </p>
          <div class="flex flex-wrap gap-2">
            <Button
              label="Primary"
              icon="pi pi-check"
              @click="handleClick('Primary')"
            />
            <Button
              label="Secondary"
              variant="secondary"
              @click="handleClick('Secondary')"
            />
            <Button
              label="Success"
              variant="success"
              icon="pi pi-check-circle"
              @click="handleSave"
            />
            <Button
              label="Info"
              variant="info"
              icon="pi pi-info-circle"
              @click="handleClick('Info')"
            />
            <Button
              label="Warn"
              variant="warn"
              icon="pi pi-exclamation-triangle"
              @click="handleWarn"
            />
            <Button
              label="Danger"
              variant="danger"
              icon="pi pi-times"
              @click="handleDelete"
            />
            <Button
              label="Help"
              variant="help"
              icon="pi pi-question-circle"
              @click="handleClick('Help')"
            />
            <Button
              label="Contrast"
              variant="contrast"
              @click="handleClick('Contrast')"
            />
          </div>

          <p class="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-6 mb-4">
            Outlined
          </p>
          <div class="flex flex-wrap gap-2">
            <Button
              label="Primary"
              outlined
              @click="handleClick('Outlined Primary')"
            />
            <Button
              label="Secondary"
              variant="secondary"
              outlined
              @click="handleClick('Outlined Secondary')"
            />
            <Button
              label="Success"
              variant="success"
              outlined
              @click="handleSave"
            />
            <Button
              label="Danger"
              variant="danger"
              outlined
              @click="handleDelete"
            />
          </div>

          <p class="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-6 mb-4">
            Text
          </p>
          <div class="flex flex-wrap gap-2">
            <Button
              label="Primary"
              text
              @click="handleClick('Text Primary')"
            />
            <Button
              label="Secondary"
              variant="secondary"
              text
              @click="handleClick('Text Secondary')"
            />
            <Button
              label="Success"
              variant="success"
              text
              @click="handleSave"
            />
            <Button
              label="Danger"
              variant="danger"
              text
              @click="handleDelete"
            />
          </div>

          <p class="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-6 mb-4">
            Sizes
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <Button
              label="XS"
              size="xs"
              @click="handleClick('XS')"
            />
            <Button
              label="Small"
              size="sm"
              @click="handleClick('Small')"
            />
            <Button
              label="Medium"
              size="md"
              @click="handleClick('Medium')"
            />
            <Button
              label="Large"
              size="lg"
              @click="handleClick('Large')"
            />
          </div>

          <p class="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-6 mb-4">
            Icon Only
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <Button
              icon="pi pi-home"
              icon-only
              label="Home"
              @click="handleClick('Home')"
            />
            <Button
              icon="pi pi-cog"
              icon-only
              label="Settings"
              variant="secondary"
              outlined
              @click="handleClick('Settings')"
            />
            <Button
              icon="pi pi-trash"
              icon-only
              label="Delete"
              variant="danger"
              text
              @click="handleDelete"
            />
            <Button
              icon="pi pi-bell"
              icon-only
              label="Notifications"
              variant="info"
              rounded
              @click="handleClick('Notifications')"
            />
          </div>

          <p class="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-6 mb-4">
            States
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <Button
              label="Async Action"
              :loading="loading"
              icon="pi pi-sync"
              @click="handleAsync"
            />
            <Button
              label="Disabled"
              disabled
            />
            <Button
              label="Raised"
              raised
              @click="handleClick('Raised')"
            />
            <Button
              label="Rounded"
              rounded
              icon="pi pi-star"
              @click="handleClick('Rounded')"
            />
            <Button
              label="Link"
              link
              @click="handleClick('Link')"
            />
          </div>

          <p class="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-6 mb-4">
            Save Button
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <SaveButton @click="handleSave" />
            <SaveButton
              show-confirm
              @click="handleSave"
            />
            <SaveButton
              show-confirm
              message="This will overwrite existing data. Continue?"
              @click="handleSave"
            />
          </div>

          <p class="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-6 mb-4">
            Full Width
          </p>
          <Button
            label="Block Button"
            block
            icon="pi pi-arrow-right"
            icon-pos="right"
            @click="handleSave"
          />
        </template>
      </PCard>

      <!-- Layout Components Demo -->
      <PCard>
        <template #title>
          <span class="text-base">Layout Components Demo</span>
        </template>
        <template #content>
          <div class="flex flex-col gap-6">
            <!-- Flex: Basic row -->
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Flex — row, gap="3", align="center"
              </p>
              <Flex
                gap="3"
                align="center"
              >
                <div class="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded px-4 py-2 text-sm font-medium">
                  A
                </div>
                <div class="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded px-4 py-6 text-sm font-medium">
                  B (tall)
                </div>
                <div class="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded px-4 py-2 text-sm font-medium">
                  C
                </div>
              </Flex>
            </div>

            <!-- Flex: Column -->
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Flex — direction="col", gap="2"
              </p>
              <Flex
                direction="col"
                gap="2"
              >
                <div class="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded px-4 py-2 text-sm font-medium">
                  Row 1
                </div>
                <div class="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded px-4 py-2 text-sm font-medium">
                  Row 2
                </div>
                <div class="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded px-4 py-2 text-sm font-medium">
                  Row 3
                </div>
              </Flex>
            </div>

            <!-- Flex: Justify between -->
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Flex — justify="between", align="center"
              </p>
              <Flex
                justify="between"
                align="center"
              >
                <div class="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded px-4 py-2 text-sm font-medium">
                  Left
                </div>
                <div class="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded px-4 py-2 text-sm font-medium">
                  Right
                </div>
              </Flex>
            </div>

            <!-- Flex: Auto-responsive with minChildWidth -->
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Flex — minChildWidth="200px", gap="3" (resize browser to see wrap)
              </p>
              <Flex
                min-child-width="200px"
                gap="3"
              >
                <div
                  v-for="i in 6"
                  :key="i"
                  class="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded px-4 py-3 text-sm font-medium text-center"
                >
                  Item {{ i }}
                </div>
              </Flex>
            </div>

            <!-- Flex: Responsive override -->
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Flex — direction="col", responsive md: direction="row" (stacks on mobile)
              </p>
              <Flex
                direction="col"
                :responsive="{ md: { direction: 'row' } }"
                gap="3"
              >
                <div class="bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded px-4 py-3 text-sm font-medium flex-1 text-center">
                  Panel A
                </div>
                <div class="bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded px-4 py-3 text-sm font-medium flex-1 text-center">
                  Panel B
                </div>
                <div class="bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded px-4 py-3 text-sm font-medium flex-1 text-center">
                  Panel C
                </div>
              </Flex>
            </div>

            <!-- Grid: Auto-responsive -->
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Grid — minChildWidth="200px", gap="3" (auto-fill columns)
              </p>
              <Grid
                min-child-width="200px"
                gap="3"
              >
                <div
                  v-for="i in 8"
                  :key="i"
                  class="bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 rounded px-4 py-4 text-sm font-medium text-center"
                >
                  Card {{ i }}
                </div>
              </Grid>
            </div>

            <!-- Grid: Explicit responsive cols -->
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Grid — cols={ base: 1, sm: 2, lg: 4 }, gap="3"
              </p>
              <Grid
                :cols="{ base: 1, sm: 2, lg: 4 }"
                gap="3"
              >
                <div
                  v-for="i in 4"
                  :key="i"
                  class="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded px-4 py-4 text-sm font-medium text-center"
                >
                  Col {{ i }}
                </div>
              </Grid>
            </div>

            <!-- Grid: Form layout -->
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Grid as="form" — cols=3, gap="3", gapY="4"
              </p>
              <Grid
                as="form"
                :cols="3"
                gap="3"
                gap-y="4"
              >
                <Input
                  model-value="John"
                  label="First Name"
                />
                <Input
                  model-value="Doe"
                  label="Last Name"
                />
                <Input
                  model-value="john@example.com"
                  label="Email"
                />
                <Input
                  model-value="+1234567890"
                  label="Phone"
                />
                <Input
                  model-value="ACME Inc."
                  label="Company"
                />
                <Input
                  model-value="Engineer"
                  label="Title"
                />
              </Grid>
            </div>

            <!-- Container query demo -->
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Grid container — minChildWidth="150px" inside resizable box
              </p>
              <div
                class="resize overflow-auto border border-gray-300 dark:border-gray-600 rounded p-3"
                style="min-width: 200px; max-width: 100%;"
              >
                <Grid
                  container
                  min-child-width="150px"
                  gap="2"
                >
                  <div
                    v-for="i in 6"
                    :key="i"
                    class="bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 rounded px-3 py-3 text-sm font-medium text-center"
                  >
                    {{ i }}
                  </div>
                </Grid>
              </div>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Drag bottom-right corner to resize
              </p>
            </div>
          </div>
        </template>
      </PCard>
    </div>
  </div>
</template>
