<script setup lang="ts">
const script = ref(null);
import MapView from "@/components/MapView.vue";
import UploadImage from "@/components/UploadImage.vue";
import LoginForm from "@/components/LoginForm.vue";

const user = ref(null);

const handleLoginSuccess = (userData) => {
  user.value = userData;
};
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50"
  >
    <div v-if="!user" class="flex items-center justify-center min-h-screen p-4">
      <LoginForm @success="handleLoginSuccess" />
    </div>
    <div v-else>
      <div class="p-4">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-2xl font-bold">Welcome, {{ user.email }}</h1>
          <UButton @click="user = null" color="gray">Logout</UButton>
        </div>
        <MapView />
        <UploadImage />
      </div>
    </div>
  </div>
</template>
