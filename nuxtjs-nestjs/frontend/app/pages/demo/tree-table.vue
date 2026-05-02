<script lang="ts" setup>
import type { ColumnDef, FooterAgg } from '~/types/table'

const { tableRef, expandAll, collapseAll, getSelectedRows, exportTable } = useAppTreeDataTable()

// Sample org chart data — flat with parentId
const rows = ref([
  // Executive
  { id: 1, parentId: null, name: 'John CEO', title: 'CEO', department: 'Executive', location: 'New York', salary: 250000, bonus: 50000, active: true },
  // Engineering
  { id: 2, parentId: 1, name: 'Sarah VP Eng', title: 'VP Engineering', department: 'Engineering', location: 'San Francisco', salary: 180000, bonus: 36000, active: true },
  { id: 5, parentId: 2, name: 'Tom Lead', title: 'Tech Lead', department: 'Engineering', location: 'San Francisco', salary: 140000, bonus: 21000, active: true },
  { id: 9, parentId: 5, name: 'Dave Dev', title: 'Senior Developer', department: 'Engineering', location: 'San Francisco', salary: 120000, bonus: 18000, active: true },
  { id: 10, parentId: 5, name: 'Eve Dev', title: 'Developer', department: 'Engineering', location: 'Remote', salary: 100000, bonus: 10000, active: true },
  { id: 11, parentId: 5, name: 'Frank Dev', title: 'Junior Developer', department: 'Engineering', location: 'Remote', salary: 75000, bonus: 5000, active: true },
  { id: 16, parentId: 5, name: 'Nora Dev', title: 'Developer', department: 'Engineering', location: 'Austin', salary: 105000, bonus: 12000, active: true },
  { id: 6, parentId: 2, name: 'Jane Lead', title: 'QA Lead', department: 'Engineering', location: 'San Francisco', salary: 130000, bonus: 19500, active: true },
  { id: 12, parentId: 6, name: 'Grace QA', title: 'QA Engineer', department: 'Engineering', location: 'Remote', salary: 95000, bonus: 9500, active: true },
  { id: 17, parentId: 6, name: 'Oscar QA', title: 'QA Engineer', department: 'Engineering', location: 'Austin', salary: 92000, bonus: 9000, active: true },
  { id: 18, parentId: 2, name: 'Pete DevOps', title: 'DevOps Lead', department: 'Engineering', location: 'San Francisco', salary: 135000, bonus: 20000, active: true },
  { id: 19, parentId: 18, name: 'Quinn SRE', title: 'SRE Engineer', department: 'Engineering', location: 'Remote', salary: 115000, bonus: 12000, active: true },
  // Sales
  { id: 3, parentId: 1, name: 'Mike VP Sales', title: 'VP Sales', department: 'Sales', location: 'Chicago', salary: 170000, bonus: 40000, active: true },
  { id: 7, parentId: 3, name: 'Bob Manager', title: 'Sales Manager', department: 'Sales', location: 'Chicago', salary: 120000, bonus: 24000, active: true },
  { id: 8, parentId: 3, name: 'Amy Rep', title: 'Sales Rep', department: 'Sales', location: 'Chicago', salary: 80000, bonus: 16000, active: false },
  { id: 15, parentId: 7, name: 'Kate Rep', title: 'Sales Rep', department: 'Sales', location: 'Dallas', salary: 75000, bonus: 15000, active: true },
  { id: 20, parentId: 7, name: 'Ray Rep', title: 'Sales Rep', department: 'Sales', location: 'Miami', salary: 72000, bonus: 14000, active: true },
  { id: 21, parentId: 3, name: 'Sam Analyst', title: 'Sales Analyst', department: 'Sales', location: 'Chicago', salary: 85000, bonus: 8500, active: true },
  // HR
  { id: 4, parentId: 1, name: 'Lisa VP HR', title: 'VP Human Resources', department: 'HR', location: 'New York', salary: 160000, bonus: 32000, active: true },
  { id: 13, parentId: 4, name: 'Helen HR', title: 'HR Manager', department: 'HR', location: 'New York', salary: 110000, bonus: 16500, active: true },
  { id: 14, parentId: 4, name: 'Ivan Recruit', title: 'Recruiter', department: 'HR', location: 'Remote', salary: 70000, bonus: 7000, active: false },
  { id: 22, parentId: 13, name: 'Tina Benefits', title: 'Benefits Specialist', department: 'HR', location: 'New York', salary: 80000, bonus: 8000, active: true },
  // Finance
  { id: 23, parentId: 1, name: 'Uma VP Finance', title: 'VP Finance', department: 'Finance', location: 'New York', salary: 165000, bonus: 33000, active: true },
  { id: 24, parentId: 23, name: 'Vince Controller', title: 'Controller', department: 'Finance', location: 'New York', salary: 125000, bonus: 18000, active: true },
  { id: 25, parentId: 23, name: 'Wendy Analyst', title: 'Financial Analyst', department: 'Finance', location: 'Remote', salary: 90000, bonus: 9000, active: true },
])

const totalRecords = computed(() => rows.value.length)

// Grouped columns with colspan — "Compensation" spans salary + bonus
const columns: ColumnDef[] = [
  { field: 'name', header: 'Name', sortable: true, width: 220 },
  { field: 'title', header: 'Title', sortable: true, width: 200 },
  { field: 'department', header: 'Department', sortable: true, width: 130 },
  { field: 'location', header: 'Location', sortable: true, width: 130 },
  {
    header: 'Compensation',
    align: "center",
    children: [
      { field: 'salary', header: 'Salary', sortable: true, width: 120, align: 'right', aggregation: 'sum' },
      { field: 'bonus', header: 'Bonus', sortable: true, width: 100, align: 'right', aggregation: 'sum' },
    ],
  },
  { field: 'active', header: 'Active', width: 80, align: 'center' },
]

const footerAggregations: FooterAgg[] = [
  { field: 'salary', type: 'sum', format: (v) => `$${v.toLocaleString()}` },
  { field: 'bonus', type: 'sum', format: (v) => `$${v.toLocaleString()}` },
]

function handleSort(payload: any) {
  console.log('Sort:', payload)
}

function handleSelectionChange(selected: any[]) {
  console.log('Selected:', selected.length, 'rows')
}

function logSelected() {
  console.log('Current selection:', getSelectedRows())
}
</script>

<template>
  <div class="flex flex-col gap-2.5 pt-1 p-4">
    <h2 class="text-xl font-bold">AppTreeDataTable Demo</h2>
    <p class="text-sm text-surface-500">Org chart tree with colspan headers, sorting, pagination, selection, footer aggregations, context menus, and export.</p>

    <AppTreeDataTable
      ref="tableRef"
      :rows="rows"
      :columns="columns"
      :total-records="totalRecords"
      :loading="false"
      :selectable="true"
      selection-mode="checkbox"
      pagination-mode="client"
      sort-backend="client"
      :page-size="10"
      :show-footer="true"
      :footer-aggregations="footerAggregations"
      export-filename="org-chart"
      @sort="handleSort"
      @selection-change="handleSelectionChange"
    >
      <template #toolbar>
        <PButton label="Expand All" icon="pi pi-angle-double-down" severity="secondary" size="small" @click="expandAll()" />
        <PButton label="Collapse All" icon="pi pi-angle-double-up" severity="secondary" size="small" @click="collapseAll()" />
        <PButton label="Log Selected" icon="pi pi-list" severity="info" size="small" @click="logSelected()" />
        <PButton label="Export CSV" icon="pi pi-download" severity="help" size="small" @click="exportTable('csv', 'all')" />
      </template>

      <template #body-salary="{ data }">
        <span>{{ data.salary != null ? `$${data.salary.toLocaleString()}` : '' }}</span>
      </template>

      <template #body-bonus="{ data }">
        <span>{{ data.bonus != null ? `$${data.bonus.toLocaleString()}` : '' }}</span>
      </template>

      <template #body-active="{ data }">
        <i
          class="pi text-sm"
          :class="data.active ? 'pi-check-circle text-green-500' : 'pi-times-circle text-surface-400'"
        />
      </template>
    </AppTreeDataTable>
  </div>
</template>
