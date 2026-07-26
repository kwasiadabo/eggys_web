import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// The source icon is already full-bleed ink (#2b2118). Override the generator's
// default white padding so apple-touch-icon / maskable icons don't show a white
// ring once the OS applies its own mask shape.
const preset = {
  ...minimal2023Preset,
  apple: {
    ...minimal2023Preset.apple,
    padding: 0,
    resizeOptions: { background: '#2b2118' },
  },
  maskable: {
    ...minimal2023Preset.maskable,
    resizeOptions: { background: '#2b2118' },
  },
};

export default defineConfig({
  preset,
  images: ['public/favicon.svg'],
});
