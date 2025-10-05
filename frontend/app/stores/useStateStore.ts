// stores/useStateStore.ts
import { defineStore } from "pinia";

export const useStateStore = defineStore("state", {
  state: () => ({
    selectedUserId: null as string | null,
    selectedUserData: null as Record<string, any> | null,
  }),

  actions: {
    selectUser(id: string, data?: Record<string, any>) {
      this.selectedUserId = id;
      this.selectedUserData = data || null;
    },
    clearSelection() {
      this.selectedUserId = null;
      this.selectedUserData = null;
    },
  },
});
