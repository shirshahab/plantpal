const apiBase =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  process.env.EXPO_PUBLIC_API_URL ??
  "https://getplantpal.com";

/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: "PlantPal",
  slug: "plantpal",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "plantpal",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#2D6A4F",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.getplantpal.app",
    infoPlist: {
      NSCameraUsageDescription:
        "PlantPal uses your camera to identify plants, diagnose plant health, and save progress photos.",
      NSPhotoLibraryUsageDescription:
        "PlantPal lets you upload plant photos from your library.",
      NSUserNotificationsUsageDescription: "PlantPal sends plant care reminders.",
      ITSAppUsesNonExemptEncryption: false,
    },
    associatedDomains: [
      "applinks:getplantpal.com",
      "applinks:www.getplantpal.com",
    ],
  },
  android: {
    package: "com.getplantpal.app",
    adaptiveIcon: {
      backgroundColor: "#2D6A4F",
      foregroundImage: "./assets/icon.png",
    },
    permissions: [
      "android.permission.CAMERA",
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.POST_NOTIFICATIONS",
    ],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          { scheme: "https", host: "getplantpal.com", pathPrefix: "/" },
          { scheme: "https", host: "www.getplantpal.com", pathPrefix: "/" },
          { scheme: "plantpal" },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#2D6A4F",
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission:
          "PlantPal uses your camera to identify plants, diagnose plant health, and save progress photos.",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "PlantPal lets you upload plant photos from your library.",
      },
    ],
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/icon.png",
        color: "#2D6A4F",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? "YOUR_EAS_PROJECT_ID",
    },
    EXPO_PUBLIC_API_BASE_URL: apiBase,
    EXPO_PUBLIC_API_URL: apiBase,
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
    EXPO_PUBLIC_REVENUECAT_IOS_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? "",
    EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? "",
  },
  owner: process.env.EXPO_OWNER ?? "your-expo-account",
};

export default config;
