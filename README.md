# 📱 MediTrack Mobile App (Frontend)

**MediTrack** is a mobile-first medication manager built using **React Native**, **Expo Router**, **GraphQL**, **Tailwind CSS**, and **Auth0**. It enables users to track prescriptions, receive reminders, scan labels with OCR, and get AI-powered dosage parsing.

---

## 🚀 Features

- 🔐 **Auth0 Authentication** (email/password & Google)
- 📸 **Label Scanner** with `expo-camera` + OCR
- ✂️ **On-device PHI Sanitization**
- 🧠 **AI Parsing** via backend GPT-4-turbo
- 🔔 **Medication Reminders** (Push/SMS)
- 💊 **Refill Predictions**
- 💬 **Chat Assistant** for dosage advice
- 🖼️ **Tailwind CSS** with NativeWind
- 🧭 **Expo Router 5** app structure
- 🌙 **Dark mode** support
- ⚛️ Global state with **Zustand**

---

## 📦 Project Structure

```bash
meditrack-app/
├── app/                     # Expo Router app directory
│   ├── (auth)/             # Login, signup, forgot password screens
│   ├── (tabs)/             # Dashboard, Assistant, Calendar, Profile tabs
│   ├── medication/         # Medication management screens
│   └── _layout.tsx         # Root layout w/ navigation
├── components/             # Reusable UI components
├── constants/              # App constants (colors, themes, etc.)
├── graphql/                # GraphQL queries and schemas
├── hooks/                  # Custom React hooks
├── services/               # API service functions
├── store/                  # Zustand state management stores
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions
├── assets/                 # Fonts, images, static assets
├── global.css              # Tailwind base styles
├── tailwind.config.js      # Tailwind 3.x configuration
├── babel.config.js         # NativeWind plugin
├── app.config.js           # Expo config
└── README.md
```

---

## 📥 Install & Run

```bash
# Create project (already done)
npx create-expo-app@latest meditrack-app

# Install dependencies
npm install

# Start the project
npm run start
```

---

## 🔧 Required Setup

### ✅ Auth0 Setup

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Create a new application (Type: Native)
3. Add callback/logout URLs:
   ```
   Callback:    exp://127.0.0.1:8081
   Logout:      exp://127.0.0.1:8081
   ```
4. Create `.env` file:
   ```env
   AUTH0_DOMAIN=your-domain.auth0.com
   AUTH0_CLIENT_ID=abc123xyz
   ```

5. Use `react-native-auth0@5.0.0-beta.1` and Expo WebView for login flow.

---

### ✅ Tailwind CSS Setup

```bash
npm install tailwindcss nativewind
npx tailwindcss init --ts
```

> `tailwind.config.ts` (simplified):
```ts
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

> `babel.config.js`:
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['nativewind/babel'],
  };
};
```

> `global.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 🔐 Authentication Flow

- WebView opens hosted Auth0 login
- On success:
  - Tokens saved to `expo-secure-store`
  - User ID extracted from JWT (`sub`)
  - If `sub.includes("google-oauth2")` → insert user from frontend manually

---

## 🧠 OCR + AI Flow

```ts
// 1. Capture image
const result = await ImagePicker.launchCameraAsync();
// 2. Extract text
const text = await TextRecognition.recognize(result.assets[0].uri);
// 3. Sanitize text (regex)
// 4. Send to backend: POST /parse-dosage
// 5. Backend returns structured JSON (name, dosage, frequency...)
```

---

## 📲 Expo Commands

| Script         | Description               |
|----------------|---------------------------|
| `npm start`    | Run Metro Bundler         |
| `npm run ios`  | Open iOS simulator         |
| `npm run android` | Open Android emulator   |
| `npm run web`  | Run web version            |
| `npm run lint` | Run ESLint                 |
| `npm run reset-project` | Clear Metro + Cache |

---

## ✅ Dependencies Overview

- **Expo**: App shell and native modules
- **Expo Router v5**: File-based routing
- **React Native WebView**: Auth0 login
- **Auth0 SDK**: Secure token flow
- **Zustand**: App state management
- **Tailwind + NativeWind**: UI styling
- **Text Recognition**: OCR for labels
- **Apollo/GraphQL**: Backend integration

---

## 🧪 Dev Notes

- Fonts loaded via `expo-font`
- Push notifications + Twilio handled server-side
- Reminder logic uses hourly cron jobs (NestJS)
- Auth0 tokens are used for API authentication (JWT)
- Uses `expo-secure-store` for secure token storage

---

## 📄 License

MIT © 2025 MediTrack Team