import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import z from 'zod'
import type {
  ColumnDef,
  ProgramDto,
  ProgramListDto,
  PermissionDto,
  AppDataTableExposed,
  ProcFlag,
} from '~/types'

export const useProgramManagementStore = defineStore('program-management', () => {
  const toast = useAppToast()
  const dialog = useAppDialog()
  const { t } = useI18n()

  // ─── Search ───
  const searchSchema = z.object({
    pgmNm: z.string().optional(),
    pgmTpCd: z.string().nullable().optional(),
    useFlg: z.string().nullable().optional(),
  })

  const searchForm = markRaw(useAppForm({
    schema: searchSchema,
    initialValues: { pgmNm: '', pgmTpCd: null, useFlg: null },
    onSubmit: () => {},
    guard: false,
  }))

  const typeOptions = computed(() => [
    { label: t('common.all'), value: '' },
    { label: 'Menu', value: 'Menu' },
    { label: 'UI', value: 'UI' },
  ])

  const statusOptions = computed(() => [
    { label: t('common.all'), value: '' },
    { label: t('common.active'), value: 'Y' },
    { label: t('common.inactive'), value: 'N' },
  ])

  // ─── Program tree state ───
  const treeTableRef = ref<any>(null)
  const programList = ref<ProgramDto[]>([])
  const totalRecords = ref(0)
  const selectedPgmId = ref<string | undefined>(undefined)

  const selectedProgramName = computed(() => {
    if (!selectedPgmId.value) return ''
    const pgm = programList.value.find(p => p.pgmId === selectedPgmId.value)
    return pgm ? `${pgm.pgmNm} (${pgm.pgmCd})` : ''
  })

  // ─── Program tree columns ───
  const treeColumns = computed<ColumnDef[]>(() => [
    { field: 'pgmCd', header: t('program.pgmCd'), width: 160, sortable: true },
    { field: 'pgmNm', header: t('program.pgmNm'), width: 200, sortable: true },
    { field: 'pgmTpCd', header: t('program.pgmTpCd'), width: 100, align: 'center', sortable: true, format: (val: string) => val === 'MENU' ? 'Menu' : 'UI' },
    { field: 'useFlg', header: t('program.useFlg'), width: 80, align: 'center', format: (val: string) => val === 'Y' ? 'Active' : 'Inactive' },
  ])

  // ─── Permission table state ───
  const permTableRef = ref<AppDataTableExposed<PermissionDto> | null>(null)
  const permRows = ref<PermissionDto[]>([])

  const permColumns = computed<ColumnDef[]>(() => [
    { field: 'permCd', header: t('program.permCd'), editable: true, editType: 'input', width: 160, validators: { required: true } },
    { field: 'permNm', header: t('program.permNm'), editable: true, editType: 'input', width: 200, validators: { required: true } },
  ])

  // ─── Dialog state ───
  const dialogVisible = ref(false)
  const dialogMode = ref<'create' | 'edit'>('create')
  const editingProgram = ref<ProgramDto | null>(null)

  const dialogSchema = z.object({
    pgmCd: z.string().min(1, 'Program code is required'),
    pgmNm: z.string().min(1, 'Program name is required'),
    pgmTpCd: z.enum(['MENU', 'UI']),
    prntPgmId: z.string().nullable().optional(),
    pgmPath: z.string().nullable().optional(),
    dspOrder: z.number().optional(),
    pgmRmk: z.string().nullable().optional(),
    useFlg: z.string().optional(),
  })

  const dialogForm = markRaw(useAppForm({
    schema: dialogSchema,
    initialValues: {
      pgmCd: '',
      pgmNm: '',
      pgmTpCd: 'MENU' as const,
      prntPgmId: null,
      pgmPath: null,
      dspOrder: 9999,
      pgmRmk: null,
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
  }))

  const parentOptions = computed(() =>
    programList.value
      .filter((p) => p.pgmTpCd === 'MENU')
      .map((p) => ({ label: `${p.pgmNm} (${p.pgmCd})`, value: p.pgmId }))
  )

  // ─── Query: Program tree ───
  const requestBody = computed(() => {
    const search = searchForm.values
    const body: Record<string, any> = {}
    if (search.pgmNm) body.pgmNm = search.pgmNm
    if (search.pgmTpCd) body.pgmTpCd = search.pgmTpCd
    if (search.useFlg !== null && search.useFlg !== undefined && search.useFlg !== '') {
      body.useFlg = search.useFlg
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

  // ─── Query: Permissions ───
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
      permTableRef.value?.clearChanges()
      refetchPerms()
    },
  })

  const isDialogSaving = computed(() => isInserting.value || isUpdating.value)

  // ─── Actions ───
  function registerTreeTable(ref: any) {
    treeTableRef.value = ref
  }

  function registerPermTable(ref: AppDataTableExposed<PermissionDto>) {
    permTableRef.value = ref
  }

  function clearAll() {
    selectedPgmId.value = undefined
    permRows.value = []
    treeTableRef.value?.clearSelection()
    permTableRef.value?.clearSelection()
    permTableRef.value?.clearChanges()
  }

  function fetchData() {
    const isUnsaved = permTableRef.value?.hasChanges()

    if (isUnsaved) {
      dialog.confirm({
        header: t('common.unsavedChanges'),
        message: t('common.unsavedChangesMessage'),
        acceptButton: { label: t('common.continue') },
        onAccept: () => {
          queryEnabled.value = true
          refetchTree()
          clearAll()
        },
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

  function selectProgram(pgmId: string) {
    selectedPgmId.value = pgmId
  }

  function openDialog(mode: 'create' | 'edit', program?: ProgramDto) {
    dialogMode.value = mode
    if (mode === 'edit' && program) {
      editingProgram.value = program
      dialogForm.setFieldsValues({
        pgmCd: program.pgmCd ?? '',
        pgmNm: program.pgmNm ?? '',
        pgmTpCd: program.pgmTpCd ?? 'MENU',
        prntPgmId: program.prntPgmId ?? null,
        dspOrder: program.dspOrder ?? 9999,
        pgmRmk: program.pgmRmk ?? '',
        useFlg: program.useFlg,
      })
    } else {
      editingProgram.value = null
      dialogForm.resetForm()
    }
    dialogVisible.value = true
  }

  function closeDialog() {
    dialogVisible.value = false
    dialogForm.resetForm()
  }

  function deletePrograms() {
    const selected = treeTableRef.value?.getSelectedRows() ?? []
    if (selected.length === 0) {
      toast.showInfo(t('common.noSelection'))
      return
    }
    deleteProgramsMutate(selected)
  }

  // ─── Permission actions ───
  function handleAddPermission() {
    if (!selectedPgmId.value) return
    permTableRef.value?.insertRow({
      pgmId: selectedPgmId.value,
      permCd: '',
      permNm: '',
    } as Partial<PermissionDto>)
  }

  function handleDeletePermission() {
    permTableRef.value?.deleteSelected()
  }

  function handleSavePermissions() {
    const errors = permTableRef.value?.validate() ?? []
    if (errors.length > 0) return
    const changed = permTableRef.value?.getRows(['I', 'U', 'D'] as ProcFlag[]) ?? []
    if (changed.length === 0) {
      toast.showInfo(t('common.noChanges'))
      return
    }
    savePermissionsMutate(changed)
  }

  return {
    // Search
    searchForm,
    typeOptions,
    statusOptions,
    // Program tree
    programList,
    totalRecords,
    treeColumns,
    selectedPgmId,
    selectedProgramName,
    isLoadingTree,
    // Permissions
    permRows,
    permColumns,
    isLoadingPerms,
    isSavingPerms,
    // Dialog
    dialogVisible,
    dialogMode,
    dialogForm,
    parentOptions,
    isDialogSaving,
    // Actions
    registerTreeTable,
    registerPermTable,
    fetchData,
    handleSearch,
    selectProgram,
    openDialog,
    closeDialog,
    deletePrograms,
    handleAddPermission,
    handleDeletePermission,
    handleSavePermissions,
  }
})

