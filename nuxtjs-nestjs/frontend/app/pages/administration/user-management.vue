<script lang="ts" setup>
import { useUserManagementStore } from '~/stores/modules/administration'

const store = useUserManagementStore()
onMounted(() => store.fetchData())
</script>

<template>
  <div class="flex flex-col gap-2.5 pt-1">
    <UserSearchCard />
    <UserTable />
  </div>
</template>
