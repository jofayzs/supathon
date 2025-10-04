// stores/useUserStore.ts
import { defineStore } from "pinia";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../utils/supabase";

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null as User | null,
    loading: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    avatarUrl: (state) =>
      state.user?.user_metadata?.avatar_url ??
      state.user?.user_metadata?.picture ??
      null,
    fullName: (state) =>
      state.user?.user_metadata?.full_name ??
      state.user?.user_metadata?.name ??
      "",
    email: (state) => state.user?.email ?? "",
  },

  actions: {
    async fetchUser() {
      this.loading = true;
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        this.user = data.user;
      } catch (err) {
        console.error("Error fetching user:", err.message);
        this.user = null;
      } finally {
        this.loading = false;
      }
    },

    setUser(user: User | null) {
      this.user = user;
    },

    async signOut() {
      await supabase.auth.signOut();
      this.user = null;
    },
  },
});
