import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Plugin för att kopiera ikoner till build
    {
      name: 'copy-icons',
      closeBundle() {
        const iconsSource = join(__dirname, 'src/assets/icons');
        const iconsDest = join(__dirname, 'build/icons');
        if (existsSync(iconsSource)) {
          if (!existsSync(iconsDest)) {
            mkdirSync(iconsDest, { recursive: true });
          }
          const fs = require('fs');
          const files = fs.readdirSync(iconsSource);
          files.forEach((file: string) => {
            if (file.endsWith('.svg')) {
              copyFileSync(
                join(iconsSource, file),
                join(iconsDest, file)
              );
            }
          });
        }
      },
    },
  ],
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'build',
    publicDir: 'public',
  },
});

