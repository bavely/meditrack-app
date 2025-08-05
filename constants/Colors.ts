/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#38bdf8';
const tintColorDark = '#a1a1aa';
const white = '#FFFFFF';
const black = '#000000';

export const Colors = {
  light: {
    text: '#0c4a6e',
    background: 'rgba(8, 145, 178, 1)',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    input: 'rgba(186, 230, 253, 1)',
    card: white,
    foreground: white,
    shadow: black,
  },
  dark: {
    text: '#ECEDEE',
    background: 'rgba(8, 51, 68, 1)',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    input: 'rgba(12, 74, 110, 1)',
    card: '#1e293b',
    foreground: black,
    shadow: black,
  },
};
