<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useThemeStore } from '~/stores/useThemeStore'

const route = useRoute()
const themeStore = useThemeStore()
</script>

<template>
    <UHeader title="">
        <template #right>
            <UColorModeButton @click="themeStore.toggleTheme()" />

            <UTooltip text="Open on GitHub" :kbds="['meta', 'G']">
                <UButton color="neutral" variant="ghost" to="https://github.com/nuxt/ui" target="_blank"
                    icon="i-simple-icons-github" aria-label="GitHub" />
            </UTooltip>
        </template>
    </UHeader>
</template>
