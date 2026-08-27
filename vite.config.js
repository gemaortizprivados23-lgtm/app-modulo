import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages publica la aplicación dentro de /app-modulo/
export default defineConfig({
  base: '/app-modulo/',
  plugins: [react()],
})
