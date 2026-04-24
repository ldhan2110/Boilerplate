<script setup lang="ts">
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

// --- Input demo state ---
const form = reactive({
  name: '',
  email: '',
  password: '',
  bio: '',
  role: null as string | null,
  country: null as string | null,
  agreeTerms: false,
  newsletter: false,
  startDate: null as Date | null,
  dateRange: null as Date[] | null,
  content: '',
})

const roles = [
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' },
]

const countries = [
  { name: 'Vietnam', code: 'VN' },
  { name: 'United States', code: 'US' },
  { name: 'Japan', code: 'JP' },
  { name: 'South Korea', code: 'KR' },
  { name: 'Germany', code: 'DE' },
  { name: 'France', code: 'FR' },
  { name: 'United Kingdom', code: 'GB' },
]

// Simulated validation errors
const errors = reactive({
  email: '',
  name: '',
})

function validateEmail() {
  if (!form.email) {
    errors.email = 'common.required'
  } else if (!form.email.includes('@')) {
    errors.email = 'Invalid email format'
  } else {
    errors.email = ''
  }
}

function validateName() {
  errors.name = form.name.length < 2 ? 'Name must be at least 2 characters' : ''
}

function submitForm() {
  validateEmail()
  validateName()
  if (!errors.email && !errors.name) {
    toast.showSuccess('Form submitted successfully!')
  } else {
    toast.showError('Please fix the errors above')
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
      <!-- Text Inputs -->
      <PCard>
        <template #title>
          <span class="text-base">Input</span>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              v-model="form.name"
              label="Full Name"
              placeholder="Enter your name"
              required
              :error="errors.name"
              hint="At least 2 characters"
              @update:model-value="validateName"
            />
            <Input
              v-model="form.email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              required
              :error="errors.email"
              @update:model-value="validateEmail"
            />
            <Input
              v-model="form.password"
              label="Password"
              type="password"
              placeholder="Enter password"
              hint="Must be at least 8 characters"
            />
            <Input
              v-model="form.name"
              label="Disabled Input"
              disabled
            />
          </div>

          <div class="mt-4">
            <Input
              v-model="form.bio"
              label="Bio"
              variant="textarea"
              placeholder="Tell us about yourself..."
              hint="Max 500 characters"
              :rows="4"
            />
          </div>
        </template>
      </PCard>

      <!-- Select -->
      <PCard>
        <template #title>
          <span class="text-base">Select</span>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              v-model="form.role"
              label="Role"
              :options="roles"
              option-label="label"
              option-value="value"
              required
            />
            <Select
              v-model="form.country"
              label="Country"
              :options="countries"
              option-label="name"
              option-value="code"
              filterable
              show-clear
              hint="Type to search countries"
            />
          </div>
        </template>
      </PCard>

      <!-- CheckBox -->
      <PCard>
        <template #title>
          <span class="text-base">CheckBox</span>
        </template>
        <template #content>
          <div class="flex flex-col gap-3">
            <CheckBox
              v-model="form.agreeTerms"
              label="I agree to the Terms and Conditions"
              required
            />
            <CheckBox
              v-model="form.newsletter"
              label="Subscribe to newsletter"
              hint="We'll send you updates once a week"
            />
            <CheckBox
              :model-value="false"
              label="Disabled option"
              disabled
            />
          </div>
        </template>
      </PCard>

      <!-- DatePicker -->
      <PCard>
        <template #title>
          <span class="text-base">DatePicker</span>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker
              v-model="form.startDate"
              label="Start Date"
              required
            />
            <DatePicker
              v-model="form.dateRange"
              label="Date Range"
              range
              hint="Select start and end dates"
            />
          </div>
        </template>
      </PCard>

      <!-- RichEditor -->
      <PCard>
        <template #title>
          <span class="text-base">Rich Editor</span>
        </template>
        <template #content>
          <RichEditor
            v-model="form.content"
            label="Content"
            hint="Format your text with the toolbar above"
            :height="200"
          />
        </template>
      </PCard>

      <!-- Form Submit Demo -->
      <PCard>
        <template #title>
          <span class="text-base">Form Actions</span>
        </template>
        <template #content>
          <div class="flex flex-wrap items-center gap-2">
            <Button label="Submit Form" icon="pi pi-check" @click="submitForm" />
            <SaveButton show-confirm @click="handleSave" />
          </div>

          <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p class="text-xs font-mono text-gray-500 dark:text-gray-400 mb-1">Form State (reactive)</p>
            <pre class="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ JSON.stringify(form, null, 2) }}</pre>
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
