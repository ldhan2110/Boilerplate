<script lang="ts" setup>
import type { ColumnDef } from '~/types/table'

const { tableRef, expandAll, collapseAll } = useAppTreeDataTable()

// Sample org chart data — flat with parentId
const rows = ref([
  { id: 1, parentId: null, name: 'John CEO', title: 'CEO', department: 'Executive', salary: 250000, active: true },
  { id: 2, parentId: 1, name: 'Sarah VP Eng', title: 'VP Engineering', department: 'Engineering', salary: 180000, active: true },
  { id: 3, parentId: 1, name: 'Mike VP Sales', title: 'VP Sales', department: 'Sales', salary: 170000, active: true },
  { id: 4, parentId: 1, name: 'Lisa VP HR', title: 'VP Human Resources', department: 'HR', salary: 160000, active: true },
  { id: 5, parentId: 2, name: 'Tom Lead', title: 'Tech Lead', department: 'Engineering', salary: 140000, active: true },
  { id: 6, parentId: 2, name: 'Jane Lead', title: 'QA Lead', department: 'Engineering', salary: 130000, active: true },
  { id: 7, parentId: 3, name: 'Bob Manager', title: 'Sales Manager', department: 'Sales', salary: 120000, active: true },
  { id: 8, parentId: 3, name: 'Amy Rep', title: 'Sales Rep', department: 'Sales', salary: 80000, active: false },
  { id: 9, parentId: 5, name: 'Dave Dev', title: 'Senior Developer', department: 'Engineering', salary: 120000, active: true },
  { id: 10, parentId: 5, name: 'Eve Dev', title: 'Developer', department: 'Engineering', salary: 100000, active: true },
  { id: 11, parentId: 5, name: 'Frank Dev', title: 'Junior Developer', department: 'Engineering', salary: 75000, active: true },
  { id: 12, parentId: 6, name: 'Grace QA', title: 'QA Engineer', department: 'Engineering', salary: 95000, active: true },
  { id: 13, parentId: 4, name: 'Helen HR', title: 'HR Manager', department: 'HR', salary: 110000, active: true },
  { id: 14, parentId: 4, name: 'Ivan Recruit', title: 'Recruiter', department: 'HR', salary: 70000, active: false },
  { id: 15, parentId: 7, name: 'Kate Rep', title: 'Sales Rep', department: 'Sales', salary: 75000, active: true },
])

const totalRecords = computed(() => rows.value.length)

const columns: ColumnDef[] = [
  { field: 'name', header: 'Name', sortable: true, width: 220 },
  { field: 'title', header: 'Title', sortable: true, width: 200 },
  { field: 'department', header: 'Department', sortable: true, width: 150 },
  {
    field: 'salary',
    header: 'Salary',
    sortable: true,
    width: 120,
    align: 'right',
    editable: true,
    editType: 'number',
    format: (val: number) => val != null ? `$${val.toLocaleString()}` : '',
  },
  {
    field: 'active',
    header: 'Active',
    width: 80,
    align: 'center',
    editable: true,
    editType: 'toggle',
  },
]

function handleSort(payload: any) {
  console.log('Sort:', payload)
}

function handleEditSave(payload: any) {
  console.log('Edit save:', payload)
}

function handleReparent(payload: any) {
  console.log('Reparent:', payload)
}
</script>

<template>
  <div class="flex flex-col gap-2.5 pt-1 p-4">
    <h2 class="text-xl font-bold">AppTreeDataTable Demo</h2>
    <p class="text-sm text-surface-500">Org chart tree with sorting, editing, selection, and drag-drop reparenting.</p>

    <AppTreeDataTable
      ref="tableRef"
      :rows="rows"
      :columns="columns"
      :total-records="totalRecords"
      :loading="false"
      :editable="true"
      :selectable="true"
      selection-mode="checkbox"
      :draggable-rows="true"
      pagination-mode="client"
      sort-backend="client"
      :page-size="25"
      :table-height="200"
      @sort="handleSort"
      @row-edit-save="handleEditSave"
      @node-reparent="handleReparent"
    >
      <template #toolbar>
        <PButton label="Expand All" icon="pi pi-angle-double-down" severity="secondary" size="small" @click="expandAll()" />
        <PButton label="Collapse All" icon="pi pi-angle-double-up" severity="secondary" size="small" @click="collapseAll()" />
      </template>
    </AppTreeDataTable>
  </div>
</template>
