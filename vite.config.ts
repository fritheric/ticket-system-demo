import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  base: '/ticket-system-demo/',
  preview: {
    allowedHosts: ['ticket-demo-test.loca.lt', '.loca.lt'],
  },
})
