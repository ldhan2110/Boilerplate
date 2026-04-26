<script setup lang="ts">
import { z } from 'zod'
import { Form } from '@primevue/forms'
import type { ColumnDef, EditSaveEvent, PageEvent, SortEvent } from '~/types/table'

const { t } = useI18n()
const toast = useAppToast()
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
  agreeTerms: z.boolean().optional(),
  newsletter: z.boolean().optional(),
  darkMode: z.boolean().optional(),
  notifications: z.boolean().optional(),
  startDate: z.any().nullable().optional(),
  dateRange: z.any().nullable().optional(),
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

// --- AppDataTable demo ---
const tableRef = ref()
const tableEventLog = ref<string[]>([])

function logTableEvent(event: string, data: any) {
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
    hireDate: new Date(2020 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    isRemote: i % 3 === 0,
    isVerified: i % 2 === 0,
  }))
)

const tableColumns: ColumnDef[] = [
  { field: 'id', header: 'ID', width: 70, frozen: true, editable: false, sortable: true, align: 'center' },
  { field: 'name', header: 'Name', width: 180, editable: true, editType: 'input', sortable: true },
  { field: 'department', header: 'Department', width: 150, editable: true, editType: 'select', editOptions: departments, sortable: true },
  { field: 'salary', header: 'Salary', width: 130, editable: true, editType: 'number', align: 'right', sortable: true, aggregation: 'sum', format: (val) => val != null ? `$${Number(val).toLocaleString()}` : '' },
  { field: 'status', header: 'Status', width: 120, editable: true, editType: 'select', editOptions: employeeStatuses, sortable: true, format: (val) => val ? val.charAt(0).toUpperCase() + val.slice(1) : '' },
  { field: 'hireDate', header: 'Hire Date', width: 130, editable: true, editType: 'date', sortable: true },
  { field: 'isRemote', header: 'Remote', width: 100, editable: true, editType: 'checkbox', align: 'center', sortable: true },
  { field: 'isVerified', header: 'Verified', width: 100, editable: true, editType: 'toggle', align: 'center', sortable: true },
]

const tableCellConfig = (row: any, field: string) => {
  if (field === 'salary' && row.status === 'inactive') {
    return { disabled: true, editable: false, render: () => 'N/A' }
  }
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

    <!-- Input Components Showcase -->
    <div class="flex flex-col gap-4">
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
            <Form ref="formRef" v-bind="formProps" v-slot="$form" class="flex flex-col gap-4">
              <!-- Text Inputs -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <Input
                v-bind="field('bio')"
                label="Bio"
                variant="textarea"
                placeholder="Tell us about yourself..."
                hint="Max 500 characters"
                :rows="4"
                :autoResize="true"
              />

              <!-- InputNumber -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>

              <!-- Select -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <!-- CheckBox -->
              <div class="flex flex-col gap-3">
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
              </div>

              <!-- Toggle -->
              <div class="flex flex-col gap-3">
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
              </div>

              <!-- RadioGroup -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <!-- DatePicker -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePicker
                  v-bind="field('startDate')"
                  label="Start Date"
                  required
                />
                <DatePicker
                  v-bind="field('dateRange')"
                  label="Date Range"
                  range
                  hint="Select start and end dates"
                />
              </div>

              <!-- RichEditor -->
              <RichEditor
                v-bind="field('content')"
                label="Content"
                hint="Format your text with the toolbar above"
                :height="200"
              />

              <!-- Form Actions -->
              <div class="flex flex-wrap items-center gap-2">
                <SaveButton type="submit" :loading="isSubmitting" />
                <Button
                  label="Reset"
                  variant="secondary"
                  outlined
                  icon="pi pi-refresh"
                  @click="resetForm"
                />
              </div>

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
            <Button label="Export CSV" icon="pi pi-file" variant="secondary" size="sm" @click="tableRef?.exportTable('csv', 'all')" />
            <Button label="Export XLSX" icon="pi pi-file-excel" variant="success" size="sm" @click="tableRef?.exportTable('xlsx', 'all')" />
            <Button label="Clear Selection" icon="pi pi-times" variant="secondary" size="sm" outlined @click="tableRef?.clearSelection()" />
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
            @row-edit-save="logTableEvent('edit-save', { field: $event.field })"
            @selection-change="logTableEvent('selection', { count: $event.length })"
            @refresh="logTableEvent('refresh', {})"
          />

          <div v-if="tableEventLog.length > 0" class="mt-4">
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Event Log</p>
            <div class="bg-gray-50 dark:bg-gray-800 rounded p-3 text-xs font-mono max-h-32 overflow-y-auto">
              <div v-for="(entry, i) in tableEventLog" :key="i" class="py-0.5 text-gray-600 dark:text-gray-300">
                {{ entry }}
              </div>
            </div>
          </div>
        </template>
      </PCard>

      <!-- Button Showcase (existing) -->
      <PCard>
        <template #title>
          <span class="text-base">Button</span>
        </template>
        <template #content>
          <p class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">Variants</p>
          <div class="flex flex-wrap gap-2">
            <Button label="Primary" icon="pi pi-check" @click="handleClick('Primary')" />
            <Button label="Secondary" variant="secondary" @click="handleClick('Secondary')" />
            <Button label="Success" variant="success" icon="pi pi-check-circle" @click="handleSave" />
            <Button label="Info" variant="info" icon="pi pi-info-circle" @click="handleClick('Info')" />
            <Button label="Warn" variant="warn" icon="pi pi-exclamation-triangle" @click="handleWarn" />
            <Button label="Danger" variant="danger" icon="pi pi-times" @click="handleDelete" />
            <Button label="Help" variant="help" icon="pi pi-question-circle" @click="handleClick('Help')" />
            <Button label="Contrast" variant="contrast" @click="handleClick('Contrast')" />
          </div>

          <p class="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-6 mb-4">Outlined</p>
          <div class="flex flex-wrap gap-2">
            <Button label="Primary" outlined @click="handleClick('Outlined Primary')" />
            <Button label="Secondary" variant="secondary" outlined @click="handleClick('Outlined Secondary')" />
            <Button label="Success" variant="success" outlined @click="handleSave" />
            <Button label="Danger" variant="danger" outlined @click="handleDelete" />
          </div>

          <p class="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-6 mb-4">Text</p>
          <div class="flex flex-wrap gap-2">
            <Button label="Primary" text @click="handleClick('Text Primary')" />
            <Button label="Secondary" variant="secondary" text @click="handleClick('Text Secondary')" />
            <Button label="Success" variant="success" text @click="handleSave" />
            <Button label="Danger" variant="danger" text @click="handleDelete" />
          </div>

          <p class="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-6 mb-4">Sizes</p>
          <div class="flex flex-wrap items-center gap-2">
            <Button label="XS" size="xs" @click="handleClick('XS')" />
            <Button label="Small" size="sm" @click="handleClick('Small')" />
            <Button label="Medium" size="md" @click="handleClick('Medium')" />
            <Button label="Large" size="lg" @click="handleClick('Large')" />
          </div>

          <p class="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-6 mb-4">Icon Only</p>
          <div class="flex flex-wrap items-center gap-2">
            <Button icon="pi pi-home" icon-only label="Home" @click="handleClick('Home')" />
            <Button icon="pi pi-cog" icon-only label="Settings" variant="secondary" outlined @click="handleClick('Settings')" />
            <Button icon="pi pi-trash" icon-only label="Delete" variant="danger" text @click="handleDelete" />
            <Button icon="pi pi-bell" icon-only label="Notifications" variant="info" rounded @click="handleClick('Notifications')" />
          </div>

          <p class="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-6 mb-4">States</p>
          <div class="flex flex-wrap items-center gap-2">
            <Button label="Async Action" :loading="loading" icon="pi pi-sync" @click="handleAsync" />
            <Button label="Disabled" disabled />
            <Button label="Raised" raised @click="handleClick('Raised')" />
            <Button label="Rounded" rounded icon="pi pi-star" @click="handleClick('Rounded')" />
            <Button label="Link" link @click="handleClick('Link')" />
          </div>

          <p class="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-6 mb-4">Save Button</p>
          <div class="flex flex-wrap items-center gap-2">
            <SaveButton @click="handleSave" />
            <SaveButton show-confirm @click="handleSave" />
            <SaveButton show-confirm message="This will overwrite existing data. Continue?" @click="handleSave" />
          </div>

          <p class="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-6 mb-4">Full Width</p>
          <Button label="Block Button" block icon="pi pi-arrow-right" icon-pos="right" @click="handleSave" />
        </template>
      </PCard>
    </div>
  </div>
</template>
