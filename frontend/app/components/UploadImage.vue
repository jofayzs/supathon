<template>
  <div>
    <div id="drag-drop-area" ref="uppyDashboard"></div>
  </div>
</template>

<script>
import { defineComponent, onMounted, onBeforeUnmount, ref } from "vue";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";
import Tus from "@uppy/tus";

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
  setup() {
    const uppyDashboard = ref(null);
    let uppy;

    onMounted(() => {
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

      uppy.on("complete", (result) => {
        console.log("Upload complete:", result.successful);
      });
    });

    onBeforeUnmount(() => {
      if (uppy) {
        uppy.close();
      }
    });

    return { uppyDashboard };
  },
});
</script>
