<script lang="ts" setup>
import z from 'zod'
import { markRaw } from 'vue'
import type { ProgramDto, ProgramListDto, PermissionDto, RoleDto, RoleAuthDto } from '~/types'
import { useRoleManagementStore } from '~/stores/modules/administration'

const store = useRoleManagementStore()
const { t } = useI18n()

// ─── Dialog form (local) ───
const dialogSchema = z.object({
  roleCd: z.string().min(1, t('validation.required')),
  roleNm: z.string().min(1, t('validation.required')),
  roleDesc: z.string().nullable().optional(),
  useFlg: z.string().optional(),
})

const dialogForm = markRaw(useAppForm({
  schema: dialogSchema,
  initialValues: {
    roleCd: '',
    roleNm: '',
    roleDesc: null,
    useFlg: 'Y',
  },
  onSubmit: (values) => handleSave(values),
  guard: false,
}))

// ─── Auth map (local): pgmId → Set<permId> ───
const authMap = ref<Map<string, Set<string>>>(new Map())

// ─── Program tree (local) ───
const programList = ref<ProgramDto[]>([])
const selectedPgmId = ref<string | undefined>(undefined)

const selectedProgramName = computed(() => {
  if (!selectedPgmId.value) return ''
  const pgm = programList.value.find(p => p.pgmId === selectedPgmId.value)
  return pgm?.pgmNm ?? ''
})

// ─── Build PrimeVue Tree nodes from flat programList ───
interface TreeNode {
  key: string
  label: string
  icon: string
  children?: TreeNode[]
  data?: ProgramDto
}

const treeNodes = computed<TreeNode[]>(() => {
  const map = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  for (const pgm of programList.value) {
    map.set(pgm.pgmId!, {
      key: pgm.pgmId!,
      label: pgm.pgmNm ?? '',
      icon: pgm.pgmTpCd === 'MENU' ? 'pi pi-folder' : 'pi pi-desktop',
      children: [],
      data: pgm,
    })
  }

  for (const pgm of programList.value) {
    const node = map.get(pgm.pgmId!)!
    if (pgm.prntPgmId && map.has(pgm.prntPgmId)) {
      map.get(pgm.prntPgmId)!.children!.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
})

const expandedKeys = ref<Record<string, boolean>>({})

// Auto-expand all on load
watch(treeNodes, (nodes) => {
  const keys: Record<string, boolean> = {}
  function expand(list: TreeNode[]) {
    for (const n of list) {
      if (n.children?.length) {
        keys[n.key] = true
        expand(n.children)
      }
    }
  }
  expand(nodes)
  expandedKeys.value = keys
}, { immediate: true })

const selectedTreeKey = ref<Record<string, { checked: boolean; partialChecked: boolean }>>({})

// ─── Permission list (local) ───
const permRows = ref<PermissionDto[]>([])

// ─── Program tree query ───
const programQueryEnabled = ref(false)

const { isFetching: isLoadingPrograms, refetch: refetchPrograms } = useLoadPrograms(
  computed(() => ({})),
  {
    enabled: programQueryEnabled,
    select: (result: ProgramListDto) => {
      programList.value = result.programList
      return result
    },
  }
)

// ─── Permission query (manual fetch per selected program) ───
const { refetch: refetchPerms } = useLoadPermissions(
  selectedPgmId as Ref<string | undefined>,
  {
    enabled: computed(() => !!selectedPgmId.value),
    select: (result: PermissionDto[]) => {
      permRows.value = result
      return result
    },
  }
)

// ─── Role detail query for edit mode ───
const editRoleId = ref<string | undefined>(undefined)

const { refetch: refetchRole } = useGetRole(
  editRoleId as Ref<string | undefined>,
  {
    enabled: computed(() => !!editRoleId.value),
    select: (result: RoleDto) => {
      if (result && result.roleId) {
        dialogForm.setFieldsValues({
          roleCd: result.roleCd ?? '',
          roleNm: result.roleNm ?? '',
          roleDesc: result.roleDesc ?? null,
          useFlg: result.useFlg ?? 'Y',
        })
        // Rebuild authMap from roleAuthList
        const map = new Map<string, Set<string>>()
        if (result.roleAuthList) {
          for (const auth of result.roleAuthList) {
            if (!auth.pgmId || !auth.permId) continue
            if (!map.has(auth.pgmId)) map.set(auth.pgmId, new Set())
            map.get(auth.pgmId)!.add(auth.permId)
          }
        }
        authMap.value = map
      }
      return result
    },
  }
)

// ─── Mutations (local) ───
const { mutate: insertRoleMutate, isPending: isInserting } = useInsertRole({
  onSuccess: () => {
    store.closeDialog()
    store.refetchList()
  },
})

const { mutate: updateRoleMutate, isPending: isUpdating } = useUpdateRole({
  onSuccess: () => {
    store.closeDialog()
    store.refetchList()
  },
})

const isSaving = computed(() => isInserting.value || isUpdating.value)

// ─── Watch dialog open ───
watch(() => store.dialogVisible, (visible) => {
  if (visible) {
    // Load program tree
    programQueryEnabled.value = true
    refetchPrograms()
    selectedPgmId.value = undefined
    permRows.value = []

    if (store.dialogMode === 'edit' && store.editingRole?.roleId) {
      editRoleId.value = store.editingRole.roleId
      refetchRole()
    } else {
      editRoleId.value = undefined
      dialogForm.resetForm()
      authMap.value = new Map()
    }
  } else {
    editRoleId.value = undefined
    selectedPgmId.value = undefined
    permRows.value = []
    authMap.value = new Map()
    dialogForm.resetForm()
  }
})

// ─── Program tree interaction ───
function isProgramChecked(pgmId: string): boolean {
  return authMap.value.has(pgmId)
}

function toggleProgramCheck(pgmId: string, checked: boolean) {
  const map = new Map(authMap.value)
  if (checked) {
    // Auto-add VIEW permission (first perm with 'VIEW' in permCd, or first perm)
    const perms = permRows.value
    const viewPerm = perms.find(p => p.permCd?.toUpperCase().includes('VIEW'))
    const defaultPerm = viewPerm ?? perms[0]
    if (defaultPerm?.permId) {
      map.set(pgmId, new Set([defaultPerm.permId]))
    } else {
      map.set(pgmId, new Set())
    }
  } else {
    map.delete(pgmId)
  }
  authMap.value = map
}

// ─── Permission checkbox interaction ───
function isPermChecked(permId: string): boolean {
  if (!selectedPgmId.value) return false
  return authMap.value.get(selectedPgmId.value)?.has(permId) ?? false
}

function togglePermission(permId: string, checked: boolean) {
  if (!selectedPgmId.value) return
  const map = new Map(authMap.value)
  const pgmId = selectedPgmId.value

  if (checked) {
    if (!map.has(pgmId)) map.set(pgmId, new Set())
    map.get(pgmId)!.add(permId)
  } else {
    map.get(pgmId)?.delete(permId)
    if (map.get(pgmId)?.size === 0) {
      map.delete(pgmId)
    }
  }
  authMap.value = map
}

// ─── Save ───
function handleSave(values: any) {
  const roleAuthList: RoleAuthDto[] = []
  for (const [pgmId, permIds] of authMap.value) {
    for (const permId of permIds) {
      roleAuthList.push({ pgmId, permId, activeYn: true })
    }
  }

  const payload: RoleDto = {
    ...values,
    roleAuthList,
  }

  if (store.dialogMode === 'create') {
    insertRoleMutate(payload)
  } else {
    updateRoleMutate({
      roleId: store.editingRole?.roleId,
      ...payload,
    })
  }
}
</script>

<template>
  <PDialog
    v-model:visible="store.dialogVisible"
    :header="store.dialogMode === 'create' ? t('role.createRole') : t('role.editRole')"
    modal
    :style="{ width: '900px' }"
    :draggable="false"
  >
    <PForm :ref="dialogForm.formRef" v-bind="dialogForm.formProps" @submit="dialogForm.handleSubmit">
      <!-- Role form fields -->
      <div class="flex flex-col gap-4 pt-2">
        <!-- Row 1: roleCd + active checkbox -->
        <div class="grid grid-cols-[1fr_auto] gap-4 items-center">
          <Input
            v-bind="dialogForm.field('roleCd')"
            :label="t('role.roleCd')"
            float-label
            required
            :disabled="store.dialogMode === 'edit'"
          />
          <CheckBox
            v-bind="dialogForm.field('useFlg')"
            :label="t('role.useFlg')"
            true-value="Y"
            false-value="N"
          />
        </div>

        <!-- Row 2: roleNm full width -->
        <Input
          v-bind="dialogForm.field('roleNm')"
          :label="t('role.roleNm')"
          float-label
          required
        />

        <!-- Row 3: roleDesc full width -->
        <Input
          v-bind="dialogForm.field('roleDesc')"
          :label="t('role.roleDesc')"
          variant="textarea"
          float-label
        />
      </div>

      <!-- Program / Permission split panel -->
      <div class="grid grid-cols-2 gap-4 mt-5">
        <!-- Left: Program tree -->
        <PCard class="p-0">
          <template #title>
            <div class="flex items-center gap-2 px-2 py-1.5 border-b" style="border-color: var(--p-form-field-border-color);">
              <i class="pi pi-sitemap text-primary" />
              <span>{{ t('role.programs') }}</span>
            </div>
          </template>
          <template #content>
            <div class="overflow-auto" style="height: 320px;">
              <PTree
                v-model:expandedKeys="expandedKeys"
                v-model:selectionKeys="selectedTreeKey"
                :value="treeNodes"
                :loading="isLoadingPrograms"
                selection-mode="checkbox"
                class="role-program-tree border-none bg-transparent"
              >
                <template #default="{ node }">
                  <span class="cursor-pointer" @click.stop="selectedPgmId = node.key">{{ node.label }}</span>
                </template>
              </PTree>
            </div>
          </template>
        </PCard>

        <!-- Right: Permission list -->
        <PCard class="p-0">
          <template #title>
            <div class="flex items-center gap-2 px-2 py-1.5 border-b" style="border-color: var(--p-form-field-border-color);">
              <i class="pi pi-shield text-primary" />
              <span>{{ t('role.permissions') }}</span>
              <span v-if="selectedProgramName" class="text-sm font-normal text-surface-400 ml-auto truncate max-w-[140px]">{{ selectedProgramName }}</span>
            </div>
          </template>
          <template #content>
            <div class="overflow-auto" style="height: 320px;">
              <template v-if="selectedPgmId">
                <div v-if="permRows.length > 0" class="flex flex-col gap-1">
                  <label
                    v-for="perm in permRows"
                    :key="perm.permId"
                    class="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer select-none hover:bg-surface-50 dark:hover:bg-surface-800"
                  >
                    <PCheckbox
                      :modelValue="isPermChecked(perm.permId!)"
                      :binary="true"
                      @update:modelValue="(val: boolean) => togglePermission(perm.permId!, val)"
                    />
                    <span>{{ perm.permNm || perm.permCd }}</span>
                  </label>
                </div>
                <div v-else class="flex items-center justify-center h-full text-surface-400 text-sm">
                  {{ t('common.noResults') }}
                </div>
              </template>
              <template v-else>
                <div class="flex flex-col items-center justify-center h-full gap-2 opacity-50">
                  <i class="pi pi-arrow-left text-xl text-surface-400" />
                  <span class="text-sm text-surface-400">{{ t('role.selectProgram') }}</span>
                </div>
              </template>
            </div>
          </template>
        </PCard>
      </div>

      <!-- Footer buttons -->
      <div class="flex justify-end gap-2 pt-4">
        <PButton
          :label="t('common.cancel')"
          severity="secondary"
          @click="store.closeDialog"
        />
        <SaveButton
          :label="t('common.save')"
          :loading="isSaving"
          type="submit"
        />
      </div>
    </PForm>
  </PDialog>
</template>

<style scoped>
:deep(.role-program-tree) {
  padding: 0;
}

:deep(.role-program-tree .p-tree-node-content) {
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
}

:deep(.role-program-tree .p-tree-toggler) {
  width: 1.5rem;
  height: 1.5rem;
}
</style>
