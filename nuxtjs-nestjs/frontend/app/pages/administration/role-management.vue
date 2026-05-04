<script lang="ts" setup>
import { useRoleManagementStore } from '~/stores/modules/administration'

const store = useRoleManagementStore()
onMounted(() => store.fetchData())
</script>

<template>
  <div class="flex flex-col gap-2.5 pt-1">
    <RoleSearchCard @search="store.handleSearch" />
    <RoleTable />
    <RoleDialog />
  </div>
</template>
