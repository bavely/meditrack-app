/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */


const primaryColorLight = '#38bdf8';
const primaryColorDark = '#38bdf8';


export const Colors = {
  light: {
    text: '#0f172a',
    background: '#f1f5f9',
    surface: '#ffffff',
    primary: primaryColorLight,
    secondary: '#64748b',
    tint: primaryColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',

    tabIconSelected: primaryColorLight,
    input: '#e2e8f0',

  },
  dark: {
    text: '#f8fafc',
    background: '#0f172a',
    surface: '#1e293b',
    primary: primaryColorDark,
    secondary: '#94a3b8',
    tint: primaryColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',

    tabIconSelected: primaryColorDark,
    input: '#1e293b',

  },
};
