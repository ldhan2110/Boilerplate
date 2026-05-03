<script lang="ts" setup>
import z from 'zod'
import type { ColumnDef, CellConfig, ProgramDto, PermissionDto, ProgramListDto } from '~/types'
import type { ColumnDef as TreeColumnDef } from '~/types/tree-table'

const toast = useAppToast()
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
  { label: 'Menu', value: 'MENU' },
  { label: 'UI', value: 'UI' },
]

const statusOptions = [
  { label: t('common.all'), value: '' },
  { label: t('common.active'), value: 'Y' },
  { label: t('common.inactive'), value: 'N' },
]

// ─── Program tree state ───
const treeTableRef = ref<any>(null)
const programList = ref<ProgramDto[]>([])
const totalRecords = ref(0)
const selectedPgmId = ref<string | undefined>(undefined)

// ─── Program tree columns ───
const treeColumns: TreeColumnDef[] = [
  { field: 'pgmId', header: t('program.pgmId'), width: 160, sortable: true },
  { field: 'pgmNm', header: t('program.pgmNm'), width: 200, sortable: true },
  { field: 'pgmTpCd', header: t('program.pgmTpCd'), width: 100, sortable: true },
  { field: 'useFlg', header: t('program.useFlg'), width: 80, align: 'center' },
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
  pgmCd: z.string().min(1),
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
  onSubmit: () => {},
  guard: false,
})

function handleDialogSubmit() {
  const result = dialogSchema.safeParse(toRaw(dialogForm.values))
  if (!result.success) return

  const values = result.data
  if (dialogMode.value === 'create') {
    insertProgramMutate(values as any)
  } else {
    updateProgramMutate({
      pgmId: editingProgram.value?.pgmId,
      ...values,
    } as any)
  }
}

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
    selectedPgmId.value = undefined
    permRows.value = []
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
function fetchData() {
  queryEnabled.value = true
  refetchTree()
}

function handleSearch() {
  fetchData()
}

function handleRowClick(data: ProgramDto) {
  selectedPgmId.value = data.pgmId
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
    useFlg: data.useFlg === true,
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
            :table-height="350"
            @refresh="fetchData"
            @selection-change="(selected: ProgramDto[]) => { if (selected.length > 0) handleRowClick(selected[selected.length - 1]!) }"
          >
            <template #body-pgmId="{ data }">
              <a
                class="text-primary cursor-pointer hover:underline"
                @click.stop="handlePgmIdClick(data)"
              >
                {{ data.pgmId }}
              </a>
            </template>

            <template #body-useFlg="{ data }">
              <span>{{ data.useFlg === true ? 'Y' : 'N' }}</span>
            </template>
          </AppTreeDataTable>
        </template>
      </PCard>

      <!-- Right: Permissions -->
      <PCard class="p-0">
        <template #content>
          <template v-if="selectedPgmId">
            <Flex justify="end" class="pb-2" gap="2">
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

            <AppDataTable
              ref="permTableRef"
              :rows="permRows"
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
     <ClientOnly>
    <PDialog
      v-model:visible="dialogVisible"
      :header="dialogMode === 'create' ? t('program.createProgram') : t('program.editProgram')"
      modal
      :style="{ width: '500px' }"
      :draggable="false"
    >
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
            @click="handleDialogSubmit"
          />
        </div>
    </PDialog>
    </ClientOnly>
  </div>
</template>
