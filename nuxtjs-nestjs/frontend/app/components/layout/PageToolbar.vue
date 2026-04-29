<script setup lang="ts">
/**
 * PageToolbar — Card-style PrimeVue Toolbar for page-level actions.
 *
 * Usage:
 *   <PageToolbar>
 *     <template #start>
 *       <Button label="Add" icon="pi pi-plus" />
 *     </template>
 *     <template #end>
 *       <SaveButton @click="onSave" />
 *     </template>
 *   </PageToolbar>
 *
 * Slots: #start, #center, #end (maps to PrimeVue Toolbar slots)
 */
</script>

<template>
  <PToolbar class="rounded-lg p-4">
    <template v-if="$slots.start" #start>
      <slot name="start" />
    </template>
    <template v-if="$slots.center" #center>
      <slot name="center" />
    </template>
    <template v-if="$slots.end" #end>
      <slot name="end" />
    </template>
  </PToolbar>
</template>
