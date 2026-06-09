import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const PREFIX = "plantpal_secure_";

/** Supabase auth storage adapter backed by Expo SecureStore. */
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === "web") {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(PREFIX + key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === "web") {
        localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(PREFIX + key, value);
    } catch {
      /* ignore */
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === "web") {
        localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(PREFIX + key);
    } catch {
      /* ignore */
    }
  },
};
