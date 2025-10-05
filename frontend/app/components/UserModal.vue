<!-- components/UserModal.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useStateStore } from '~/stores/useStateStore'

const stateStore = useStateStore()
const isOpen = computed(() => !!stateStore.selectedUserId)
const user = computed(() => stateStore.selectedUserData)
</script>

<template>
    <transition name="fade">
        <div v-if="isOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
                class="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-4xl shadow-lg relative max-h-[90vh] overflow-hidden">
                <button @click="stateStore.clearSelection()"
                    class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10">
                    ✕
                </button>

                <p class="text-sm text-gray-500 mb-4 pr-8">
                    Lat: {{ user?.lat?.toFixed(4) }}, Lng: {{ user?.lng?.toFixed(4) }}
                </p>

                <!-- 🖼️ Posts -->
                <div v-if="user?.posts?.length" class="max-h-[calc(90vh-8rem)] overflow-y-auto">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <div v-for="post in user.posts" :key="post.id"
                            class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <img :src="post.original_image_url" class="w-full aspect-square object-cover"
                                alt="user upload" />
                            <div class="p-2 sm:p-3">
                                <p class="text-xs text-gray-400">
                                    {{ new Date(post.created_at).toLocaleString() }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="text-center text-gray-400 text-sm">
                    No posts found.
                </div>
            </div>
        </div>
    </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
