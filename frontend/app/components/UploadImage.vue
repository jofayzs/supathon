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

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhd3hkbHN2d3NwbnloaHhtcHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1OTgwNDgsImV4cCI6MjA3NTE3NDA0OH0.BaQo65NQHEJbB7trv8lnS5bYejkSyJMAnTLjo4soM2o";
const SUPABASE_PROJECT_ID = "xawxdlsvwspnyhhxmpqz";
const STORAGE_BUCKET = "images";
const BEARER_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhd3hkbHN2d3NwbnloaHhtcHF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU5ODA0OCwiZXhwIjoyMDc1MTc0MDQ4fQ.1BN4Ghgsh9KkG8lRAlwXx_56-zqMEOxNqh43FgVziQo";

const folder = "";
const supabaseStorageURL = `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/upload/resumable`;

export default defineComponent({
  name: "UppyDashboard",
  emits: ["uploaded"],
  setup(props, { emit }) {
    const uppyDashboard = ref(null);
    let uppy;

    onMounted(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.error("No authenticated session found");
        return;
      }

      const currentSession = session;

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
            authorization: `Bearer ${BEARER_TOKEN}`,
            apikey: SUPABASE_ANON_KEY,
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

          // Insert with authenticated user context
          const { data, error } = await supabase
            .from("posts")
            .insert([
              {
                original_image_url: imageUrl,
                user_id: currentSession.user.id, // Add user_id if your table has this column
              },
            ])
            .select();

          if (error) {
            console.error("Failed to insert post:", error);
          } else {
            console.log("Successfully inserted post:", data);
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
