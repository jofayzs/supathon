<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import mapboxgl from 'mapbox-gl'
import { useThemeStore } from '~/stores/useThemeStore'
import { useUserStore } from '~/stores/useUserStore'
import { useRealtimeLocation } from '~/composables/useRealtimeLocation'
import { supabase } from '../../utils/supabase'

const stateStore = useStateStore()

mapboxgl.accessToken =
    'pk.eyJ1IjoidGhvbWFzLWJlcmtlbGV5IiwiYSI6ImNtZ2NvYTcyZDBvOHoybXBuZndyM28wbm4ifQ.VxNKayC7-Ky3yhLy3bm8dQ'

const mapContainer = ref<HTMLDivElement | null>(null)
const map = ref<mapboxgl.Map | null>(null)
const mapLoaded = ref(false)
const markers = ref<Record<string, mapboxgl.Marker>>({})

const themeStore = useThemeStore()
const userStore = useUserStore()
const { positions, isConnected } = useRealtimeLocation(userStore.user?.id)

const getMapStyle = () =>
    themeStore.isDark
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/streets-v12'

/** 🧭 Create or update markers */
const updateMarkers = async (currentPositions: typeof positions.value) => {
    await nextTick()
    if (!map.value || !mapLoaded.value) {
        console.warn('⚠️ Map not yet ready for markers')
        return
    }

    for (const [id, { lat, lng }] of Object.entries(currentPositions)) {
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) continue

        // existing marker
        if (markers.value[id]) {
            markers.value[id].setLngLat([lng, lat])
            continue
        }

        // new marker
        // console.log(`🆕 Creating marker for ${id} at [${lng}, ${lat}]`)
        const el = document.createElement('div')
        el.className = id === userStore.user?.id ? 'marker-self' : 'marker-other'
        el.style.position = 'absolute'

        const popup = new mapboxgl.Popup({ offset: 25 }).setText(
            id === userStore.user?.id ? '📍 You' : `👤 ${id.slice(0, 5)}`
        )

        try {
            const debugId = `debug-${id}`
            if (!map.value.getSource(debugId)) {
                map.value.addSource(debugId, {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [lng, lat] },
                        properties: {},
                    },
                })
                map.value.addLayer({
                    id: debugId,
                    type: 'circle',
                    source: debugId,
                    paint: {
                        'circle-radius': 6,
                        'circle-color': id === userStore.user?.id ? '#2563eb' : '#10b981',
                        'circle-stroke-color': '#fff',
                        'circle-stroke-width': 2,
                    },
                })
                // Add pop up to the layer
                map.value.on('click', debugId, async (e) => {
                    console.log('🖱️ Clicked marker', id)

                    // 1️⃣ Fetch that user's posts from Supabase
                    const { data: posts, error } = await supabase
                        .from('posts')
                        .select('*')
                        .eq('user_id', id)
                        .order('created_at', { ascending: false })

                    console.log('📨 Fetched posts for', id, posts)

                    if (error) {
                        console.error('❌ Failed to fetch posts:', error.message)
                        return
                    }

                    // 2️⃣ Pass the posts into the store for modal display
                    stateStore.selectUser(id, { lat, lng, posts })
                })

                // Make cursor pointer on hover for all markers
                map.value.on('mouseenter', debugId, () => {
                    map.value!.getCanvas().style.cursor = 'pointer'
                })

                map.value.on('mouseleave', debugId, () => {
                    map.value!.getCanvas().style.cursor = ''
                })
            } else {
                // Update existing source data
                const source = map.value.getSource(debugId) as mapboxgl.GeoJSONSource
                source.setData({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [lng, lat] },
                    properties: {},
                })

            }
        } catch (err) {
            console.error('❌ Marker addTo(map) failed:', err)
        }
    }
}

/** 🗺️ Initialize Mapbox */
onMounted(() => {
    if (!mapContainer.value) return

    const mapInstance = new mapboxgl.Map({
        container: mapContainer.value,
        style: getMapStyle(),
        center: [-122.4194, 37.7749],
        zoom: 13,
    })

    map.value = mapInstance

    mapInstance.on('load', () => {
        mapLoaded.value = true
        // console.log('🗺️ Map fully loaded and ready for markers')
        updateMarkers(positions.value)
    })

    // optional 3D buildings
    mapInstance.on('style.load', () => {
        const layers = mapInstance.getStyle().layers
        const labelLayerId = layers?.find((l) => l.type === 'symbol')?.id
        if (mapInstance.getLayer('add-3d-buildings')) return

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
                    'fill-extrusion-height': ['get', 'height'],
                    'fill-extrusion-base': ['get', 'min_height'],
                    'fill-extrusion-opacity': 0.6,
                },
            },
            labelLayerId
        )
    })
})

/** 🌙 Update map style when theme changes */
watch(
    () => themeStore.isDark,
    () => {
        if (map.value) map.value.setStyle(getMapStyle())
    }
)

/** 🛰️ Watch realtime updates */
watch(
    positions,
    async (newPositions) => {
        if (!mapLoaded.value) return
        await updateMarkers(newPositions)
    },
    { deep: true }
)

/** 🧹 Cleanup */
onBeforeUnmount(() => {
    Object.values(markers.value).forEach((m) => m.remove())
    map.value?.remove()
})
</script>

<template>
    <div ref="mapContainer" class="map-container">
        <div v-if="!isConnected" class="status">
            <p>Connecting to Supabase Realtime...</p>
        </div>
    </div>
</template>

<style scoped>
.map-container {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
}

.marker-self {
    width: 18px;
    height: 18px;
    background: #2563eb;
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(37, 99, 235, 0.4);
}

.marker-other {
    width: 16px;
    height: 16px;
    background: #10b981;
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
}

.status {
    position: absolute;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.8);
    color: #1f2937;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    backdrop-filter: blur(6px);
}
</style>
