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
  const removed = updated.splice(index, 1)[0]
  if (removed && !isFileDto(removed) && objectUrls.has(removed)) {
    URL.revokeObjectURL(objectUrls.get(removed)!)
    objectUrls.delete(removed)
  }
  emit('update:modelValue', updated)
}

function getDownloadUrl(item: FileDto): string {
  const config = useRuntimeConfig()
  return `${config.public.apiBase}/file/download/${item.fileId}`
}

function isImage(item: FileDto | File): boolean {
  return getFileMime(item).startsWith('image/')
}

const objectUrls = new Map<File, string>()

function getPreviewUrl(item: FileDto | File): string {
  if (isFileDto(item)) return getDownloadUrl(item)
  if (objectUrls.has(item)) return objectUrls.get(item)!
  const url = URL.createObjectURL(item)
  objectUrls.set(item, url)
  return url
}

onBeforeUnmount(() => {
  objectUrls.forEach((url) => URL.revokeObjectURL(url))
  objectUrls.clear()
})

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
          <img
            v-if="isImage(item)"
            :src="getPreviewUrl(item)"
            :alt="getFileName(item)"
            class="w-8 h-8 rounded object-cover flex-shrink-0"
          />
          <i v-else :class="getFileIcon(getFileMime(item))" class="text-gray-500" />
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
          class="group relative flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-colors"
        >
          <!-- Actions overlay -->
          <div class="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <a
              v-if="isFileDto(item)"
              :href="getDownloadUrl(item)"
              target="_blank"
              class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-primary-500"
              @click.stop
            >
              <i class="pi pi-download text-xs" />
            </a>
            <button
              v-if="!readonly"
              type="button"
              class="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-400 hover:text-red-600"
              @click="removeFile(index)"
            >
              <i class="pi pi-times text-xs" />
            </button>
          </div>
          <!-- Thumbnail -->
          <img
            v-if="isImage(item)"
            :src="getPreviewUrl(item)"
            :alt="getFileName(item)"
            class="w-14 h-14 rounded-md object-cover"
          />
          <div v-else class="w-14 h-14 rounded-md flex items-center justify-center bg-gray-100 dark:bg-gray-700">
            <i :class="getFileIcon(getFileMime(item))" class="text-4xl text-gray-400" />
          </div>
          <!-- File info -->
          <div class="w-full min-w-0 text-center">
            <p class="text-xs font-medium truncate" :title="getFileName(item)">{{ getFileName(item) }}</p>
            <p class="text-[10px] text-gray-400">{{ formatFileSize(getFileSize(item)) }}</p>
          </div>
        </div>
      </div>
    </div>
  </FormField>
</template>
