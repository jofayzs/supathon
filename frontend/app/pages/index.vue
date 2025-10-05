<script setup lang="ts">
import MapView from "@/components/MapView.vue";
import UploadModal from "@/components/UploadModal.vue";
import LoginForm from "@/components/LoginForm.vue";
import Header from "@/components/Header.vue";
import { useUserStore } from "~/stores/useUserStore";
import UserModal from "@/components/UserModal.vue";

const userStore = useUserStore();
const mapViewRef = ref(null);

const handleLoginSuccess = (userData) => {
  userStore.setUser(userData);
};

const handleUploadComplete = () => {
  // Refresh map markers when a new upload is completed
  if (mapViewRef.value) {
    mapViewRef.value.refreshPosts();
  }
};

// Check for existing session on page load
onMounted(async () => {
  await userStore.fetchUser();
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br">
    <div v-if="!userStore.isLoggedIn" class="flex items-center justify-center min-h-screen p-4">
      <LoginForm @success="handleLoginSuccess" />
    </div>
    <div v-else>
      <div class="z-10!">
        <Header />
        <MapView ref="mapViewRef" />
        <UploadModal @uploaded="handleUploadComplete"
          class="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10" />
      </div>
    </div>
  </div>
</template>
