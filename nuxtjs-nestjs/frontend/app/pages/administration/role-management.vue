<script lang="ts" setup>

const { t } = useI18n();
const toast = useAppToast();

</script>

<template>
    <div class="flex flex-col gap-2.5 pt-1">
    <RoleSearchCard />
    <div class="grid grid-cols-2 gap-2.5">
      <RoleTable />
    </div>
    <!-- <ProgramDialog /> -->
  </div>
</template>