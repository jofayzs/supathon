// useRealtimeLocation.ts
import { ref, onMounted, onUnmounted } from "vue";
import { supabase } from "../../utils/supabase";

export function useRealtimeLocation(userId?: string) {
  const positions = ref<Record<string, { lat: number; lng: number }>>({});
  const isConnected = ref(false);
  let channel: any;
  let interval: number | null = null;

  const start = async () => {
    // ✅ Explicitly declare broadcast config
    channel = supabase.channel("locations", {
      config: {
        broadcast: { self: true },
        presence: { key: userId },
      },
    });

    // 🛰️ Receive broadcast messages
    interface LocationPayload {
      id: string;
      lat: number;
      lng: number;
    }

    interface BroadcastEvent {
      payload: LocationPayload;
    }

    channel.on(
      "broadcast",
      { event: "location_update" },
      (payload: BroadcastEvent) => {
        const { id, lat, lng } = payload.payload;
        positions.value[id] = { lat, lng };
        // console.log("📡 Received location from", id, lat, lng);
      }
    );

    // 🔗 Connect to Realtime
    interface GeolocationPosition {
      lat: number;
      lng: number;
    }

    await channel.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") {
        isConnected.value = true;
        // console.log("✅ Connected to Supabase Realtime broadcast channel");

        // 🧭 Send current location every 5s
        interval = window.setInterval(async () => {
          try {
            const pos = await new Promise<GeolocationPosition>(
              (resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                  (p) =>
                    resolve({
                      lat: p.coords.latitude,
                      lng: p.coords.longitude,
                    }),
                  reject
                );
              }
            );

            await channel.send({
              type: "broadcast",
              event: "location_update",
              payload: { id: userId || "anonymous", ...pos },
            });
          } catch (e: unknown) {
            console.warn("⚠️ Failed to get location:", e);
          }
        }, 5000);
      }
    });
  };

  const stop = () => {
    if (interval) clearInterval(interval);
    if (channel) channel.unsubscribe();
    isConnected.value = false;
    // console.log("🛑 Disconnected from Supabase Realtime");
  };

  onMounted(start);
  onUnmounted(stop);

  return { positions, isConnected };
}
