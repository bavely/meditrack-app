// app.config.js
import 'dotenv/config';

export default {
  expo: {
    name: 'meditrack-app',
    slug: 'meditrack-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'meditrackapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      // Added iOS bundleIdentifier for native builds
      bundleIdentifier: "com.bavely.meditrackapp", // IMPORTANT: Replace with your actual bundle identifier
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      // Added Android package name for native builds
      package: "com.bavely.meditrackapp", // IMPORTANT: Replace with your actual package name
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
      'react-native-edge-to-edge',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      GRAPHQL_API_URL: process.env.GRAPHQL_API_URL,
      // Added EAS project ID as required for EAS builds
      eas: {
        projectId: "ce52b448-f7c7-47be-952e-cd7d61a3d102" // IMPORTANT: This is the project ID from your EAS build output
      },
    },
  },
};
