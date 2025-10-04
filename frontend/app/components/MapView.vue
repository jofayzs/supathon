<script setup>
import { onMounted, ref } from 'vue'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = 'pk.eyJ1IjoidGhvbWFzLWJlcmtlbGV5IiwiYSI6ImNtZ2NvYTcyZDBvOHoybXBuZndyM28wbm4ifQ.VxNKayC7-Ky3yhLy3bm8dQ'

const mapContainer = ref(null)
const map = ref(null)

onMounted(() => {
    map.value = new mapboxgl.Map({
        container: mapContainer.value,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-122.4194, 37.7749], // San Francisco
        zoom: 12
    })

    new mapboxgl.Marker()
        .setLngLat([-122.4194, 37.7749])
        .setPopup(new mapboxgl.Popup().setText('Hello Supabase Select!'))
        .addTo(map.value)
})
</script>

<template>
    <div ref="mapContainer" class="map-container" />
</template>

<style scoped>
.map-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
}
</style>
