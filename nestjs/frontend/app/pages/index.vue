<script setup lang="ts">
import { z } from 'zod'
import { Form } from '@primevue/forms'

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
