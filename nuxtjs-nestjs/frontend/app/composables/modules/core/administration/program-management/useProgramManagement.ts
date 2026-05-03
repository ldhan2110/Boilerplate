import z from 'zod'
import type { ColumnDef, CellConfig, ProgramDto, PermissionDto, ProgramListDto } from '~/types'
import type { ColumnDef as TreeColumnDef } from '~/types/tree-table'
import {
  useLoadPrograms,
  useInsertProgram,
  useUpdateProgram,
  useDeletePrograms,
  useLoadPermissions,
  useSavePermissions,
} from './queries'

export function useProgramManagement() {
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

  // ─── Program tree state ───
  const treeTableRef = ref<any>(null)
  const programList = ref<ProgramDto[]>([])
  const totalRecords = ref(0)
  const selectedPgmId = ref<string | undefined>(undefined)

  // ─── Program tree columns ───
  const treeColumns: TreeColumnDef[] = [
    {
      field: 'pgmId',
      header: t('program.pgmId', 'Program ID'),
      width: 160,
      sortable: true,
    },
    {
      field: 'pgmNm',
      header: t('program.pgmNm', 'Program Name'),
      width: 200,
      sortable: true,
    },
    {
      field: 'pgmTpCd',
      header: t('program.pgmTpCd', 'Type'),
      width: 100,
      sortable: true,
    },
    {
      field: 'useFlg',
      header: t('program.useFlg', 'Use'),
      width: 80,
      align: 'center',
    },
  ]

  // ─── Permission table state ───
  const { tableRef: permTableRef, validate: validatePerm, getRows: getPermRows, clearChanges: clearPermChanges } = useAppDataTable<PermissionDto>()
  const permRows = ref<PermissionDto[]>([])

  const permColumns: ColumnDef[] = [
    {
      field: 'permCd',
      header: t('program.permCd', 'Permission Code'),
      editable: true,
      editType: 'input',
      width: 160,
      validators: { required: true },
    },
    {
      field: 'permNm',
      header: t('program.permNm', 'Permission Name'),
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
    useFlg: z.boolean().optional(),
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
      useFlg: true,
    },
    onSubmit: async (values) => {
      if (dialogMode.value === 'create') {
        insertProgramMutate({
          ...values,
          useFlg: values.useFlg ? 'Y' : 'N',
        } as any)
      } else {
        updateProgramMutate({
          pgmId: editingProgram.value?.pgmId,
          ...values,
          useFlg: values.useFlg ? 'Y' : 'N',
        } as any)
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
      body.useFlg = search.useFlg === 'Y'
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
      useFlg: data.useFlg === 'Y' || data.useFlg === true,
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
      toast.showInfo(t('common.noSelection', 'No rows selected'))
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
      toast.showInfo(t('common.noChanges', 'No changes to save'))
      return
    }
    savePermissionsMutate(changed)
  }

  return {
    searchForm,
    treeTableRef,
    treeColumns,
    programList,
    totalRecords,
    isLoadingTree,
    selectedPgmId,
    fetchData,
    handleSearch,
    handleRowClick,
    handlePgmIdClick,
    handleAddProgram,
    handleDeletePrograms,
    dialogVisible,
    dialogMode,
    dialogForm,
    parentOptions,
    isDialogSaving,
    permTableRef,
    permColumns,
    permRows,
    isLoadingPerms,
    isSavingPerms,
    handleAddPermission,
    handleDeletePermission,
    handleSavePermissions,
  }
}
