<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useUserStore } from '~/stores/useUserStore'
import { useThemeStore } from '~/stores/useThemeStore'

const route = useRoute()
const themeStore = useThemeStore()
const userStore = useUserStore()

// Compute the user's display name
const displayName = computed(() => {
    if (userStore.fullName) return userStore.fullName
    if (userStore.email) return userStore.email.split('@')[0]
    return 'Guest'
})
</script>

<template>
    <UHeader :title="`Hello, ${displayName}`">
        <template #right>
            <!-- Theme toggle -->
            <UColorModeButton @click="themeStore.toggleTheme()" />

            <!-- Avatar -->
            <div v-if="userStore.isLoggedIn" class="flex items-center gap-3 ml-3">
                <UAvatar :src="userStore.avatarUrl" :alt="displayName" size="sm"
                    class="ring-2 ring-gray-200 dark:ring-gray-700" />
                <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {{ displayName }}
                </span>
            </div>

            <!-- GitHub Button -->
            <UTooltip text="Open on GitHub" :kbds="['meta', 'G']">
                <UButton color="neutral" variant="ghost" to="https://github.com/nuxt/ui" target="_blank"
                    icon="i-simple-icons-github" aria-label="GitHub" class="ml-3" />
            </UTooltip>
        </template>
    </UHeader>
</template>
