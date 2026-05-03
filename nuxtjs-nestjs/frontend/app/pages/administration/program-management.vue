<script lang="ts" setup>
import { ProgramSearchCard, ProgramTreeTable, PermissionTable } from '~/components/modules/administration/program-management'
import { ProgramDialog } from '~/components/modules/administration/program-management'
import { useProgramManagementStore } from '~/stores/modules/administration'

const store = useProgramManagementStore()
onMounted(() => store.fetchData())
</script>

<template>
  <div class="flex flex-col gap-2.5 pt-1">
    <ProgramSearchCard />
    <div class="grid grid-cols-2 gap-2.5">
      <ProgramTreeTable />
      <PermissionTable />
    </div>
    <ProgramDialog />
  </div>
</template>
