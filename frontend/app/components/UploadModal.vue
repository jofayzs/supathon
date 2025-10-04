<script setup lang="ts">
import { ref } from 'vue'
import UploadImage from './UploadImage.vue'

const emit = defineEmits(['uploaded'])

const isUploaded = ref(false)
const isModalOpen = ref(false)

// Watch for changes in isUploaded and perform actions if needed
watch(isUploaded, (newValue) => {
    if (newValue) {
        emit('uploaded')
        closeModal()
    }
})

const closeModal = () => {
    isModalOpen.value = false
    isUploaded.value = false // Reset the upload state for future uploads
}
</script>

<template>
    <UModal title="Upload an Image" v-model:open="isModalOpen">
        <!-- Button that triggers modal -->
        <UButton icon="i-heroicons-camera" color="primary" variant="solid" size="xl" square
            @click="isModalOpen = true" />

        <template #body>
            <UploadImage @uploaded="isUploaded = true" />
        </template>
    </UModal>
</template>

<style scoped>
#uppy-dashboard {
    min-height: 300px;
}
</style>
