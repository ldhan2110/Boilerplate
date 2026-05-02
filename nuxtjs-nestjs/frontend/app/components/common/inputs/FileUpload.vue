<script lang="ts" setup>
defineOptions({ inheritAttrs: false })

import type { FileDto } from '~/types'

interface FileUploadProps {
  modelValue?: (FileDto | File)[]
  label?: string
  error?: string
  hint?: string
  required?: boolean
  multiple?: boolean
  maxFiles?: number
  maxFileSize?: string | number
  accept?: string[]
  display?: 'list' | 'grid'
  readonly?: boolean
  id?: string
  floatLabel?: boolean
  name?: string
}

const props = withDefaults(defineProps<FileUploadProps>(), {
  modelValue: () => [],
  multiple: false,
  maxFiles: 5,
  display: 'list',
  readonly: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: (FileDto | File)[]]
}>()

const { t } = useI18n()

const _uid = useId()
const inputId = computed(() => props.id || `file-upload-${_uid}`)

const fileInputRef = ref<HTMLInputElement | null>(null)

const maxSizeBytes = computed(() => {
  if (props.maxFileSize) return parseFileSize(props.maxFileSize)
  const config = useRuntimeConfig()
  return parseFileSize(config.public.maxFileSize as string)
})

const validationError = ref<string>('')

const acceptString = computed(() => props.accept?.join(','))

function isFileDto(item: FileDto | File): item is FileDto {
  return 'fileId' in item
}

function getFileName(item: FileDto | File): string {
  return isFileDto(item) ? item.fileNm : item.name
}

function getFileSize(item: FileDto | File): number {
  return isFileDto(item) ? item.fileSz : item.size
}

function getFileMime(item: FileDto | File): string {
  return isFileDto(item) ? item.fileTp : item.type
}

function getFileIcon(mime: string): string {
  if (mime.startsWith('image/')) return 'pi pi-image'
  if (mime === 'application/pdf') return 'pi pi-file-pdf'
  if (mime.includes('word') || mime.includes('document')) return 'pi pi-file-word'
  if (mime.includes('excel') || mime.includes('spreadsheet')) return 'pi pi-file-excel'
  return 'pi pi-file'
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function isAccepted(file: File, accept: string[]): boolean {
  return accept.some((pattern) => {
    if (pattern.startsWith('.')) {
      return file.name.toLowerCase().endsWith(pattern.toLowerCase())
    }
    if (pattern.endsWith('/*')) {
      return file.type.startsWith(pattern.replace('/*', '/'))
    }
    return file.type === pattern
  })
}

function addFiles(files: File[]) {
  validationError.value = ''
  const currentFiles = props.modelValue || []
  const filesToAdd = props.multiple ? files : files.slice(0, 1)

  const totalAfter = currentFiles.length + filesToAdd.length
  if (totalAfter > props.maxFiles) {
    validationError.value = t('fileUpload.maxFilesExceeded', { max: props.maxFiles })
    return
  }

  for (const file of filesToAdd) {
    if (file.size > maxSizeBytes.value) {
      validationError.value = t('fileUpload.fileTooLarge', {
        name: file.name,
        max: formatFileSize(maxSizeBytes.value),
      })
      return
    }
    if (props.accept && !isAccepted(file, props.accept)) {
      validationError.value = t('fileUpload.invalidType', { name: file.name })
      return
    }
  }

  emit('update:modelValue', [...currentFiles, ...filesToAdd])
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const selectedFiles = Array.from(input.files || [])
  input.value = ''
  if (!selectedFiles.length) return
  addFiles(selectedFiles)
}

function removeFile(index: number) {
  const updated = [...(props.modelValue || [])]
  updated.splice(index, 1)
  emit('update:modelValue', updated)
}

function getDownloadUrl(item: FileDto): string {
  const config = useRuntimeConfig()
  return `${config.public.apiBase}/file/download/${item.fileId}`
}

const isDragging = ref(false)

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  if (props.readonly) return
  const files = Array.from(event.dataTransfer?.files || [])
  if (!files.length) return
  addFiles(files)
}
</script>

<template>
  <FormField
    :label="label"
    :error="error || validationError"
    :hint="hint"
    :required="required"
    :input-id="inputId"
    :float-label="floatLabel"
    :name="name"
  >
    <div class="flex flex-col gap-2">
      <!-- Drop zone -->
      <div
        v-if="!readonly"
        class="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors"
        :class="[
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400',
        ]"
        @click="triggerFileInput"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <i class="pi pi-upload text-xl text-gray-400 mb-1" />
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ t('fileUpload.dropOrClick') }}
        </p>
        <p v-if="accept" class="text-xs text-gray-400 mt-1">
          {{ accept.join(', ') }}
        </p>
      </div>

      <!-- Hidden file input -->
      <input
        ref="fileInputRef"
        :id="inputId"
        type="file"
        class="hidden"
        :multiple="multiple"
        :accept="acceptString"
        @change="handleFileSelect"
      />

      <!-- List display -->
      <ul
        v-if="modelValue?.length && display === 'list'"
        class="flex flex-col gap-1"
      >
        <li
          v-for="(item, index) in modelValue"
          :key="isFileDto(item) ? item.fileId : `new-${index}`"
          class="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800 text-sm"
        >
          <i :class="getFileIcon(getFileMime(item))" class="text-gray-500" />
          <span class="flex-1 truncate">{{ getFileName(item) }}</span>
          <span class="text-xs text-gray-400">{{ formatFileSize(getFileSize(item)) }}</span>
          <a
            v-if="isFileDto(item)"
            :href="getDownloadUrl(item)"
            target="_blank"
            class="text-primary-500 hover:text-primary-700"
            @click.stop
          >
            <i class="pi pi-download text-sm" />
          </a>
          <button
            v-if="!readonly"
            type="button"
            class="text-red-400 hover:text-red-600"
            @click="removeFile(index)"
          >
            <i class="pi pi-times text-sm" />
          </button>
        </li>
      </ul>

      <!-- Grid display -->
      <div
        v-if="modelValue?.length && display === 'grid'"
        class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2"
      >
        <div
          v-for="(item, index) in modelValue"
          :key="isFileDto(item) ? item.fileId : `new-${index}`"
          class="flex flex-col items-center gap-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-center"
        >
          <i :class="getFileIcon(getFileMime(item))" class="text-2xl text-gray-500" />
          <span class="text-xs truncate w-full">{{ getFileName(item) }}</span>
          <span class="text-xs text-gray-400">{{ formatFileSize(getFileSize(item)) }}</span>
          <div class="flex gap-1 mt-1">
            <a
              v-if="isFileDto(item)"
              :href="getDownloadUrl(item)"
              target="_blank"
              class="text-primary-500 hover:text-primary-700"
              @click.stop
            >
              <i class="pi pi-download text-xs" />
            </a>
            <button
              v-if="!readonly"
              type="button"
              class="text-red-400 hover:text-red-600"
              @click="removeFile(index)"
            >
              <i class="pi pi-times text-xs" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </FormField>
</template>
