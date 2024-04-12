import { createSlice } from "@reduxjs/toolkit";

// Try to read the theme from localStorage, defaulting to 'light' if not found
const persistedTheme = localStorage.getItem("APDJ-THEME")
  ? localStorage.getItem("APDJ-THEME")
  : "light";

const initialState = {
  theme: persistedTheme,
  // Add other initial state properties here
};

const appSettingsSlice = createSlice({
  name: "appSettings",
  initialState,
  reducers: {
    setTheme: (state) => {
      const newTheme = state.theme === "light" ? "dark" : "light";
      state.theme = newTheme;
      // Persist the new theme to localStorage
      localStorage.setItem("APDJ-THEME", newTheme);
    },
    // Add other reducers here
  },
});

export const { setTheme } = appSettingsSlice.actions;
export default appSettingsSlice.reducer;
