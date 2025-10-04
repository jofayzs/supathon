<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
</script>

<template>
    <UHeader title="">
        <template #right>
            <UColorModeButton />

            <UTooltip text="Open on GitHub" :kbds="['meta', 'G']">
                <UButton color="neutral" variant="ghost" to="https://github.com/nuxt/ui" target="_blank"
                    icon="i-simple-icons-github" aria-label="GitHub" />
            </UTooltip>
        </template>
    </UHeader>
</template>
