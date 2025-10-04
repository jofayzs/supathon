<script setup lang="ts">
const script = ref(null)
import MapView from '@/components/MapView.vue'
</script>

<script setup>
</script>


<template>
    <MapView />
    <div>
        <UFileUpload label="Drop your image here" class="w-96 min-h-48" />
    </div>
</template>
