<template>
  <div>
    <div id="drag-drop-area" ref="uppyDashboard"></div>
  </div>
</template>

<script>
import { defineComponent, onMounted, ref } from "vue";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";
import Tus from "@uppy/tus";
import { supabase } from "~~/utils/supabase";

const SUPABASE_PROJECT_ID = "xawxdlsvwspnyhhxmpqz";
const STORAGE_BUCKET = "images";

const folder = "";
const supabaseStorageURL = `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/upload/resumable`;

export default defineComponent({
  name: "UppyDashboard",
  emits: ["uploaded"],
  setup(props, { emit }) {
    const uppyDashboard = ref(null);
    const currentLocation = ref(null);
    let uppy;

    // Function to get current location
    const getCurrentLocation = () => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by this browser.'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            
            try {
              // Reverse geocode to get location name
              const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoiamZheXoiLCJhIjoiY2x0cGNxaXl3MXh5ZTJrcGpmZ3p0MG9sNyJ9.9MKKhJazslC0rPQl3qKUDQ`
              );
              const data = await response.json();
              
              const locationName = data.features && data.features[0] 
                ? data.features[0].place_name 
                : `${latitude}, ${longitude}`;

              resolve({
                latitude,
                longitude,
                location_name: locationName,
                location: `POINT(${longitude} ${latitude})` // PostGIS geography format
              });
            } catch (error) {
              // Fallback if geocoding fails
              resolve({
                latitude,
                longitude,
                location_name: `${latitude}, ${longitude}`,
                location: `POINT(${longitude} ${latitude})`
              });
            }
          },
          (error) => {
            console.warn('Error getting location:', error);
            // Don't reject, just resolve with null so upload can continue
            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });
    };

    onMounted(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.error("No authenticated session found");
        return;
      }

      const currentSession = session;

      // Get user's current location
      try {
        currentLocation.value = await getCurrentLocation();
        console.log('Current location:', currentLocation.value);
      } catch (error) {
        console.warn('Could not get location:', error);
      }

      uppy = new Uppy()
        .use(Dashboard, {
          inline: true,
          limit: 10,
          target: "#drag-drop-area",
          showProgressDetails: true,
        })
        .use(Tus, {
          endpoint: supabaseStorageURL,
          headers: {
            authorization: `Bearer ${currentSession.access_token}`,
            apikey: currentSession.access_token,
          },
          uploadDataDuringCreation: true,
          chunkSize: 6 * 1024 * 1024,
          allowedMetaFields: [
            "bucketName",
            "objectName",
            "contentType",
            "cacheControl",
          ],
          onError: function (error) {
            console.log("Failed because: " + error);
          },
        });

      uppy.on("file-added", (file) => {
        const supabaseMetadata = {
          bucketName: STORAGE_BUCKET,
          objectName: folder ? `${folder}/${file.name}` : file.name,
          contentType: file.type,
        };

        file.meta = {
          ...file.meta,
          ...supabaseMetadata,
        };

        console.log("file added", file);
      });

      uppy.on("complete", async (result) => {
        const supabaseUrl = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
        const uploadedFile = result.successful[0];

        if (uploadedFile) {
          const imageUrl = `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${uploadedFile.meta.objectName}`;

          // Prepare post data with location information
          const postData = {
            original_image_url: imageUrl,
            user_id: currentSession.user.id,
          };

          // Add location data if available
          if (currentLocation.value) {
            postData.latitude = currentLocation.value.latitude;
            postData.longitude = currentLocation.value.longitude;
            postData.location_name = currentLocation.value.location_name;
            postData.location = currentLocation.value.location;
          }

          // Insert with authenticated user context and location data
          const { data, error } = await supabase
            .from("posts")
            .insert([postData])
            .select();

          if (error) {
            console.error("Failed to insert post:", error);
          } else {
            console.log("Successfully inserted post:", data);
            if (currentLocation.value) {
              console.log(`Post saved with location: ${currentLocation.value.location_name}`);
            } else {
              console.log("Post saved without location data");
            }
          }
        } else {
          console.log("No file was uploaded.");
        }
        emit("uploaded", true);
      });
    });

    // onBeforeUnmount(() => {
    //   if (uppy) {
    //     uppy.close();
    //   }
    // });

    return { uppyDashboard };
  },
});
</script>
