<script setup lang="ts">
import MapView from "@/components/MapView.vue";
import UploadModal from "@/components/UploadModal.vue";
import LoginForm from "@/components/LoginForm.vue";
import Header from "@/components/Header.vue";

const user = ref(null);

const handleLoginSuccess = (userData) => {
  user.value = userData;
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br">
    <div v-if="!user" class="flex items-center justify-center min-h-screen p-4">
      <LoginForm @success="handleLoginSuccess" />
    </div>
    <div v-else>
      <div class="z-10!">
        <Header />
        <MapView />
        <UploadModal class="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10" />
      </div>
    </div>
  </div>
</template>
