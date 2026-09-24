import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The `base` is configurable so the app can be hosted under a sub-path
// (e.g. GitHub Pages: https://<user>.github.io/green-api-max-chat/).
// Set BASE_PATH at build time, otherwise it defaults to '/'.
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH ?? '/',
})
