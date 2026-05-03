<script lang="ts" setup>
import z from 'zod'
import type { ColumnDef, ColumnDef as TreeColumnDef, ProgramDto, PermissionDto, ProgramListDto } from '~/types'

const toast = useAppToast()
const dialog = useAppDialog();
const { t } = useI18n()

// ─── Search form ───
const searchSchema = z.object({
  pgmNm: z.string().optional(),
  pgmTpCd: z.string().nullable().optional(),
  useFlg: z.string().nullable().optional(),
})

const searchForm = useAppForm({
  schema: searchSchema,
  initialValues: { pgmNm: '', pgmTpCd: null, useFlg: null },
  onSubmit: () => {},
  guard: false,
})

const typeOptions = [
  { label: t('common.all'), value: '' },
  { label: 'Menu', value: 'Menu' },
  { label: 'UI', value: 'UI' },
]

const statusOptions = [
  { label: t('common.all'), value: '' },
  { label: t('common.active'), value: 'Y' },
  { label: t('common.inactive'), value: 'N' },
]

// ─── Program tree state ───
const { tableRef: treeTableRef } = useAppTreeDataTable()
const programList = ref<ProgramDto[]>([])
const totalRecords = ref(0)
const selectedPgmId = ref<string | undefined>(undefined)
const selectedProgramName = computed(() => {
  if (!selectedPgmId.value) return ''
  const pgm = programList.value.find(p => p.pgmId === selectedPgmId.value)
  return pgm ? `${pgm.pgmNm} (${pgm.pgmCd})` : ''
})

// ─── Program tree columns ───
const treeColumns: TreeColumnDef[] = [
  { field: 'pgmCd', header: t('program.pgmCd'), width: 160, sortable: true },
  { field: 'pgmNm', header: t('program.pgmNm'), width: 200, sortable: true },
  { field: 'pgmTpCd', header: t('program.pgmTpCd'), width: 100, align: "center", sortable: true, format: val => val == 'MENU' ? "Menu" : "UI" },
  { 
    field: 'useFlg', 
    header: t('program.useFlg'), 
    width: 80, 
    align: 'center', 
    format: val => val === 'Y' ? 'Active' : 'Inactive'
  },
]

// ─── Permission table state ───
const { tableRef: permTableRef, validate: validatePerm, getRows: getPermRows, clearChanges: clearPermChanges } = useAppDataTable<PermissionDto>()
const permRows = ref<PermissionDto[]>([])

const permColumns: ColumnDef[] = [
  {
    field: 'permCd',
    header: t('program.permCd'),
    editable: true,
    editType: 'input',
    width: 160,
    validators: { required: true },
  },
  {
    field: 'permNm',
    header: t('program.permNm'),
    editable: true,
    editType: 'input',
    width: 200,
    validators: { required: true },
  },
]

// ─── Dialog state ───
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingProgram = ref<ProgramDto | null>(null)

const dialogSchema = z.object({
  pgmCd: z.string().min(1, "This field is required"),
  pgmNm: z.string().min(1),
  pgmTpCd: z.enum(['MENU', 'UI']),
  prntPgmId: z.string().nullable().optional(),
  dspOrder: z.number().optional(),
  pgmRmk: z.string().nullable().optional(),
  useFlg: z.string().optional(),
})

const dialogForm = useAppForm({
  schema: dialogSchema,
  initialValues: {
    pgmCd: '',
    pgmNm: '',
    pgmTpCd: 'MENU' as const,
    prntPgmId: null,
    dspOrder: 9999,
    pgmRmk: '',
    useFlg: 'Y',
  },
  onSubmit: (values) => {
    if (dialogMode.value === 'create') {
      insertProgramMutate(values as ProgramDto)
    } else {
      updateProgramMutate({
        pgmId: editingProgram.value?.pgmId,
        ...values,
      } as ProgramDto)
    }
  },
  guard: false,
})

// ─── Parent program options (MENU type only) ───
const parentOptions = computed(() =>
  programList.value
    .filter((p) => p.pgmTpCd === 'MENU')
    .map((p) => ({ label: `${p.pgmNm} (${p.pgmCd})`, value: p.pgmId }))
)

// ─── TanStack Query: Program tree ───
const requestBody = computed(() => {
  const search = searchForm.values
  const body: Record<string, any> = {}
  if (search.pgmNm) body.pgmNm = search.pgmNm
  if (search.pgmTpCd) body.pgmTpCd = search.pgmTpCd
  if (search.useFlg !== null && search.useFlg !== undefined && search.useFlg !== '') {
    body.useFlg = undefined
  }
  return body
})

const queryEnabled = ref(false)

const { isFetching: isLoadingTree, refetch: refetchTree } = useLoadPrograms(requestBody, {
  enabled: queryEnabled,
  select: (result: ProgramListDto) => {
    programList.value = result.programList
    totalRecords.value = result.total
    return result
  },
})

// ─── TanStack Query: Permissions ───
const { isFetching: isLoadingPerms, refetch: refetchPerms } = useLoadPermissions(
  selectedPgmId,
  {
    enabled: computed(() => !!selectedPgmId.value),
    select: (result: PermissionDto[]) => {
      permRows.value = result
      return result
    },
  }
)

// ─── Mutations ───
const { mutate: insertProgramMutate, isPending: isInserting } = useInsertProgram({
  onSuccess: () => {
    dialogVisible.value = false
    refetchTree()
  },
})

const { mutate: updateProgramMutate, isPending: isUpdating } = useUpdateProgram({
  onSuccess: () => {
    dialogVisible.value = false
    refetchTree()
  },
})

const { mutate: deleteProgramsMutate, isPending: isDeleting } = useDeletePrograms({
  onSuccess: () => {
    clearAll()
    refetchTree()
  },
})

const { mutate: savePermissionsMutate, isPending: isSavingPerms } = useSavePermissions({
  onSuccess: () => {
    clearPermChanges()
    refetchPerms()
  },
})

const isDialogSaving = computed(() => isInserting.value || isUpdating.value)

// ─── Event handlers ───
function clearAll() {
  selectedPgmId.value = undefined
  permRows.value = []
  treeTableRef.value?.clearSelection()
  permTableRef.value?.clearSelection()
  permTableRef.value?.clearChanges()
}

function fetchData() {
  const isUnsaved = permTableRef.value?.hasChanges();

  if (isUnsaved) {
    return dialog.confirm({
      header: t('common.unsavedChanges'),
      message: t('common.unsavedChangesMessage'),
      acceptButton: { label: t('common.continue') },
      onAccept: ()=> {
        queryEnabled.value = true
        refetchTree()
        clearAll()
      }
    })
  } else {
    queryEnabled.value = true
    refetchTree()
    clearAll()
  }
}

function handleSearch() {
  fetchData()
}

function handleRowClick(payload: { data: ProgramDto; originalEvent: Event }) {
  selectedPgmId.value = payload.data.pgmId
}

function handlePgmIdClick(data: ProgramDto) {
  dialogMode.value = 'edit'
  editingProgram.value = data
  dialogForm.setFieldsValues({
    pgmCd: data.pgmCd ?? '',
    pgmNm: data.pgmNm ?? '',
    pgmTpCd: data.pgmTpCd ?? 'MENU',
    prntPgmId: data.prntPgmId ?? null,
    dspOrder: data.dspOrder ?? 9999,
    pgmRmk: data.pgmRmk ?? '',
    useFlg: data.useFlg,
  })
  dialogVisible.value = true
}

function handleAddProgram() {
  dialogMode.value = 'create'
  editingProgram.value = null
  dialogForm.resetForm()
  dialogVisible.value = true
}

function handleDeletePrograms() {
  const selected = treeTableRef.value?.getSelectedRows() ?? []
  if (selected.length === 0) {
    toast.showInfo(t('common.noSelection'))
    return
  }
  deleteProgramsMutate(selected)
}

// ─── Permission handlers ───
function handleAddPermission() {
  if (!selectedPgmId.value) return
  permTableRef.value?.insertRow({
    pgmId: selectedPgmId.value,
    permCd: '',
    permNm: '',
  })
}

function handleDeletePermission() {
  permTableRef.value?.deleteSelected()
}

function handleSavePermissions() {
  const errors = validatePerm()
  if (errors.length > 0) return
  const changed = getPermRows(['I', 'U', 'D'])
  if (changed.length === 0) {
    toast.showInfo(t('common.noChanges'))
    return
  }
  savePermissionsMutate(changed)
}

onMounted(() => fetchData())
</script>

<template>
  <div class="flex flex-col gap-2.5 pt-1">
    <!-- Search -->
    <SearchCard :form="searchForm" @search="handleSearch" class="pt-2">
      <Input
        v-bind="searchForm.field('pgmNm')"
        :label="t('program.pgmNm')"
        float-label
      />

      <Select
        v-bind="searchForm.field('pgmTpCd')"
        :label="t('program.pgmTpCd')"
        :options="typeOptions"
        option-label="label"
        option-value="value"
        float-label
      />

      <Select
        v-bind="searchForm.field('useFlg')"
        :label="t('common.status')"
        :options="statusOptions"
        true-value="Y"
        false-value="N"
        option-label="label"
        option-value="value"
        float-label
      />
    </SearchCard>

    <!-- Split view -->
    <div class="grid grid-cols-2 gap-2.5">
      <!-- Left: Program tree -->
      <PCard class="p-0">
        <template #content>
          <Flex justify="end" class="pb-2" gap="2">
            <DeleteButton
              :label="t('program.delete')"
              @click="handleDeletePrograms"
              v-if="treeTableRef?.hasSelectedRow()"
            />
            <AddButton :label="t('program.add')" @click="handleAddProgram" />
          </Flex>

          <AppTreeDataTable
            ref="treeTableRef"
            :rows="programList"
            :columns="treeColumns"
            :total-records="totalRecords"
            :loading="isLoadingTree"
            :selectable="true"
            selection-mode="checkbox"
            row-key="pgmId"
            parent-key="prntPgmId"
            data-mode="all"
            default-expand-all
            :table-height="350"
            @refresh="fetchData"
            @row-click="handleRowClick"
          >
            <template #body-pgmCd="{ data }">
              <a
                class="text-primary cursor-pointer hover:underline flex items-center gap-1.5"
                @click.stop="handlePgmIdClick(data)"
              >
                <i :class="data.pgmTpCd === 'MENU' ? 'pi pi-folder text-amber-500' : 'pi pi-desktop text-blue-500'" class="text-sm" />
                {{ data.pgmCd }}
              </a>
            </template>

            <template #body-useFlg="{ data }">
              <span
                :class="data.useFlg === 'Y'
                  ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'"
              >
                {{ data.useFlg === 'Y' ? t('common.active') : t('common.inactive') }}
              </span>
            </template>
          </AppTreeDataTable>
        </template>
      </PCard>

      <!-- Right: Permissions -->
      <PCard class="p-0">
        <template #content>
          <template v-if="selectedPgmId">
            <Flex justify="between" align="center" class="pb-2">
              <span class="text-sm font-semibold text-surface-700 dark:text-surface-200">
                {{ selectedProgramName }}
              </span>
              <Flex gap="2">
                <DeleteButton
                  :label="t('program.deletePermission')"
                  @click="handleDeletePermission"
                  v-if="permTableRef?.hasSelectedRow()"
                />
                <AddButton :label="t('program.addPermission')" @click="handleAddPermission" />
                <SaveButton
                  :label="t('common.save')"
                  :loading="isSavingPerms"
                  @click="handleSavePermissions"
                />
              </Flex>
            </Flex>

            <AppDataTable
              ref="permTableRef"
              :rows="permRows"
              data-mode="all"
              :columns="permColumns"
              :loading="isLoadingPerms"
              :editable="true"
              :selectable="true"
              selection-mode="checkbox"
              :table-height="350"
            />
          </template>

          <template v-else>
            <div class="flex items-center justify-center h-48 text-surface-400">
              {{ t('program.selectProgram') }}
            </div>
          </template>
        </template>
      </PCard>
    </div>

    <!-- Program Dialog -->
    <PDialog
      v-model:visible="dialogVisible"
      :header="dialogMode === 'create' ? t('program.createProgram') : t('program.editProgram')"
      modal
      :style="{ width: '500px' }"
      :draggable="false"
    >
      <PForm :ref="dialogForm.formRef" :v-bind="dialogForm.formProps">
        <div class="flex flex-col gap-4 pt-2">
            <Input
              v-bind="dialogForm.field('pgmCd')"
              :label="t('program.pgmCd')"
              float-label
              required
            />

            <Input
              v-bind="dialogForm.field('pgmNm')"
              :label="t('program.pgmNm')"
              float-label
              required
            />

            <Select
              v-bind="dialogForm.field('pgmTpCd')"
              :label="t('program.pgmTpCd')"
              :options="[{ label: 'MENU', value: 'MENU' }, { label: 'UI', value: 'UI' }]"
              option-label="label"
              option-value="value"
              float-label
              required
            />

            <Select
              v-bind="dialogForm.field('prntPgmId')"
              :label="t('program.prntPgmId')"
              :options="parentOptions"
              option-label="label"
              option-value="value"
              float-label
              show-clear
            />

            <InputNumber
              v-bind="dialogForm.field('dspOrder')"
              :label="t('program.dspOrder')"
              float-label
            />

            <Input
              v-bind="dialogForm.field('pgmRmk')"
              :label="t('program.pgmRmk')"
              variant="textarea"
              float-label
            />

            <CheckBox
              v-bind="dialogForm.field('useFlg')"
              :label="t('program.useFlg')"
              true-value="Y"
              false-value="N"
            />
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <PButton
              :label="t('common.cancel')"
              severity="secondary"
              @click="dialogVisible = false"
            />
            <SaveButton
              :label="t('common.save')"
              :loading="isDialogSaving"
              type="submit"
              @submit="dialogForm.submit"
            />
          </div>
      </PForm>
    </PDialog>
  </div>
</template>
