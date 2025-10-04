<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = 'pk.eyJ1IjoidGhvbWFzLWJlcmtlbGV5IiwiYSI6ImNtZ2NvYTcyZDBvOHoybXBuZndyM28wbm4ifQ.VxNKayC7-Ky3yhLy3bm8dQ'

const mapContainer = ref(null)
const map = ref(null)

onMounted(() => {
    if (!mapContainer.value) {
        return
    }

    const mapInstance = new mapboxgl.Map({
        container: mapContainer.value,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-122.4194, 37.7749],
        zoom: 12,
    })

    mapInstance.on('style.load', () => {
        if (mapInstance.getLayer('add-3d-buildings')) {
            return
        }

        const layers = mapInstance.getStyle().layers
        const labelLayerId = layers?.find((layer) => layer.type === 'symbol')?.id

        mapInstance.addLayer(
            {
                id: 'add-3d-buildings',
                source: 'composite',
                'source-layer': 'building',
                filter: ['==', 'extrude', 'true'],
                type: 'fill-extrusion',
                minzoom: 15,
                paint: {
                    'fill-extrusion-color': '#aaa',
                    'fill-extrusion-height': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        15,
                        0,
                        15.05,
                        ['get', 'height'],
                    ],
                    'fill-extrusion-base': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        15,
                        0,
                        15.05,
                        ['get', 'min_height'],
                    ],
                    'fill-extrusion-opacity': 0.6,
                },
            },
            labelLayerId
        )
    })

    map.value = mapInstance
})

const reset = () => {
    map.value = null
}

onBeforeUnmount(() => {
    map.value?.remove()
    reset()
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
