// stores/useThemeStore.ts
import { defineStore } from "pinia";

export type ThemeMode = "light" | "dark";

export const useThemeStore = defineStore("theme", {
  state: () => ({
    mode: "light" as ThemeMode,
  }),
  getters: {
    isDark: (state) => state.mode === "dark",
  },
  actions: {
    toggleTheme() {
      this.mode = this.mode === "light" ? "dark" : "light";
    },
    setTheme(mode: ThemeMode) {
      this.mode = mode;
    },
  },
});
