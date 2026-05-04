<script lang="ts" setup>
import { ProgramSearchCard, ProgramTreeTable, PermissionTable, ProgramDialog } from '~/components/modules/administration'
import { useProgramManagementStore } from '~/stores'

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
