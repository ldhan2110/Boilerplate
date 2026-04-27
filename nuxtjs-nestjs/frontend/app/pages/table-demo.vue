<!--
  AppDataTable Demo Page
  Demonstrates all features of the AppDataTable component:
  - 500 mock employees with 7 columns
  - multi-sort (Shift+click), sortBackend toggleable client/server
  - dataMode='pagination', pageSize=25
  - editable=true, cell edit mode
  - selectable=true, selectionMode='multiple'
  - showFooter=true
  - headerContextMenu, rowContextMenu
  - virtualScroll toggleable
  - cellConfig: disables salary edit when status is 'inactive'
  - Export CSV/XLSX buttons
-->
<script setup lang="ts">
import type { ColumnDef, PageEvent, SortEvent, EditSaveEvent } from '~/types/table'

definePageMeta({ layout: 'default' })

// --- Toggle states ---
const serverMode = ref(false)
const virtualScroll = ref(false)
const eventLog = ref<string[]>([])

function log(event: string, data: any) {
  eventLog.value.unshift(`[${new Date().toLocaleTimeString()}] ${event}: ${JSON.stringify(data)}`)
  if (eventLog.value.length > 20) eventLog.value.pop()
}

// --- Mock data ---
const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations']
const statuses = ['active', 'inactive', 'probation']
const allTags = ['frontend', 'backend', 'devops', 'design', 'management', 'data', 'qa']

function generateEmployees(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Employee ${i + 1}`,
    department: departments[i % departments.length],
    salary: Math.round(40000 + Math.random() * 80000),
    hireDate: new Date(2018 + Math.floor(Math.random() * 7), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    status: statuses[i % statuses.length],
    tags: allTags.slice(0, 1 + Math.floor(Math.random() * 3)),
  }))
}

const employees = ref(generateEmployees(500))

// --- Columns ---
const columns: ColumnDef[] = [
  {
    field: 'id',
    header: 'ID',
    width: 80,
    frozen: true,
    editable: false,
    sortable: true,
    align: 'center',
  },
  {
    field: 'name',
    header: 'Name',
    width: 200,
    editable: true,
    editType: 'input',
    sortable: true,
  },
  {
    field: 'department',
    header: 'Department',
    width: 160,
    editable: true,
    editType: 'select',
    editOptions: departments,
    sortable: true,
  },
  {
    field: 'salary',
    header: 'Salary',
    width: 140,
    editable: true,
    editType: 'number',
    editProps: { mode: 'currency', currency: 'USD', locale: 'en-US' },
    align: 'right',
    sortable: true,
    aggregation: 'sum',
    format: (val) => val != null ? `$${Number(val).toLocaleString()}` : '',
    excelProps: { type: 'number', format: '#,##0.00' },
  },
  {
    field: 'hireDate',
    header: 'Hire Date',
    width: 150,
    editable: true,
    editType: 'date',
    editProps: { dateFormat: 'yy-mm-dd' },
    sortable: true,
    excelProps: { type: 'date', format: 'dd/mm/yyyy' },
  },
  {
    field: 'status',
    header: 'Status',
    width: 130,
    editable: true,
    editType: 'select',
    editOptions: statuses,
    sortable: true,
    format: (val) => val ? val.charAt(0).toUpperCase() + val.slice(1) : '',
  },
  {
    field: 'tags',
    header: 'Tags',
    width: 220,
    editable: true,
    editType: 'multiselect',
    editOptions: allTags,
    sortable: false,
    format: (val) => Array.isArray(val) ? val.join(', ') : '',
  },
]

// --- Cell config: disable salary when inactive ---
const cellConfig = (row: any, field: string) => {
  if (field === 'salary' && row.status === 'inactive') {
    return { disabled: true, editable: false, render: () => 'N/A' }
  }
}

// --- Event handlers ---
function onPage(event: PageEvent) {
  log('page', event)
}
function onSort(event: SortEvent) {
  log('sort', event)
}
function onEditSave(event: EditSaveEvent) {
  log('row-edit-save', { field: event.field, newRow: event.newRow })
}
function onSelectionChange(selected: any[]) {
  selectedRows.value = selected
  log('selection-change', { count: selected.length })
}

function deleteSelected() {
  if (!selectedRows.value.length) return
  const keys = selectedRows.value.map((r: any) => r.id)
  tableRef.value?.deleteRows(keys)
  tableRef.value?.clearSelection()
  log('delete-rows', { keys })
}

const tableRef = ref()
const selectedRows = ref<any[]>([])
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">AppDataTable Demo</h1>

    <!-- Controls -->
    <div class="flex gap-4 mb-4 flex-wrap items-center">
      <label class="flex items-center gap-2 text-sm">
        <PCheckbox v-model="serverMode" :binary="true" />
        Server mode
      </label>
      <label class="flex items-center gap-2 text-sm">
        <PCheckbox v-model="virtualScroll" :binary="true" />
        Virtual scroll
      </label>
      <PButton label="Export CSV" icon="pi pi-file" severity="secondary" size="small" @click="tableRef?.exportTable('csv', 'all')" />
      <PButton label="Export XLSX" icon="pi pi-file-excel" severity="success" size="small" @click="tableRef?.exportTable('xlsx', 'all')" />
      <PButton
        label="Delete Selected"
        icon="pi pi-trash"
        severity="danger"
        size="small"
        :disabled="!selectedRows.length"
        @click="deleteSelected"
      />
      <PButton
        label="Reset Table"
        icon="pi pi-undo"
        severity="secondary"
        size="small"
        :disabled="!tableRef?.hasChanges()"
        @click="tableRef?.resetTable()"
      />
    </div>

    <!-- Table -->
    <AppDataTable
      ref="tableRef"
      :rows="employees"
      :columns="columns"
      :data-mode="'pagination'"
      :page-size="25"
      :pagination-mode="serverMode ? 'server' : 'client'"
      :total-records="serverMode ? employees.length : undefined"
      :sort-backend="serverMode ? 'server' : 'client'"
      :editable="true"
      :selectable="true"
      :selection-mode="'checkbox'"
      :show-footer="true"
      :header-context-menu="true"
      :row-context-menu="true"
      :virtual-scroll="virtualScroll"
      :export-filename="'employees'"
      :cell-config="cellConfig"
      @page="onPage"
      @sort="onSort"
      @row-edit-save="onEditSave"
      @selection-change="onSelectionChange"
      @refresh="log('refresh', {})"
    />

    <!-- Event log -->
    <div class="mt-4">
      <h3 class="text-sm font-semibold mb-2">Event Log</h3>
      <div class="bg-surface-100 dark:bg-surface-800 rounded p-3 text-xs font-mono max-h-48 overflow-y-auto">
        <div v-for="(entry, i) in eventLog" :key="i" class="py-0.5">
          {{ entry }}
        </div>
        <div v-if="eventLog.length === 0" class="text-surface-400">
          No events yet. Interact with the table to see events.
        </div>
      </div>
    </div>
  </div>
</template>
