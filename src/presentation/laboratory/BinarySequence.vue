<script setup lang="ts">
defineProps<{
  bits: string
  label: string
  compareWith?: string
  testId?: string
}>()
</script>

<template>
  <div
    class="lab-binary-scroll"
    :aria-label="label"
    :data-testid="testId"
    :data-bits="bits"
    tabindex="0"
  >
    <span class="inline-block min-w-max">
      <span
        v-for="(bit, index) in bits"
        :key="index"
        class="lab-sequence-bit"
        :class="
          compareWith?.[index] !== undefined && compareWith[index] !== bit
            ? 'lab-sequence-bit-altered'
            : ''
        "
        :data-altered="
          (compareWith?.[index] !== undefined && compareWith[index] !== bit) || undefined
        "
        >{{ bit }}</span
      >
    </span>
  </div>
</template>
